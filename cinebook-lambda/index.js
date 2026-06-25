// index.js — CineBook TMDB Midnight Sync Lambda
// Fixed: S3 key path, smart new-movies-only fetch

const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const axios = require("axios");
const mongoose = require("mongoose");

// --- CONFIGURATION & ENV VARIABLES ---
const CONFIG = {
  mongoUri: process.env.MONGO_CONNECTION_STRING || process.env.MONGODB_URI,
  tmdbToken: process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_READ_ACCESS_TOKEN,
  tmdbRegion: process.env.TMDB_REGION || "IN",
  tmdbLanguage: process.env.TMDB_LANGUAGE || "en-US",
  s3Bucket: process.env.S3_BUCKET || "screenly-s3-bucket",
  awsRegion: process.env.AWS_REGION || "ap-south-1",
  pagesToFetch: Number(process.env.PAGES_TO_FETCH || 2),
};

// --- NATIVE CONCURRENCY LIMITER (no p-limit / ESM issues) ---
async function asyncPool(limit, tasks) {
  const results = [];
  const executing = new Set();
  for (const task of tasks) {
    const p = Promise.resolve().then(task);
    results.push(p);
    executing.add(p);
    p.finally(() => executing.delete(p));
    if (executing.size >= limit) await Promise.race(executing);
  }
  return Promise.allSettled(results);
}

// --- S3 CLIENT ---
const s3 = new S3Client({ region: CONFIG.awsRegion });

// --- MONGODB SCHEMA ---
const movieSchema = new mongoose.Schema(
  {
    tmdbId:           { type: Number, unique: true, sparse: true, index: true },
    title:            { type: String, required: true },
    description:      { type: String, required: true },
    duration:         { type: String, required: true },
    genre:            { type: [String], required: true },
    releaseDate:      { type: Date, required: true },
    languages:        { type: [String], required: true },
    originalLanguage: { type: String },
    certification:    { type: String, required: true },
    posterUrl:        { type: String, required: true },
    backdropUrl:      { type: String },
    tmdbPosterPath:   { type: String },
    tmdbBackdropPath: { type: String },
    rating:           { type: Number, required: true },
    votes:            { type: Number, required: true },
    popularity:       { type: Number, default: 0 },
    format:           { type: [String], default: ["2D"] },
    tmdbUpdatedAt:    { type: Date },
  },
  { timestamps: true }
);

const MovieModel = mongoose.models.Movie || mongoose.model("Movie", movieSchema);

// --- DB CONNECTION (cached across warm invocations) ---
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  console.log("🔌 Connecting to MongoDB...");
  cachedDb = await mongoose.connect(CONFIG.mongoUri);
  console.log("✅ MongoDB Connected.");
  return cachedDb;
}

// --- RETRY UTILITY ---
async function withRetry(fn, retries = 3, delayMs = 500) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      const wait = delayMs * (attempt + 1);
      console.warn(`⚠️ Attempt ${attempt + 1} failed. Retrying in ${wait}ms... (${err.message})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

// --- HELPER UTILITIES ---
const formatRuntime = (runtime) => {
  if (!runtime) return "0m";
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const getCertification = (releaseDates, region) => {
  const regionRelease = releaseDates?.results?.find((item) => item.iso_3166_1 === region);
  const cert = regionRelease?.release_dates?.find((item) => item.certification)?.certification;
  return cert || "UA";
};

const mapTmdbMovie = (movie, region) => {
  const languages = movie.spoken_languages?.length
    ? movie.spoken_languages.map((l) => l.english_name).filter(Boolean)
    : [movie.original_language ? movie.original_language.toUpperCase() : "EN"];

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
    : "https://placehold.co/780x1170?text=CineBook";

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : "";

  return {
    tmdbId:           movie.id,
    title:            movie.title,
    description:      movie.overview || "Movie details will be updated soon.",
    duration:         formatRuntime(movie.runtime),
    genre:            movie.genres?.map((g) => g.name).filter(Boolean) || ["Drama"],
    releaseDate:      movie.release_date ? new Date(movie.release_date) : new Date(),
    languages,
    originalLanguage: movie.original_language,
    certification:    getCertification(movie.release_dates, region),
    posterUrl,
    backdropUrl,
    tmdbPosterPath:   movie.poster_path || "",
    tmdbBackdropPath: movie.backdrop_path || "",
    rating:           Number((movie.vote_average || 0).toFixed(1)),
    votes:            movie.vote_count || 0,
    popularity:       movie.popularity || 0,
    format:           ["2D"],
    tmdbUpdatedAt:    new Date(),
  };
};

// --- S3 IDEMPOTENT UPLOADER ---
async function s3ObjectExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: CONFIG.s3Bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Uploads image to S3.
 * Key format: posters/{tmdbId}.jpg  or  backdrops/{tmdbId}.jpg
 * Matches exactly what frontend expects:
 *   https://<cloudfront>/posters/{tmdbId}.jpg
 */
async function uploadImageToS3(movieId, path, folder, size) {
  if (!path) return { status: "skipped" };

  // FIXED: was `/${movieId}.jpg` — now correctly `folder/movieId.jpg`
  const key = `${folder}/${movieId}.jpg`;

  if (await s3ObjectExists(key)) {
    return { status: "skipped", key };
  }

  return withRetry(async () => {
    const url = `https://image.tmdb.org/t/p/${size}${path}`;
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 15000,
      headers: { "User-Agent": "CineBook/1.0" },
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: CONFIG.s3Bucket,
        Key: key,
        Body: Buffer.from(response.data),
        ContentType: "image/jpeg",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return { status: "uploaded", key };
  });
}

/**
 * Smart fetch — only fetches movies NOT already in MongoDB.
 * 1. Gets all "now playing" IDs from TMDB.
 * 2. Cross-checks with DB to find new-only IDs.
 * 3. Fetches full details only for new movies.
 */
async function fetchNewMovieDetails() {
  const headers = { Authorization: `Bearer ${CONFIG.tmdbToken}` };

  // Step 1: Collect all now-playing TMDB IDs
  const nowPlayingIds = new Set();
  for (let page = 1; page <= CONFIG.pagesToFetch; page++) {
    const res = await withRetry(() =>
      axios.get("https://api.themoviedb.org/3/movie/now_playing", {
        params: { region: CONFIG.tmdbRegion, language: CONFIG.tmdbLanguage, page },
        headers,
      })
    );
    for (const item of res.data.results || []) nowPlayingIds.add(item.id);
  }

  console.log(`📋 TMDB Now Playing IDs fetched: ${nowPlayingIds.size}`);

  // Step 2: Find which IDs are already in DB
  const existingDocs = await MovieModel.find(
    { tmdbId: { $in: [...nowPlayingIds] } },
    { tmdbId: 1, _id: 0 }
  ).lean();

  const existingIdSet = new Set(existingDocs.map((m) => m.tmdbId));

  // Step 3: Only keep genuinely new IDs
  const newIds = [...nowPlayingIds].filter((id) => !existingIdSet.has(id));

  console.log(
    `🆕 New movies: ${newIds.length} | Already in DB (skipped): ${existingIdSet.size}`
  );

  if (newIds.length === 0) return [];

  // Step 4: Fetch full details for new movies in parallel
  const detailResults = await Promise.allSettled(
    newIds.map((id) =>
      withRetry(() =>
        axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
          params: { language: CONFIG.tmdbLanguage, append_to_response: "release_dates" },
          headers,
        })
      )
    )
  );

  const details = [];
  for (const result of detailResults) {
    if (result.status === "fulfilled") {
      details.push(result.value.data);
    } else {
      console.error("❌ Failed to fetch movie detail:", result.reason?.message);
    }
  }

  return details;
}

// --- LAMBDA HANDLER ---
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log("🚀 Starting CineBook TMDB Midnight Sync Cron...");

  if (CONFIG.pagesToFetch > 5) throw new Error("pagesToFetch too high, max is 5.");
  if (!CONFIG.tmdbToken || !CONFIG.mongoUri) {
    throw new Error("Missing critical env vars: TMDB_ACCESS_TOKEN or MONGO_CONNECTION_STRING.");
  }

  await connectToDatabase();

  try {
    // 1. Fetch only new movies
    const newMovies = await fetchNewMovieDetails();

    if (newMovies.length === 0) {
      console.log("✅ No new movies today. All already synced.");
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No new movies to sync.",
          database: { upsertedCount: 0, modifiedCount: 0 },
          s3: { uploaded: 0, skipped: 0, failed: 0 },
        }),
      };
    }

    // 2. Bulk upsert into MongoDB
    console.log(`💾 Bulk upserting ${newMovies.length} new movies into MongoDB...`);
    const bulkOps = newMovies.map((movie) => ({
      updateOne: {
        filter: { tmdbId: movie.id },
        update: { $set: mapTmdbMovie(movie, CONFIG.tmdbRegion) },
        upsert: true,
      },
    }));

    const bulkResult = await MovieModel.bulkWrite(bulkOps, { ordered: false });
    const upsertedCount = bulkResult.upsertedCount || 0;
    const modifiedCount = bulkResult.modifiedCount || 0;

    console.log(`✅ DB Done: ${upsertedCount} Added, ${modifiedCount} Updated.`);

    // 3. Upload S3 assets for new movies only
    console.log(`☁️ Uploading S3 assets for ${newMovies.length} movies...`);

    const uploadTasks = [];
    newMovies.forEach((m) => {
      if (m.poster_path) {
        uploadTasks.push(async () => {
          const res = await uploadImageToS3(m.id, m.poster_path, "posters", "w780");
          return { type: "poster", id: m.id, ...res };
        });
      }
      if (m.backdrop_path) {
        uploadTasks.push(async () => {
          const res = await uploadImageToS3(m.id, m.backdrop_path, "backdrops", "w1280");
          return { type: "backdrop", id: m.id, ...res };
        });
      }
    });

    const s3Results = await asyncPool(5, uploadTasks);

    const stats = { uploaded: 0, skipped: 0, failed: 0 };
    s3Results.forEach((r) => {
      if (r.status === "fulfilled") {
        r.value?.status === "skipped" ? stats.skipped++ : stats.uploaded++;
      } else {
        stats.failed++;
        console.error("❌ S3 Upload Failure:", r.reason);
      }
    });

    console.log(
      `✅ S3 Done | Uploaded: ${stats.uploaded} | Skipped: ${stats.skipped} | Failed: ${stats.failed}`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "TMDB Sync Completed successfully.",
        database: { upsertedCount, modifiedCount },
        s3: stats,
      }),
    };
  } catch (error) {
    console.error("💥 Lambda Execution Error:", error);
    throw error;
  }
};
