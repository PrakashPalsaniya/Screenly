const express = require("express");

const MovieController = require("./movie.controller");
const { validate } = require("../../middlewares/validate");
const { MovieSchema } = require("./movie.validation");
const { isVerifiedUser, isAdmin } = require("../../middlewares/auth.middleware");

const router = express.Router();

// Admin: manually create a single movie entry
router.post(
  "/",
  isVerifiedUser,
  isAdmin,
  validate(MovieSchema),
  MovieController.createMovie
);

// Public: read endpoints
router.get("/", MovieController.getMovies);
router.get("/recommended", MovieController.getTopRecommendedMovies);
router.get("/:id", MovieController.getMovieById);

module.exports = router;