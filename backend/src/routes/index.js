const express = require("express");
const movieRouterModule = require("../modules/movie/movie.route");
const theaterRouterModule = require("../modules/theater/theater.routes");
const showRouterModule = require("../modules/show/show.routes");
const userRouterModule = require("../modules/user/user.route");
const authRouter = require("../modules/auth/auth.route");
const paymentRouterModule = require("../modules/payment/payment.route");
const bookingRouterModule = require("../modules/booking/booking.route");

const router = express.Router();

const movieRouter = movieRouterModule.default || movieRouterModule;
const theaterRouter = theaterRouterModule.default || theaterRouterModule;
const showRouter = showRouterModule.default || showRouterModule;
const userRouter = userRouterModule.default || userRouterModule;
const paymentRouter = paymentRouterModule.default || paymentRouterModule;
const bookingRouter = bookingRouterModule.default || bookingRouterModule;

router.use("/movies", movieRouter);
router.use("/theaters", theaterRouter);
router.use("/shows", showRouter);
router.use("/users", userRouter);
router.use("/auth", authRouter);
router.use("/payment", paymentRouter);
router.use("/book", bookingRouter);

module.exports = router;
