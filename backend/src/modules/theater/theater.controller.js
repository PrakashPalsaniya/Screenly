const TheaterService = require("./theater.service");

const createTheater = async (req, res, next) => {
  try {
    const theater = await TheaterService.createTheater(req.body);

    res.status(201).json({
      success: true,
      message: "Theater created successfully",
      data: theater,
    });
  } catch (error) {
    next(error);
  }
};

const getTheaters = async (req, res, next) => {
  try {
    const { state } = req.query;

    const theaters = state
      ? await TheaterService.getTheaterByState(state)
      : await TheaterService.getAllTheaters();

    res.status(200).json(theaters);
  } catch (error) {
    next(error);
  }
};

const getTheaterById = async (req, res, next) => {
  try {
    const theater = await TheaterService.getTheaterById(req.params.id);

    if (!theater) {
      return res.status(404).json({ message: "Theater not found" });
    }

    res.status(200).json(theater);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTheater,
  getTheaters,
  getTheaterById,
};