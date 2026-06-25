const { MovieModel } = require("./movie.model");

// 1. createMovie
const createMovie = async (movie) => {
  return await MovieModel.create(movie);
};

// 2. getAllMovies — Lambda keeps DB updated nightly via TMDB cron
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

module.exports = {
  createMovie,
  getAllMovies,
  getMovieById,
  getTopMovieByVotes,
};