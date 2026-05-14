"use strict";

const redis = require("../config/redis");

/**
 * SOCKET HANDLERS - SEAT LOCKING & CONCURRENCY CONTROL
 *
 * Architecture:
 * - FIX 1: Atomic Redis SET NX EX (prevents race conditions)
 * - FIX 2: Lock acknowledgment before checkout navigation
 * - FIX 3: Active cleanup on disconnect + user-locks tracking
 */

const registerSocketHandlers = (socket, io) => {
  const userId = socket.handshake.auth?.userId;
  const userEmail = socket.handshake.auth?.userEmail;

  socket.data.userId = userId;
  socket.data.userEmail = userEmail;

  /**
   * USER JOINS A SHOW ROOM
   * ----------------------
   * When a user opens the seat layout page,
   * we send all currently locked seats.
   */
  socket.on("join-show", async ({ showId }) => {
    try {
      if (!showId) {
        console.log(`⚠️  join-show: Missing showId`);
        return;
      }

      socket.join(showId);
      socket.data.showId = showId;

      console.log(`✅ Socket ${socket.id} (User: ${userId}) joined show ${showId}`);

      // Fetch all locked seats from Redis SET
      // Key: locked-seats:<showId> -> ["A1","A2","B5"]
      const lockedSeats = await redis.smembers(`locked-seats:${showId}`);
      const activeLockedSeats = [];

      // Validate each locked seat still has an active lock key (TTL not expired)
      for (const seatId of lockedSeats) {
        const lockKey = `seat-lock:${showId}:${seatId}`;
        const exists = await redis.exists(lockKey);

        if (exists) {
          activeLockedSeats.push(seatId);
        } else {
          // Clean up stale entries where TTL expired but set was not cleaned
          await redis.srem(`locked-seats:${showId}`, seatId);
        }
      }

      socket.emit("locked-seats-initials", { seatIds: activeLockedSeats });
      console.log(`📤 Sent ${activeLockedSeats.length} locked seats to ${userId}`);
    } catch (error) {
      console.error(`❌ join-show error:`, error);
    }
  });

  /**
   * LOCK SEATS
   * ----------
   * FIX 1: Atomic SET NX EX — no race window between GET and SET.
   * FIX 2: Emits lock-success / lock-failed so frontend can wait
   *         for acknowledgment before navigating to checkout.
   *
   * If ANY seat fails, ALL successful locks in this batch are rolled back.
   */
  socket.on("lock-seats", async ({ showId, seatIds, userId: clientUserId }) => {
    try {
      if (!seatIds?.length || !showId || !clientUserId) {
        console.log(`⚠️  lock-seats: Missing required params`);
        socket.emit("lock-failed", {
          reason: "Missing seat IDs or show ID",
          failedSeats: seatIds || [],
        });
        return;
      }

      socket.data.showId = showId;
      socket.data.userId = clientUserId;

      const lockedSeatsSet = `locked-seats:${showId}`;
      const userLocksSet   = `user-locks:${clientUserId}`;
      const failedSeats    = [];
      const successfulLocks = [];

      // ABUSE PREVENTION: Check if user is hoarding locks
      const currentLocksCount = await redis.scard(userLocksSet);
      if (currentLocksCount + seatIds.length > 10) {
        console.log(`⚠️  ${clientUserId} exceeded lock limit. Current: ${currentLocksCount}, Requested: ${seatIds.length}`);
        socket.emit("lock-failed", {
          reason: "Lock limit exceeded",
          failedSeats: seatIds,
          message: "You can only lock a maximum of 10 seats at a time. Please complete or release existing bookings.",
        });
        return;
      }

      // STEP 1: Attempt atomic lock for each seat
      for (const seatId of seatIds) {
        const seatLockKey = `seat-lock:${showId}:${seatId}`;

        // SET NX EX — only sets if key does not exist (atomic, no race)
        const result = await redis.set(seatLockKey, clientUserId, "NX", "EX", 300);

        if (result === null) {
          // Already locked by another user
          failedSeats.push(seatId);
        } else {
          successfulLocks.push(seatId);
          await redis.sadd(lockedSeatsSet, seatId);
          await redis.sadd(userLocksSet, seatLockKey);
          await redis.expire(userLocksSet, 300);
        }
      }

      // STEP 2: If any seat failed, roll back all locks acquired in this batch
      if (failedSeats.length > 0) {
        console.log(
          `⚠️  ${clientUserId}: ${failedSeats.length}/${seatIds.length} seats already locked — rolling back`
        );

        for (const seatId of successfulLocks) {
          const seatLockKey = `seat-lock:${showId}:${seatId}`;
          await redis.del(seatLockKey);
          await redis.srem(lockedSeatsSet, seatId);
          await redis.srem(userLocksSet, seatLockKey);
        }

        // FIX 2: Frontend listens for this before navigating
        socket.emit("lock-failed", {
          showId,
          failedSeats,
          message: `Seats ${failedSeats.join(", ")} were just taken. Please choose others.`,
        });

        // Broadcast so other clients' UIs reflect unavailability
        socket.to(showId).emit("seat-locked", {
          showId,
          seatIds: failedSeats,
          userId: "system",
        });

        return;
      }

      // STEP 3: All locks successful — send ack
      // FIX 2: Frontend waits for this event before calling navigate()
      socket.emit("lock-success", {
        showId,
        seatIds: successfulLocks,
        message: `${successfulLocks.length} seat(s) locked for 5 minutes`,
      });

      console.log(`✅ ${clientUserId} locked seats:`, successfulLocks);

      socket.to(showId).emit("seat-locked", {
        showId,
        seatIds: successfulLocks,
        userId: clientUserId,
      });
    } catch (error) {
      console.error(`❌ lock-seats error:`, error);
      socket.emit("lock-failed", {
        reason: "Server error",
        failedSeats: seatIds || [],
      });
    }
  });

  /**
   * UNLOCK SEATS
   * ------------
   * Triggered when user leaves checkout or cancels booking.
   */
  socket.on("unlock-seats", async ({ showId, seatIds, userId: clientUserId }) => {
    try {
      if (!showId || !seatIds?.length) {
        console.log(`⚠️  unlock-seats: Missing required params`);
        return;
      }

      const lockedSeatsSet = `locked-seats:${showId}`;
      const userLocksSet   = `user-locks:${clientUserId}`;
      const unlockedSeats = [];

      for (const seatId of seatIds) {
        const seatLockKey = `seat-lock:${showId}:${seatId}`;
        const owner = await redis.get(seatLockKey);

        if (owner === clientUserId) {
          await redis.del(seatLockKey);
          await redis.srem(lockedSeatsSet, seatId);
          await redis.srem(userLocksSet, seatLockKey);
          unlockedSeats.push(seatId);
        }
      }

      console.log(`🔓 ${clientUserId} unlocked seats:`, seatIds);

      if (unlockedSeats.length === 0) {
        return;
      }

      socket.to(showId).emit("seat-unlocked", {
        showId,
        seatIds: unlockedSeats,
        userId: clientUserId,
      });
    } catch (error) {
      console.error(`❌ unlock-seats error:`, error);
    }
  });

  /**
   * BOOKING CONFIRMED
   * -----------------
   * Called after payment succeeds and Mongo booking is committed.
   * Clears Redis locks and broadcasts final BOOKED state to the room.
   */
  socket.on("booking-confirmed", async ({ showId, seatIds, userId: clientUserId }) => {
    try {
      if (!showId || !seatIds?.length) {
        console.log(`⚠️  booking-confirmed: Missing required params`);
        return;
      }

      const lockedSeatsSet = `locked-seats:${showId}`;
      const userLocksSet   = `user-locks:${clientUserId}`;

      for (const seatId of seatIds) {
        const seatLockKey = `seat-lock:${showId}:${seatId}`;
        const owner = await redis.get(seatLockKey);

        if (owner === clientUserId) {
          await redis.del(seatLockKey);
          await redis.srem(lockedSeatsSet, seatId);
          await redis.srem(userLocksSet, seatLockKey);
        }
      }

      // Clean up user-locks set if empty
      const remainingLocks = await redis.scard(userLocksSet);
      if (remainingLocks === 0) {
        await redis.del(userLocksSet);
      }

      console.log(`🎬 ${clientUserId} booking confirmed for seats:`, seatIds);

      socket.to(showId).emit("seats-booked", {
        showId,
        seatIds,
        userId: clientUserId,
      });
    } catch (error) {
      console.error(`❌ booking-confirmed error:`, error);
    }
  });

  /**
   * SOCKET DISCONNECT
   * -----------------
   * FIX 3: Actively release locks instead of waiting for TTL to expire.
   *
   * Flow:
   *  1. Read user-locks:<userId> set to find all seat keys this user owns
   *  2. Verify ownership (guard against stale set entries)
   *  3. Delete each lock and remove from locked-seats:<showId>
   *  4. Broadcast seat-unlocked so other clients update immediately
   *  5. Delete the user-locks tracking set
   */
  socket.on("disconnect", async (reason) => {
    try {
      const showId           = socket.data.showId;
      const disconnectUserId = socket.data.userId;

      console.log(
        `❌ Socket ${socket.id} (User: ${disconnectUserId}) disconnected — reason: ${reason}`
      );

      if (!disconnectUserId || !showId) {
        console.log(`⚠️  No userId/showId to clean up`);
        return;
      }

      const userLocksSet  = `user-locks:${disconnectUserId}`;
      const userLocks     = await redis.smembers(userLocksSet);

      if (userLocks.length === 0) return;

      console.log(`🔄 Cleaning up ${userLocks.length} lock(s) for user ${disconnectUserId}`);

      const lockedSeatsSet = `locked-seats:${showId}`;
      const unlockedSeats  = [];

      for (const lockKey of userLocks) {
        try {
          const owner = await redis.get(lockKey);

          // Only release locks we actually own — prevents accidental unlock
          // of a seat that was re-locked by another user before we cleaned up
          if (owner === disconnectUserId) {
            // Key format: seat-lock:<showId>:<seatId>
            const seatId = lockKey.split(":")[2];
            await redis.del(lockKey);
            await redis.srem(lockedSeatsSet, seatId);
            unlockedSeats.push(seatId);
          }
        } catch (err) {
          console.error(`❌ Error cleaning lock ${lockKey}:`, err);
        }
      }

      // Remove the tracking set
      await redis.del(userLocksSet);

      if (unlockedSeats.length > 0) {
        console.log(`📤 Broadcasting ${unlockedSeats.length} released seat(s):`, unlockedSeats);

        socket.to(showId).emit("seat-unlocked", {
          showId,
          seatIds: unlockedSeats,
          userId: disconnectUserId,
          reason: "User disconnected",
        });
      }
    } catch (error) {
      console.error(`❌ Disconnect cleanup error:`, error);
    }
  });
};

module.exports = { registerSocketHandlers };
