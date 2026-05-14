const { MovieModel } = require("./movie.model");
const { config } = require("../../config/config");

const {
  uploadPostersForMovies,
  uploadBackdropsForMovies,
} = require("../../utils/posterUploader");

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w780";

const DEFAULT_FORMATS = ["2D"];
const LANGUAGE_NAMES = new Intl.DisplayNames(["en"], { type: "language" });

const formatRuntime = (runtime) => {
  if (!runtime) return "0m";

  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;

  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const getLanguageName = (code) => {
  if (!code) return "Unknown";

  try {
    return LANGUAGE_NAMES.of(code) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
};

const getCertification = (releaseDates, region) => {
  const regionRelease = releaseDates?.results?.find(
    (item) => item.iso_3166_1 === region
  );

  const certification = regionRelease?.release_dates?.find(
    (item) => item.certification
  )?.certification;

  return certification || "UA";
};

const tmdbRequest = async (path, params = {}) => {
  const url = new URL(`${TMDB_BASE_URL}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  if (config.tmdbApiKey && !config.tmdbAccessToken) {
    url.searchParams.set("api_key", config.tmdbApiKey);
  }

  const response = await fetch(url, {
    headers: config.tmdbAccessToken
      ? { Authorization: `Bearer ${config.tmdbAccessToken}` }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  return response.json();
};

const mapTmdbMovie = async (movie, region) => {
  const languages = movie.spoken_languages?.length
    ? movie.spoken_languages
        .map((l) => l.english_name)
        .filter(Boolean)
    : [getLanguageName(movie.original_language)];

  // Use the raw TMDB image URL as a temporary placeholder.
  // After the S3 upload step, posterUrl and backdropUrl will be
  // overwritten with the CloudFront URL.
  const posterUrl = movie.poster_path
    ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : "https://placehold.co/780x1170?text=CineBook";

  const backdropUrl = movie.backdrop_path
    ? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}`
    : "";

  return {
    tmdbId: movie.id,
    title: movie.title,
    description: movie.overview || "Movie details will be updated soon.",
    duration: formatRuntime(movie.runtime),
    genre: movie.genres?.map((g) => g.name).filter(Boolean) || ["Drama"],
    releaseDate: movie.release_date ? new Date(movie.release_date) : new Date(),
    languages,
    originalLanguage: movie.original_language,
    certification: getCertification(movie.release_dates, region),
    posterUrl,
    backdropUrl,
    tmdbPosterPath: movie.poster_path || "",
    tmdbBackdropPath: movie.backdrop_path || "",
    rating: Number((movie.vote_average || 0).toFixed(1)),
    votes: movie.vote_count || 0,
    popularity: movie.popularity || 0,
    format: DEFAULT_FORMATS,
    tmdbUpdatedAt: new Date(),
  };
};

// 1. createMovie
const createMovie = async (movie) => {
  return await MovieModel.create(movie);
};

// 2. getAllMovies
const getAllMovies = async () => {
  return await MovieModel.find().sort({ releaseDate: -1 });
};

// 3. getMovieById
const getMovieById = async (id) => {
  return await MovieModel.findById(id);
};

// 4. getTopMovieByVotes
const getTopMovieByVotes = async (limit) => {
  return await MovieModel.find()
    .sort({ votes: -1 })
    .limit(limit);
};

const syncMoviesFromTmdb = async (options = {}) => {
  if (!config.tmdbAccessToken && !config.tmdbApiKey) {
    throw new Error("TMDB credentials are not configured");
  }

  const region = options.region || config.tmdbRegion;
  const language = options.language || config.tmdbLanguage;
  const pageLimit = Math.min(Number(options.pages || 1), 5);

  let upsertedCount = 0;
  let modifiedCount = 0;

  // Collect all TMDB movie objects across pages so we can batch-upload posters
  const allTmdbMovies = [];

  for (let page = 1; page <= pageLimit; page++) {
    const list = await tmdbRequest("/movie/now_playing", {
      region,
      language,
      page,
    });

    for (const item of list.results || []) {
      const details = await tmdbRequest(`/movie/${item.id}`, {
        language,
        append_to_response: "release_dates",
      });

      const mappedMovie = await mapTmdbMovie(details, region);

      const result = await MovieModel.updateOne(
        { tmdbId: mappedMovie.tmdbId },
        { $set: mappedMovie },
        { upsert: true }
      );

      upsertedCount += result.upsertedCount || 0;
      modifiedCount += result.modifiedCount || 0;

      // Keep the raw TMDB object so we can upload its poster to S3
      allTmdbMovies.push(details);
    }
  }

  if (allTmdbMovies.length > 0) {
    // ── S3 Poster & Backdrop Upload ───────────────────────────────────────────
    // Upload both posters and backdrops (idempotent).
    console.log(`[posterUploader] Starting upload for ${allTmdbMovies.length} movies…`);

    const uploadTargets = allTmdbMovies
      .filter((m) => m.poster_path || m.backdrop_path)
      .map((m) => ({ 
        tmdbId: m.id, 
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path 
      }));

    const posterResults = await uploadPostersForMovies(uploadTargets.filter(t => t.poster_path));
    const backdropResults = await uploadBackdropsForMovies(uploadTargets.filter(t => t.backdrop_path));

    console.log(
      `[posterUploader] Posters: uploaded=${posterResults.uploaded.length} skipped=${posterResults.skipped.length} failed=${posterResults.failed.length}`
    );
    console.log(
      `[posterUploader] Backdrops: uploaded=${backdropResults.uploaded.length} skipped=${backdropResults.skipped.length} failed=${backdropResults.failed.length}`
    );

    if (posterResults.failed.length > 0) console.warn("[posterUploader] Failed posters:", posterResults.failed);
    if (backdropResults.failed.length > 0) console.warn("[posterUploader] Failed backdrops:", backdropResults.failed);

    // S3 upload is done. The frontend builds CloudFront URLs from tmdbId
    // so no DB update is needed after this point.
  }
  // ─────────────────────────────────────────────────────────────────────────

  return { upsertedCount, modifiedCount };
};

module.exports = {
  createMovie,
  getAllMovies,
  getMovieById,
  getTopMovieByVotes,
  syncMoviesFromTmdb,
};