const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const RefreshTokenModel = mongoose.model(
  "RefreshTokenModel",
  refreshTokenSchema,
);

module.exports = { RefreshTokenModel };
