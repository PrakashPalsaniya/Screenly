const mongoose = require("mongoose");

const theaterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    logo: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    screens: {
      type: [
        {
          name: { type: String, required: true },
          formats: { type: [String], default: ["2D"] },
          audioTypes: { type: [String], default: ["Dolby 7.1"] },
        },
      ],
      default: () => [
        {
          name: "Screen 1",
          formats: ["2D", "3D"],
          audioTypes: ["Dolby 7.1"],
        },
        {
          name: "Screen 2",
          formats: ["2D", "IMAX"],
          audioTypes: ["Dolby Atmos"],
        },
        {
          name: "Screen 3",
          formats: ["2D", "PVR PXL"],
          audioTypes: ["Dolby 7.1"],
        },
      ],
    },
  },
  { timestamps: true }
);

const TheaterModel = mongoose.model("Theater", theaterSchema);

module.exports = {
  TheaterModel,
};