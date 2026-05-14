const dotenv = require("dotenv");

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT,
  databaseUrl: process.env.MONGO_CONNECTION_STRING || process.env.MONGODB_URI,
  databaseReplicaSet:
    process.env.MONGO_REPLICA_STRING || process.env.MONGODB_URI,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "5m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  accessTokenCookieMaxAge: Number(
    process.env.ACCESS_TOKEN_COOKIE_MAX_AGE_MS || 1000 * 60 * 5,
  ),
  refreshTokenCookieMaxAge: Number(
    process.env.REFRESH_TOKEN_COOKIE_MAX_AGE_MS || 1000 * 60 * 60 * 24 * 7,
  ),
  cookieSecure:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === "true"
      : isProduction,
  cookieSameSite: process.env.COOKIE_SAME_SITE || (isProduction ? "strict" : "lax"),
  hashingSecret: process.env.HASH_SECRET || process.env.JWT_SECRET,
  emailUsername: process.env.EMAIL_USERNAME,
  emailPassword: process.env.EMAIL_PASSWORD,
  redisHost: process.env.REDIS_HOST,
  redisPort: Number(process.env.REDIS_PORT || 6379),
  razorpayKey: process.env.RAZORPAY_API_KEY,
  razorpaySecret: process.env.RAZORPAY_SECRET_KEY,
  tmdbAccessToken:
    process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_READ_ACCESS_TOKEN,
  tmdbApiKey: process.env.TMDB_API_KEY,
  tmdbRegion: process.env.TMDB_REGION || "IN",
  tmdbLanguage: process.env.TMDB_LANGUAGE || "en-IN",
  // CloudFront CDN — images are served from here instead of direct S3
  cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN,
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://localhost",
  // AWS S3
  awsRegion: process.env.AWS_REGION || "ap-south-1",
  s3Bucket: process.env.S3_BUCKET || "screenly-s3-bucket",
});

module.exports = { config };
