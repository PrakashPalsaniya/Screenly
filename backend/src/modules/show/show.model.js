const mongoose = require("mongoose");

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
      required: true,
    },
    screen: { type: String, required: true },
    location: { type: String, required: true },
    format: {
      type: String,
      enum: ["2D", "3D", "IMAX", "PVR PXL"],
      required: true,
    },
    audioType: { type: String, default: "Dolby Atmos" },
    startTime: { type: String, required: true },
    date: { type: String, required: true },
    priceMap: { type: Map, of: Number, required: true, default: {} },
    seatLayout: [],
  },
  { timestamps: true }
);

showSchema.index(
  { movie: 1, theater: 1, screen: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { screen: { $exists: true } } }
);

const ShowModel = mongoose.model("Show", showSchema);

module.exports = {
  ShowModel,
};