const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, unique: true, sparse: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, required: true },
    genre: { type: [String], required: true },
    releaseDate: { type: Date, required: true },
    languages: { type: [String], required: true },
    originalLanguage: { type: String },
    certification: { type: String, required: true },
    posterUrl: { type: String, required: true },
    backdropUrl: { type: String },
    tmdbPosterPath: { type: String },
    tmdbBackdropPath: { type: String },
    rating: { type: Number, required: true },
    votes: { type: Number, required: true },
    popularity: { type: Number, default: 0 },
    format: { type: [String], default: ["2D"] },
    tmdbUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

const MovieModel = mongoose.model("Movie", movieSchema);

module.exports = {
  MovieModel,
};