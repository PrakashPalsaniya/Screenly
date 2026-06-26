const express = require("express");

const MovieController = require("./movie.controller");
const { validate } = require("../../middlewares/validate");
const { MovieSchema } = require("./movie.validation");
const { isVerifiedUser, isAdmin } = require("../../middlewares/auth.middleware");

const router = express.Router();

// Admin: create a single movie entry
router.post("/", isVerifiedUser, isAdmin, validate(MovieSchema), MovieController.createMovie);

// Admin: full unpaginated list for show creation
router.get("/all", isVerifiedUser, isAdmin, MovieController.getAllMoviesUnpaginated);

// Public: paginated movies — GET /movies?page=1&limit=12
router.get("/", MovieController.getMovies);
router.get("/recommended", MovieController.getTopRecommendedMovies);
router.get("/:id", MovieController.getMovieById);

module.exports = router;