const { MovieModel } = require("./movie.model");

// 1. createMovie
const createMovie = async (movie) => {
  return await MovieModel.create(movie);
};

// 2. getAllMovies — with server-side pagination
const getAllMovies = async ({ page = 1, limit = 12 } = {}) => {
  const skip = (page - 1) * limit;

  const [movies, total] = await Promise.all([
    MovieModel.find().sort({ releaseDate: -1 }).skip(skip).limit(limit),
    MovieModel.countDocuments(),
  ]);

  return {
    movies,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// 3. getAllMoviesUnpaginated — used by Admin panel (needs full list for show creation)
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