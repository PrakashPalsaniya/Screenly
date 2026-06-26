const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const axios = require("axios");
const mongoose = require("mongoose");

const CONFIG = {
  mongoUri: process.env.MONGO_CONNECTION_STRING || process.env.MONGODB_URI,
  tmdbToken: process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_READ_ACCESS_TOKEN,
  tmdbRegion: process.env.TMDB_REGION || "IN",
  tmdbLanguage: process.env.TMDB_LANGUAGE || "en-US",
  s3Bucket: process.env.S3_BUCKET || "screenly-s3-bucket",
  awsRegion: process.env.AWS_REGION || "ap-south-1",
  pagesToFetch: Number(process.env.PAGES_TO_FETCH || 2),
};

// Runs async tasks with max `limit` concurrent at a time
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

const s3 = new S3Client({ region: CONFIG.awsRegion });

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

// Reuse DB connection across warm Lambda invocations
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  console.log("🔌 Connecting to MongoDB...");
  cachedDb = await mongoose.connect(CONFIG.mongoUri);
  console.log("✅ MongoDB Connected.");
  return cachedDb;
}

// Retry with exponential backoff
async function withRetry(fn, retries = 3, delayMs = 500) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      const wait = delayMs * (attempt + 1);
      console.warn(`⚠️ Attempt ${attempt + 1} failed. Retrying in ${wait}ms...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

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
    posterUrl:        movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : "https://placehold.co/780x1170?text=Screenly",
    backdropUrl:      movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : "",
    tmdbPosterPath:   movie.poster_path || "",
    tmdbBackdropPath: movie.backdrop_path || "",
    rating:           Number((movie.vote_average || 0).toFixed(1)),
    votes:            movie.vote_count || 0,
    popularity:       movie.popularity || 0,
    format:           ["2D"],
    tmdbUpdatedAt:    new Date(),
  };
};

async function s3ObjectExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: CONFIG.s3Bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

// Key format: posters/{tmdbId}.jpg or backdrops/{tmdbId}.jpg
async function uploadImageToS3(movieId, path, folder, size) {
  if (!path) return { status: "skipped" };

  const key = `${folder}/${movieId}.jpg`;

  if (await s3ObjectExists(key)) return { status: "skipped", key };

  return withRetry(async () => {
    const response = await axios.get(`https://image.tmdb.org/t/p/${size}${path}`, {
      responseType: "arraybuffer",
      timeout: 15000,
      headers: { "User-Agent": "Screenly/1.0" },
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

// Fetches only movies not already stored in MongoDB
async function fetchNewMovieDetails() {
  const headers = { Authorization: `Bearer ${CONFIG.tmdbToken}` };

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

  console.log(`📋 TMDB Now Playing: ${nowPlayingIds.size} movies`);

  const existingDocs = await MovieModel.find(
    { tmdbId: { $in: [...nowPlayingIds] } },
    { tmdbId: 1, _id: 0 }
  ).lean();

  const existingIdSet = new Set(existingDocs.map((m) => m.tmdbId));
  const newIds = [...nowPlayingIds].filter((id) => !existingIdSet.has(id));

  console.log(`🆕 New: ${newIds.length} | Already in DB: ${existingIdSet.size}`);

  if (newIds.length === 0) return [];

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

  return detailResults
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value.data);
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log("🚀 Screenly TMDB Midnight Sync started...");

  if (!CONFIG.tmdbToken || !CONFIG.mongoUri) {
    throw new Error("Missing env vars: TMDB_ACCESS_TOKEN or MONGO_CONNECTION_STRING");
  }

  await connectToDatabase();

  try {
    const newMovies = await fetchNewMovieDetails();

    if (newMovies.length === 0) {
      console.log("✅ No new movies today.");
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No new movies to sync." }),
      };
    }

    // Bulk upsert into MongoDB
    const bulkOps = newMovies.map((movie) => ({
      updateOne: {
        filter: { tmdbId: movie.id },
        update: { $set: mapTmdbMovie(movie, CONFIG.tmdbRegion) },
        upsert: true,
      },
    }));

    const bulkResult = await MovieModel.bulkWrite(bulkOps, { ordered: false });
    console.log(`💾 DB: ${bulkResult.upsertedCount} added, ${bulkResult.modifiedCount} updated`);

    // Upload posters & backdrops to S3 (max 5 concurrent)
    const uploadTasks = [];
    newMovies.forEach((m) => {
      if (m.poster_path) {
        uploadTasks.push(async () => ({
          ...(await uploadImageToS3(m.id, m.poster_path, "posters", "w780")),
          type: "poster", id: m.id,
        }));
      }
      if (m.backdrop_path) {
        uploadTasks.push(async () => ({
          ...(await uploadImageToS3(m.id, m.backdrop_path, "backdrops", "w1280")),
          type: "backdrop", id: m.id,
        }));
      }
    });

    const s3Results = await asyncPool(5, uploadTasks);
    const stats = { uploaded: 0, skipped: 0, failed: 0 };
    s3Results.forEach((r) => {
      if (r.status === "fulfilled") r.value?.status === "skipped" ? stats.skipped++ : stats.uploaded++;
      else { stats.failed++; console.error("❌ S3 failure:", r.reason); }
    });

    console.log(`☁️ S3: uploaded=${stats.uploaded} skipped=${stats.skipped} failed=${stats.failed}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Sync completed.",
        database: { upsertedCount: bulkResult.upsertedCount, modifiedCount: bulkResult.modifiedCount },
        s3: stats,
      }),
    };
  } catch (error) {
    console.error("💥 Lambda error:", error);
    throw error;
  }
};
