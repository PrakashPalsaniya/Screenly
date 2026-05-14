const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const { generateBookingReference } = require("../../utils");
const { config } = require("../../config/config");
const redis = require("../../config/redis");

const BookingModel = require("./booking.model");
const { updateSeatStatus } = require("../show/show.service");
const {
  publishBookingEmail,
} = require("../notifications/rabbitmq.producer");

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const normalizeSeats = (seats) =>
  Array.isArray(seats)
    ? [...seats].map((seat) => String(seat).trim()).sort()
    : [];

const buildExpectedPaymentSignature = (orderId, paymentId) =>
  crypto
    .createHmac("sha256", config.razorpaySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

const assertPaymentMatchesBooking = async ({
  razorpay,
  paymentId,
  paymentOrderId,
  paymentSignature,
  bookingFee,
  showId,
  seats,
  userId,
}) => {
  if (!config.razorpaySecret) {
    throw createHttpError(500, "Payment gateway is not configured correctly");
  }

  const expectedSignature = buildExpectedPaymentSignature(
    paymentOrderId,
    paymentId
  );

  if (expectedSignature !== paymentSignature) {
    throw createHttpError(400, "Payment signature verification failed");
  }

  const [paymentDetails, orderDetails] = await Promise.all([
    razorpay.payments.fetch(paymentId),
    razorpay.orders.fetch(paymentOrderId),
  ]);

  const expectedAmountInPaise = Math.round(
    Number(bookingFee?.total || 0) * 100
  );
  const normalizedSeats = normalizeSeats(seats);
  const orderNotes = orderDetails.notes || {};

  if (paymentDetails.status !== "captured") {
    throw createHttpError(400, "Payment not successful!");
  }

  if (paymentDetails.order_id !== paymentOrderId) {
    throw createHttpError(400, "Payment does not belong to this order");
  }

  if (orderDetails.amount !== expectedAmountInPaise) {
    throw createHttpError(400, "Order amount does not match booking total");
  }

  if (paymentDetails.amount !== expectedAmountInPaise) {
    throw createHttpError(400, "Captured amount does not match booking total");
  }

  if (paymentDetails.currency !== "INR" || orderDetails.currency !== "INR") {
    throw createHttpError(400, "Unexpected payment currency");
  }

  if (orderNotes.userId && orderNotes.userId !== String(userId)) {
    throw createHttpError(403, "Order does not belong to the authenticated user");
  }

  if (orderNotes.showId && orderNotes.showId !== String(showId)) {
    throw createHttpError(400, "Order show does not match booking request");
  }

  if (
    orderNotes.seats &&
    orderNotes.seats !== normalizedSeats.join(",")
  ) {
    throw createHttpError(400, "Order seats do not match booking request");
  }

  if (
    orderNotes.amountInPaise &&
    Number(orderNotes.amountInPaise) !== expectedAmountInPaise
  ) {
    throw createHttpError(400, "Order total does not match booking request");
  }

  return { paymentDetails };
};

const isTransientTransactionError = (error) => {
  return (
    error?.errorLabels?.includes("TransientTransactionError") ||
    /Write conflict/i.test(error?.message || "")
  );
};

const assertSeatLocksOwnedByUser = async (showId, seats, userId) => {
  const ownerId = String(userId);
  const unavailableSeats = [];

  for (const seatId of seats) {
    const lockOwner = await redis.get(`seat-lock:${showId}:${seatId}`);
    if (lockOwner !== ownerId) {
      unavailableSeats.push(seatId);
    }
  }

  if (unavailableSeats.length > 0) {
    throw createHttpError(
      409,
      `Seat lock expired or unavailable for: ${unavailableSeats.join(
        ", "
      )}. Please select seats again.`
    );
  }
};

const createBooking = async (bookingData, userId) => {
  if (
    !bookingData.showId ||
    !bookingData.seats ||
    bookingData.seats.length === 0 ||
    !bookingData.paymentId ||
    !bookingData.paymentOrderId ||
    !bookingData.paymentSignature ||
    !bookingData.bookingFee
  ) {
    throw createHttpError(400, "Invalid booking data!");
  }

  const {
    showId,
    seats,
    paymentId,
    paymentOrderId,
    paymentSignature,
    bookingFee,
  } = bookingData;
  const normalizedSeats = normalizeSeats(seats);

  await assertSeatLocksOwnedByUser(showId, normalizedSeats, userId);

  const bookingRef = generateBookingReference();

  for (let attempt = 1; attempt <= 3; attempt++) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await assertSeatLocksOwnedByUser(showId, normalizedSeats, userId);

        const existingBooking = await BookingModel.findOne({
          showId,
          status: "CONFIRMED",
          seats: { $in: normalizedSeats },
        }).session(session);

      if (existingBooking) {
        throw createHttpError(
          409,
          "One or more of the requested seats are already booked!"
        );
      }

      const razorpay = new Razorpay({
        key_id: config.razorpayKey,
        key_secret: config.razorpaySecret,
      });

        const { paymentDetails } = await assertPaymentMatchesBooking({
          razorpay,
          paymentId,
          paymentOrderId,
          paymentSignature,
          bookingFee,
          showId,
          seats: normalizedSeats,
          userId,
        });

      // IDEMPOTENCY CHECK: If a booking with this paymentId already exists, return it.
      // This handles cases where the first request succeeded but the response was lost.
      const duplicateBooking = await BookingModel.findOne({ paymentId }).session(session);
      if (duplicateBooking) {
        await session.commitTransaction();
        session.endSession();
        return duplicateBooking;
      }

      const [booking] = await BookingModel.create(
        [
          {
            bookingRef,
            userId,
            showId,
            seats: normalizedSeats,
            status: "CONFIRMED",
            paymentId,
            paymentOrderId,
            paymentMethod: paymentDetails.method,
            bookingFee,
          },
        ],
        { session }
      );

      await updateSeatStatus(showId, normalizedSeats, "BOOKED", session);

      await session.commitTransaction();
      session.endSession();

      const bookingForEmail = await BookingModel.findById(booking._id)
        .populate({ path: "userId", select: "name email" })
        .populate({
          path: "showId",
          select: "startTime date screen location audioType",
          populate: [
            { path: "movie", select: "title posterUrl" },
            {
              path: "theater",
              select: "name location city state",
            },
          ],
        })
        .lean();

      if (bookingForEmail?.userId?.email && bookingForEmail?.showId?.movie) {
        const theater = bookingForEmail.showId.theater || {};

        const theaterLocation = [
          theater.location,
          theater.city,
          theater.state,
        ]
          .filter(Boolean)
          .join(", ");

        publishBookingEmail({
          userEmail: bookingForEmail.userId.email,
          userName: bookingForEmail.userId.name,
          bookingRef: bookingForEmail.bookingRef,
          movieTitle: bookingForEmail.showId.movie.title,
          posterUrl: bookingForEmail.showId.movie.posterUrl,
          theaterName: theater.name,
          theaterLocation,
          showDate: bookingForEmail.showId.date,
          showTime: bookingForEmail.showId.startTime,
          screen: bookingForEmail.showId.screen,
          audioType: bookingForEmail.showId.audioType,
          seats: bookingForEmail.seats,
          paymentMethod: bookingForEmail.paymentMethod,
          ticketPrice: bookingForEmail.bookingFee?.ticketPrice,
          convenienceFee: bookingForEmail.bookingFee?.convenience,
          totalAmount: bookingForEmail.bookingFee?.total,
        }).catch((emailError) => {
          console.error(
            "Booking confirmation email queue failed:",
            emailError?.message || emailError
          );
        });
      }

      return booking;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      if (attempt < 3 && isTransientTransactionError(error)) {
        continue;
      }

      throw error;
    }
  }
};

const getAllBookings = async (userId) => {
  const bookings = await BookingModel.find({ userId })
    .populate({
      path: "showId",
      select: "startTime date audioType",
      populate: [
        {
          path: "movie",
          select: "title posterUrl duration format",
        },
        {
          path: "theater",
          select: "name location city state",
        },
      ],
    })
    .sort({ createdAt: -1 });

  return bookings.filter((booking) => booking.showId);
};

const getAllBookingsAdmin = async () => {
  const bookings = await BookingModel.find({})
    .populate({
      path: "userId",
      select: "name email phone",
    })
    .populate({
      path: "showId",
      select: "startTime date audioType",
      populate: [
        {
          path: "movie",
          select: "title posterUrl duration format",
        },
        {
          path: "theater",
          select: "name location city state",
        },
      ],
    })
    .sort({ createdAt: -1 });

  return bookings.filter((booking) => booking.showId);
};

module.exports = {
  createBooking,
  getAllBookings,
  getAllBookingsAdmin,
  assertSeatLocksOwnedByUser,
};
