const { MovieModel } = require("./movie.model");

// 1. createMovie
const createMovie = async (movie) => {
  return await MovieModel.create(movie);
};

// 2. getAllMovies — server-side pagination + filtering + sorting
const getAllMovies = async ({ page = 1, limit = 12, search, genre, language, sort } = {}) => {
  const skip = (page - 1) * limit;

  // Build filter query
  const filter = {};

  if (search?.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };
    filter.$or = [
      { title: searchRegex },
      { genre: searchRegex },
    ];
  }
  if (genre) {
    const genreList = genre.split(",").map((g) => g.trim()).filter(Boolean);
    if (genreList.length > 0) {
      filter.genre = { $in: genreList };
    }
  }
  if (language) {
    const languageList = language.split(",").map((l) => l.trim()).filter(Boolean);
    if (languageList.length > 0) {
      filter.languages = { $in: languageList };
    }
  }

  // Build sort
  const sortMap = {
    rating:   { rating: -1 },
    title:    { title: 1 },
    newest:   { releaseDate: -1 },
    featured: { releaseDate: -1 },
  };
  const sortQuery = sortMap[sort] || sortMap.featured;

  const [movies, total] = await Promise.all([
    MovieModel.find(filter).sort(sortQuery).skip(skip).limit(limit),
    MovieModel.countDocuments(filter),
  ]);

  return {
    movies,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
  };
};

// 3. getAllMoviesUnpaginated — Admin only (for show creation dropdown)
const getAllMoviesUnpaginated = async () => {
  return await MovieModel.find().sort({ releaseDate: -1 });
};

// 4. getMovieById
const getMovieById = async (id) => {
  return await MovieModel.findById(id);
};

// 5. getTopMovieByVotes
const getTopMovieByVotes = async (limit) => {
  return await MovieModel.find().sort({ votes: -1 }).limit(limit);
};

module.exports = {
  createMovie,
  getAllMovies,
  getAllMoviesUnpaginated,
  getMovieById,
  getTopMovieByVotes,
};