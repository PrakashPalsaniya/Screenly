const { TheaterModel } = require("./theater.model");

const createTheater = async (data) => {
  return await TheaterModel.create(data);
};

const getAllTheaters = async () => {
  return await TheaterModel.find();
};

const getTheaterById = async (id) => {
  return await TheaterModel.findById(id);
};

const getTheaterByState = async (state) => {
  return await TheaterModel.find({
    state: { $regex: state, $options: "i" },
  });
};

module.exports = {
  createTheater,
  getAllTheaters,
  getTheaterById,
  getTheaterByState,
};