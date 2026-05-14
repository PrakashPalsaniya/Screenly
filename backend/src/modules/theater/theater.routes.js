const express = require("express");

const TheaterController = require("./theater.controller");
const { validate } = require("../../middlewares/validate");
const { TheaterSchema } = require("./theater.validation");
const { isVerifiedUser, isAdmin } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/",
  isVerifiedUser,
  isAdmin,
  validate(TheaterSchema),
  TheaterController.createTheater
);

router.get("/", TheaterController.getTheaters);
router.get("/:id", TheaterController.getTheaterById);

module.exports = router;