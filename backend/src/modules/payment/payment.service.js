const Razorpay = require("razorpay");
const crypto = require("crypto");

const { config } = require("../../config/config");
const { assertSeatLocksOwnedByUser } = require("../booking/booking.service");

const createOrder = async (paymentData, userId) => {
  const razorpay = new Razorpay({
    key_id: config.razorpayKey,
    key_secret: config.razorpaySecret,
  });

  const { amount, showId, seats } = paymentData;
  const normalizedSeats = Array.isArray(seats)
    ? [...seats].map((seat) => String(seat).trim()).sort()
    : [];

  if (showId && normalizedSeats.length) {
    await assertSeatLocksOwnedByUser(showId, normalizedSeats, userId);
  }

  const amountInPaise = Math.round(Number(amount) * 100);

  const option = {
    amount: amountInPaise,
    currency: "INR",
    receipt: `receipt_${userId.toString().slice(-4)}_${showId.toString().slice(-4)}_${Date.now()}`,
    notes: {
      userId: userId.toString(),
      showId: String(showId),
      seats: normalizedSeats.join(","),
      amountInPaise: String(amountInPaise),
    },
  };

  const order = await razorpay.orders.create(option);

  return order;
};

const verifyPayment = async (paymentData) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    paymentData;

  const expectedSignature = crypto
    .createHmac("sha256", config.razorpaySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  return expectedSignature === razorpay_signature;
};

module.exports = {
  createOrder,
  verifyPayment,
};
