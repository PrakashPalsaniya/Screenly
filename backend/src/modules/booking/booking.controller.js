const BookingService = require("./booking.service");

const createBookingHandler = async (req, res, next) => {
  try {
    const booking = await BookingService.createBooking(req.body, req.user._id);

    res.status(201).json({
      success: true,
      message: "Booking successful!",
      booking,
    });
  } catch (error) {
    next(error);
  }
};

const getUserBookingsHandler = async (req, res, next) => {
  try {
    const bookings = await BookingService.getAllBookings(req.user._id);

    res.status(200).json({
      success: true,
      message: "User bookings fetched successfully!",
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminBookingsHandler = async (req, res, next) => {
  try {
    const bookings = await BookingService.getAllBookingsAdmin();

    res.status(200).json({
      success: true,
      message: "Admin bookings fetched successfully!",
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBookingHandler,
  getUserBookingsHandler,
  getAdminBookingsHandler,
};