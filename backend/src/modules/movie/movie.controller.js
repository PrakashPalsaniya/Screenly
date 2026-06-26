const MovieService = require("./movie.service");

const createMovie = async (req, res, next) => {
  try {
    const movie = await MovieService.createMovie(req.body);
    res.status(201).json({ movie });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/movies?page=1&limit=12
const getMovies = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));

    const result = await MovieService.getAllMovies({ page, limit });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/movies/all — Admin only, no pagination
const getAllMoviesUnpaginated = async (req, res, next) => {
  try {
    const movies = await MovieService.getAllMoviesUnpaginated();
    res.status(200).json({ movies });
  } catch (error) {
    next(error);
  }
};

const getMovieById = async (req, res, next) => {
  try {
    const movie = await MovieService.getMovieById(req.params.id);
    res.status(200).json({ movie });
  } catch (error) {
    next(error);
  }
};

const getTopRecommendedMovies = async (req, res, next) => {
  try {
    const topMovies = await MovieService.getTopMovieByVotes(5);
    res.status(200).json({ topMovies });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMovie,
  getMovies,
  getAllMoviesUnpaginated,
  getMovieById,
  getTopRecommendedMovies,
};