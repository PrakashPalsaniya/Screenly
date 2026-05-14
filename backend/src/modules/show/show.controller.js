const ShowService = require("./show.service");

const createShow = async (req, res, next) => {
  try {
    const show = await ShowService.createShow(req.body);
    res.status(201).json(show);
  } catch (error) {
    next(error);
  }
};

const createBulkShows = async (req, res, next) => {
  try {
    const result = await ShowService.createBulkShows(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getShowsByMovieDateLocation = async (req, res, next) => {
  try {
    const { movieId, state, date } = req.query;
    const shows = await ShowService.getShowsByMovieDateLocation(
      movieId,
      date,
      state
    );

    res.status(200).json(shows);
  } catch (error) {
    next(error);
  }
};

const getShowById = async (req, res, next) => {
  try {
    const show = await ShowService.getShowById(req.params.id);
    res.status(200).json(show);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShow,
  createBulkShows,
  getShowsByMovieDateLocation,
  getShowById,
};