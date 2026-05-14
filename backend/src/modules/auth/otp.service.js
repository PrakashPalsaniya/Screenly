const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const { config } = require("../../config/config");

function generateOTP() {
  return crypto.randomInt(1000, 9999);
}

function hashOTP(data) {
  if (!config.hashingSecret) {
    throw new Error("Hashing secret is not defined");
  }

  return crypto
    .createHmac("sha256", config.hashingSecret)
    .update(data)
    .digest("hex");
}

function verifyOTP(hashedOTP, data) {
  return hashOTP(data) === hashedOTP;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.emailUsername,
    pass: config.emailPassword,
  },
});

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Screenly",
    link: "https://amritraj.vercel.app",
    // logo removed as per cloudinary deprecation
  },
});

async function sendOTPtoEmail(email, otp) {
  const mail = mailGenerator.generate({
    body: {
      name: "",
      intro: "Welcome to Screenly! We're very excited to have you on board.",
      action: {
        instructions: "To verify your account, please use the following OTP:",
        button: {
          color: "#323232",
          text: otp,
          link: "#",
        },
      },
      outro:
        "This OTP will expire in a short time (2 mins) for security reasons. If you did not request this OTP, please ignore this email.",
    },
  });

  const info = await transporter.sendMail({
    from: config.emailUsername,
    to: email,
    subject: "Your OTP for Screenly",
    html: mail,
  });

  console.log(info);
  return info.messageId;
}

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  sendOTPtoEmail,
};
