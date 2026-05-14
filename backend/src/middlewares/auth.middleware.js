const createHttpError = require("http-errors");
const tokenService = require("../modules/auth/token.service");
const userService = require("../modules/user/user.service");

async function isVerifiedUser(req, _res, next) {
  try {
    const cookieToken = req.cookies?.accessToken;
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const accessToken = cookieToken || bearerToken;

    if (!accessToken) {
      return next(createHttpError(401, "Access token is missing"));
    }

    const decodedToken = tokenService.verifyAccessToken(accessToken);
    const user = await userService.getUserById(decodedToken._id);

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    req.user = user;
    next();
  } catch (_error) {
    next(createHttpError(401, "Invalid or expired token"));
  }
}

function isAdmin(req, _res, next) {
  if (req.user?.role !== "admin") {
    return next(createHttpError(403, "Admin access required"));
  }

  next();
}

module.exports = { isVerifiedUser, isAdmin };
