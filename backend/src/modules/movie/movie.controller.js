const MovieService = require("./movie.service");

const createMovie = async (req, res, next) => {
  try {
    const movie = await MovieService.createMovie(req.body);
    res.status(201).json({ movie });
  } catch (error) {
    next(error);
  }
};

const getMovies = async (req, res, next) => {
  try {
    const movies = await MovieService.getAllMovies();
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

const syncMoviesFromTmdb = async (req, res, next) => {
  try {
    const result = await MovieService.syncMoviesFromTmdb(req.body || {});

    res.status(200).json({
      success: true,
      message: "Movies synced from TMDB",
      result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMovie,
  getMovies,
  getMovieById,
  getTopRecommendedMovies,
  syncMoviesFromTmdb,
};