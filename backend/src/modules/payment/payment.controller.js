const PaymentService = require("./payment.service");

const createOrder = async (req, res, next) => {
  try {
    const order = await PaymentService.createOrder(req.body, req.user._id);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const isVerified = await PaymentService.verifyPayment(req.body);

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment verification successfully!",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};