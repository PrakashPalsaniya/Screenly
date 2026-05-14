const express = require("express");

const PaymentController = require("./payment.controller");
const { isVerifiedUser } = require("../../middlewares/auth.middleware");

const { idempotencyHandler } = require("../../middlewares/idempotency.middleware");

const router = express.Router();

router.post("/create-order", isVerifiedUser, idempotencyHandler(), PaymentController.createOrder);
router.post("/verify-payment", isVerifiedUser, PaymentController.verifyPayment);

module.exports = router;