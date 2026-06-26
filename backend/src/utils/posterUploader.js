/**
 * posterUploader.js
 *
 * Uploads TMDB movie posters to S3 with:
 *  - p-limit(5)        → max 5 concurrent TMDB fetches + S3 puts at a time
 *  - HeadObjectCommand → idempotent (skip already-uploaded files)
 *  - Promise.allSettled → one failure never kills the whole batch
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const axios = require("axios");
// p-limit is ESM-only from v6+. We dynamically import it so this CJS file works fine.
let _pLimit = null;
async function getPLimit() {
  if (!_pLimit) {
    const mod = await import("p-limit");
    _pLimit = mod.default;
  }
  return _pLimit;
}

const { config } = require("../config/config");

// S3 client — credentials come from env (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)
const s3 = new S3Client({ region: config.awsRegion });

/**
 * Returns true if the poster key already exists in S3.
 * HeadObject is cheap — no data transfer, just metadata check.
 */
async function posterAlreadyExists(key) {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: config.s3Bucket,
        Key: key,
      })
    );
    return true; // object exists
  } catch {
    return false; // 404 NotFound → doesn't exist yet
  }
}

/**
 * Uploads a single movie poster to S3.
 * Returns { movieId, status: 'uploaded'|'skipped', key }
 */
async function uploadOnePoster(movie) {
  const key = `posters/${movie.tmdbId || movie.id}.jpg`;

  // Idempotency: skip if already in S3 (safe to re-run after crash)
  if (await posterAlreadyExists(key)) {
    return { movieId: movie.tmdbId || movie.id, status: "skipped", key };
  }

  const posterPath = movie.poster_path || movie.tmdbPosterPath;
  if (!posterPath) {
    throw new Error(`No poster_path for movie ${movie.tmdbId || movie.id}`);
  }

  // Fetch the image from TMDB as a binary buffer
  const response = await axios.get(
    `https://image.tmdb.org/t/p/w780${posterPath}`,
    {
      responseType: "arraybuffer",
      timeout: 15_000,
      headers: {
        // TMDB doesn't require auth for image CDN, but include a UA for safety
        "User-Agent": "Screenly/1.0",
      },
    }
  );

  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
      Body: Buffer.from(response.data),
      ContentType: "image/jpeg",
      // Posters are immutable for a given tmdbId — cache for 1 year
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { movieId: movie.tmdbId || movie.id, status: "uploaded", key };
}

/**
 * Uploads a single movie backdrop to S3.
 * Returns { movieId, status: 'uploaded'|'skipped', key }
 */
async function uploadOneBackdrop(movie) {
  const key = `backdrops/${movie.tmdbId || movie.id}.jpg`;

  // Idempotency: skip if already in S3
  if (await posterAlreadyExists(key)) {
    return { movieId: movie.tmdbId || movie.id, status: "skipped", key };
  }

  const backdropPath = movie.backdrop_path || movie.tmdbBackdropPath;
  if (!backdropPath) {
    throw new Error(`No backdrop_path for movie ${movie.tmdbId || movie.id}`);
  }

  // Fetch the image from TMDB
  const response = await axios.get(
    `https://image.tmdb.org/t/p/w1280${backdropPath}`,
    {
      responseType: "arraybuffer",
      timeout: 15_000,
      headers: { "User-Agent": "Screenly/1.0" },
    }
  );

  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
      Body: Buffer.from(response.data),
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { movieId: movie.tmdbId || movie.id, status: "uploaded", key };
}

/**
 * Uploads posters for an array of movies concurrently (max 5 at a time).
 *
 * @param {Array} movies  — each must have { tmdbId|id, poster_path|tmdbPosterPath }
 * @returns {{ uploaded, skipped, failed }}
 */
async function uploadPostersForMovies(movies) {
  const pLimit = await getPLimit();
  const limit = pLimit(5);

  const tasks = movies.map((movie) => limit(() => uploadOnePoster(movie)));
  const results = await Promise.allSettled(tasks);

  const uploaded = [];
  const skipped = [];
  const failed = [];

  for (const [i, result] of results.entries()) {
    if (result.status === "fulfilled") {
      result.value.status === "skipped"
        ? skipped.push(result.value)
        : uploaded.push(result.value);
    } else {
      failed.push({
        movieId: movies[i]?.tmdbId || movies[i]?.id,
        error: result.reason?.message || "Unknown error",
      });
    }
  }

  return { uploaded, skipped, failed };
}

/**
 * Uploads backdrops for an array of movies concurrently.
 */
async function uploadBackdropsForMovies(movies) {
  const pLimit = await getPLimit();
  const limit = pLimit(5);

  const tasks = movies.map((movie) => limit(() => uploadOneBackdrop(movie)));
  const results = await Promise.allSettled(tasks);

  const uploaded = [];
  const skipped = [];
  const failed = [];

  for (const [i, result] of results.entries()) {
    if (result.status === "fulfilled") {
      result.value.status === "skipped"
        ? skipped.push(result.value)
        : uploaded.push(result.value);
    } else {
      failed.push({
        movieId: movies[i]?.tmdbId || movies[i]?.id,
        error: result.reason?.message || "Unknown error",
      });
    }
  }

  return { uploaded, skipped, failed };
}

/**
 * Build the CloudFront CDN URL for a poster key.
 */
function getPosterUrl(posterKey) {
  if (!posterKey) return null;
  if (!config.cloudfrontDomain) {
    throw new Error("CLOUDFRONT_DOMAIN is not configured");
  }
  return `https://${config.cloudfrontDomain}/${posterKey}`;
}

/**
 * Uploads a theater logo to S3.
 * Key pattern: theaters/{brand}.avif (or .png/jpg)
 */
async function uploadTheaterLogo(brand, imageUrl) {
  const extension = imageUrl.split(".").pop() || "avif";
  const key = `theaters/${brand.toLowerCase()}.${extension}`;

  // Idempotency: skip if already in S3
  if (await posterAlreadyExists(key)) {
    return { brand, status: "skipped", key };
  }

  // Fetch the image
  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 15_000,
    headers: { "User-Agent": "Screenly/1.0" },
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
      Body: Buffer.from(response.data),
      ContentType: `image/${extension === "avif" ? "avif" : extension}`,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { brand, status: "uploaded", key };
}

/**
 * Build the CloudFront CDN URL for a theater logo.
 */
function getTheaterLogoUrl(brand) {
  if (!brand) return null;
  if (!config.cloudfrontDomain) {
    throw new Error("CLOUDFRONT_DOMAIN is not configured");
  }
  return `https://${config.cloudfrontDomain}/theaters/${brand.toLowerCase()}-logo.avif`;
}

module.exports = {
  uploadPostersForMovies,
  uploadBackdropsForMovies,
  uploadOnePoster,
  uploadOneBackdrop,
  uploadTheaterLogo,
  getPosterUrl,
  getTheaterLogoUrl,
};
