const express = require("express");
const BookingController = require("./booking.controller");
const { isVerifiedUser, isAdmin } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", isVerifiedUser, BookingController.createBookingHandler);
router.get("/", isVerifiedUser, BookingController.getUserBookingsHandler);
router.get("/admin", isVerifiedUser, isAdmin, BookingController.getAdminBookingsHandler);

module.exports = router;