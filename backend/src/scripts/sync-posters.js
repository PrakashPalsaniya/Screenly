/**
 * sync-posters.js
 *
 * Standalone script: uploads posters for all movies in DB that
 * currently do not have a CloudFront-backed URL (i.e. not yet on S3).
 *
 * Run: node src/scripts/sync-posters.js
 *
 * This is fully idempotent — safe to re-run anytime.
 * Movies already on S3 are detected via HeadObject and skipped.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });

const mongoose = require("mongoose");
const { MovieModel } = require("../modules/movie/movie.model");
const { config } = require("../config/config");
const { uploadPostersForMovies, uploadBackdropsForMovies } = require("../utils/posterUploader");

async function main() {
  await mongoose.connect(config.databaseUrl);
  console.log("✅ Connected to MongoDB");

  const movies = await MovieModel.find({
    $or: [
      { tmdbPosterPath: { $exists: true, $ne: "" } },
      { tmdbBackdropPath: { $exists: true, $ne: "" } }
    ]
  })
    .select("tmdbId tmdbPosterPath tmdbBackdropPath")
    .lean();

  if (movies.length === 0) {
    console.log("No movies with TMDB paths found.");
    process.exit(0);
  }

  console.log(`Found ${movies.length} movies — uploading to S3…\n`);

  const posterTargets = movies.filter(m => m.tmdbPosterPath).map((m) => ({
    tmdbId: m.tmdbId,
    poster_path: m.tmdbPosterPath,
  }));

  const backdropTargets = movies.filter(m => m.tmdbBackdropPath).map((m) => ({
    tmdbId: m.tmdbId,
    backdrop_path: m.tmdbBackdropPath,
  }));

  const posterResults = await uploadPostersForMovies(posterTargets);
  const backdropResults = await uploadBackdropsForMovies(backdropTargets);

  console.log(`\n--- Posters ---`);
  console.log(`✅ Uploaded : ${posterResults.uploaded.length}`);
  console.log(`⏭️  Skipped  : ${posterResults.skipped.length}`);
  console.log(`❌ Failed   : ${posterResults.failed.length}`);

  console.log(`\n--- Backdrops ---`);
  console.log(`✅ Uploaded : ${backdropResults.uploaded.length}`);
  console.log(`⏭️  Skipped  : ${backdropResults.skipped.length}`);
  console.log(`❌ Failed   : ${backdropResults.failed.length}`);

  if (posterResults.failed.length > 0 || backdropResults.failed.length > 0) {
    console.warn("\nFailed uploads detected.");
    if (posterResults.failed.length > 0) {
      console.warn("Poster Errors:", posterResults.failed.map(f => `ID: ${f.movieId} Error: ${f.error}`).slice(0, 5));
    }
    if (backdropResults.failed.length > 0) {
      console.warn("Backdrop Errors:", backdropResults.failed.map(f => `ID: ${f.movieId} Error: ${f.error}`).slice(0, 5));
    }
  }

  // No DB update needed — frontend builds CloudFront URLs from tmdbId.
  console.log("\n✅ Done. Frontend uses CloudFront + tmdbId to display posters.");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
