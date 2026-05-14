const jwt = require("jsonwebtoken");
const { config } = require("../../config/config");
const { RefreshTokenModel } = require("./refresh.model");

function generateToken(payload) {
  const accessToken = jwt.sign(payload, config.accessTokenSecret, {
    expiresIn: config.accessTokenExpiresIn,
  });
  const refreshToken = jwt.sign(payload, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiresIn,
  });

  return { accessToken, refreshToken };
}

async function storeRefreshToken(userId, token) {
  return RefreshTokenModel.updateOne({ userId }, { token }, { upsert: true });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.accessTokenSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.refreshTokenSecret);
}

function findRefreshToken(userId, token) {
  return RefreshTokenModel.findOne({ userId, token });
}

function deleteRefreshToken(token) {
  return RefreshTokenModel.findOneAndDelete({ token });
}

async function updateRefreshToken(userId, token) {
  return RefreshTokenModel.updateOne({ userId }, { token }, { upsert: true });
}

module.exports = {
  generateToken,
  storeRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  updateRefreshToken,
};
