const express = require("express");

const ShowController = require("./show.controller");
const { isVerifiedUser, isAdmin } = require("../../middlewares/auth.middleware");
const { validate } = require("../../middlewares/validate");
const { ShowSchema, BulkShowSchema } = require("./show.validation");

const router = express.Router();

router.post(
  "/",
  isVerifiedUser,
  isAdmin,
  validate(ShowSchema),
  ShowController.createShow
);

router.post(
  "/bulk",
  isVerifiedUser,
  isAdmin,
  validate(BulkShowSchema),
  ShowController.createBulkShows
);

router.get("/", ShowController.getShowsByMovieDateLocation);
router.get("/:id", ShowController.getShowById);

module.exports = router;