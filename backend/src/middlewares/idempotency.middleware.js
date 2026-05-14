const redis = require("../config/redis");

/**
 * Middleware to handle idempotency for POST requests.
 * It checks for an 'Idempotency-Key' header and caches the response in Redis.
 */
const idempotencyHandler = (ttlSeconds = 86400) => {
  return async (req, res, next) => {
    // Only apply to POST requests
    if (req.method !== "POST") {
      return next();
    }

    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) {
      return next();
    }

    // Key format: idempotency:<userId or IP>:<key>
    const userIdentifier = req.user?._id || req.ip;
    const redisKey = `idempotency:${userIdentifier}:${idempotencyKey}`;

    try {
      // 1. Check if we already have a response for this key
      const cachedResponse = await redis.get(redisKey);
      if (cachedResponse) {
        const { status, body, headers } = JSON.parse(cachedResponse);
        
        // Restore headers if any
        if (headers) {
          Object.entries(headers).forEach(([k, v]) => res.set(k, v));
        }
        
        return res.status(status).json(body);
      }

      // 2. Intercept the response to cache it
      const originalJson = res.json;
      res.json = function (body) {
        // Only cache successful or client-side error responses (optional: only 2xx/4xx)
        if (res.statusCode < 500) {
          const responseToCache = JSON.stringify({
            status: res.statusCode,
            body: body,
            headers: res.getHeaders ? res.getHeaders() : {}
          });

          // Store in Redis with TTL (default 24h)
          redis.set(redisKey, responseToCache, "EX", ttlSeconds).catch(err => {
            console.error("Redis Idempotency Store Error:", err);
          });
        }

        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error("Idempotency Middleware Error:", error);
      next(); // Fallback: allow request to proceed if Redis fails
    }
  };
};

module.exports = { idempotencyHandler };
