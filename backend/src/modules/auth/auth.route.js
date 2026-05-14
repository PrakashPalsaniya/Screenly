const express = require("express");
const authController = require("./auth.controller");

const { idempotencyHandler } = require("../../middlewares/idempotency.middleware");

const router = express.Router();

router.post("/signup/send-otp", authController.sendSignupOtp);
router.post("/signup/verify-otp", idempotencyHandler(), authController.verifySignupOtp);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

module.exports = router;
