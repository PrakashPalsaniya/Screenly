const createHttpError = require("http-errors");
const otpService = require("./otp.service");
const userService = require("../user/user.service");
const tokenService = require("./token.service");
const passwordService = require("./password.service");
const { isValidEmail } = require("../../utils");
const { config } = require("../../config/config");

const signupOtpTtlMs = 1000 * 60 * 5;

function buildCookieOptions(maxAge) {
  return {
    maxAge,
    httpOnly: true,
    sameSite: config.cookieSameSite,
    secure: config.cookieSecure,
  };
}

function clearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: config.cookieSameSite,
    secure: config.cookieSecure,
  };
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const userObject = user.toObject ? user.toObject() : { ...user };
  delete userObject.passwordHash;
  return userObject;
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(
    "accessToken",
    accessToken,
    buildCookieOptions(config.accessTokenCookieMaxAge),
  );
  res.cookie(
    "refreshToken",
    refreshToken,
    buildCookieOptions(config.refreshTokenCookieMaxAge),
  );
}

function clearAuthCookies(res) {
  res.clearCookie("accessToken", clearCookieOptions());
  res.clearCookie("refreshToken", clearCookieOptions());
}

function createAuthPayload(user) {
  return {
    _id: user._id,
    email: user.email,
    role: user.role,
  };
}

async function issueTokensAndRespond(res, user) {
  const { accessToken, refreshToken } = tokenService.generateToken(
    createAuthPayload(user),
  );

  await tokenService.storeRefreshToken(user._id, refreshToken);
  setAuthCookies(res, accessToken, refreshToken);

  return res.status(200).json({
    auth: true,
    user: sanitizeUser(user),
  });
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 8;
}

function validateSignupInput({ name, email, phone, password }) {
  if (!name || !email || !phone || !password) {
    throw new createHttpError.BadRequest("All fields are required");
  }

  if (!isValidEmail(email)) {
    throw new createHttpError.BadRequest("Invalid email format");
  }

  if (!validatePassword(password)) {
    throw new createHttpError.BadRequest(
      "Password must be at least 8 characters long",
    );
  }

  const normalizedPhone = String(phone).trim();
  if (!/^[0-9]{10,15}$/.test(normalizedPhone)) {
    throw new createHttpError.BadRequest("Phone must be 10 to 15 digits");
  }

  return {
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: normalizedPhone,
    password,
  };
}

async function sendSignupOtp(req, res, next) {
  try {
    const signupData = validateSignupInput(req.body);
    const existingUser = await userService.getUserByEmail(signupData.email);

    if (existingUser?.passwordHash) {
      return next(
        new createHttpError.Conflict("User already exists. Please log in."),
      );
    }

    const otp = otpService.generateOTP();
    const expires = Date.now() + signupOtpTtlMs;
    const data = `${signupData.name}.${signupData.email}.${signupData.phone}.${signupData.password}.${otp}.${expires}`;
    const hash = otpService.hashOTP(data);

    try {
      await otpService.sendOTPtoEmail(signupData.email, otp);
    } catch (error) {
      console.error(error);
      return next(
        new createHttpError.InternalServerError("Error sending OTP to email"),
      );
    }

    res.status(200).json({
      email: signupData.email,
      hash: `${hash}.${expires}`,
      message: "OTP sent successfully",
    });
  } catch (error) {
    next(error);
  }
}

async function verifySignupOtp(req, res, next) {
  try {
    const { otp, hash } = req.body;
    const signupData = validateSignupInput(req.body);

    if (!otp || !hash) {
      return next(new createHttpError.BadRequest("OTP and hash are required"));
    }

    const [hashedOtp, expires] = String(hash).split(".");
    if (!hashedOtp || !expires) {
      return next(new createHttpError.BadRequest("Invalid OTP payload"));
    }

    if (Date.now() > Number(expires)) {
      return next(new createHttpError.Unauthorized("OTP expired"));
    }

    const data = `${signupData.name}.${signupData.email}.${signupData.phone}.${signupData.password}.${otp}.${expires}`;
    const isValid = otpService.verifyOTP(hashedOtp, data);

    if (!isValid) {
      return next(new createHttpError.Unauthorized("Invalid OTP"));
    }

    const passwordHash = await passwordService.hashPassword(signupData.password);
    let user = await userService.getUserByEmail(signupData.email);

    if (user?.passwordHash) {
      return next(
        new createHttpError.Conflict("User already exists. Please log in."),
      );
    }

    if (!user) {
      user = await userService.createUser({
        name: signupData.name,
        email: signupData.email,
        phone: signupData.phone,
        passwordHash,
        emailVerified: true,
        activateUser: true,
      });
    } else {
      user.name = signupData.name;
      user.phone = signupData.phone;
      user.passwordHash = passwordHash;
      user.emailVerified = true;
      user.activateUser = true;
      await user.save();
    }

    return issueTokensAndRespond(res, user);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return next(
        new createHttpError.BadRequest("Email and password are required"),
      );
    }

    if (!isValidEmail(email)) {
      return next(new createHttpError.BadRequest("Invalid email format"));
    }

    const user = await userService.getUserByEmail(email);

    if (!user || !user.passwordHash) {
      return next(
        new createHttpError.Unauthorized("Invalid email or password"),
      );
    }

    const isPasswordValid = await passwordService.verifyPassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return next(
        new createHttpError.Unauthorized("Invalid email or password"),
      );
    }

    return issueTokensAndRespond(res, user);
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.cookies || {};

    if (refreshToken) {
      await tokenService.deleteRefreshToken(refreshToken);
    }

    clearAuthCookies(res);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

async function refreshToken(req, res, next) {
  const { refreshToken: refreshTokenFromCookies } = req.cookies || {};

  if (!refreshTokenFromCookies) {
    return next(
      new createHttpError.Unauthorized(
        "Refresh token not found, please login again",
      ),
    );
  }

  let decodedToken;

  try {
    decodedToken = tokenService.verifyRefreshToken(refreshTokenFromCookies);
  } catch (_error) {
    return next(
      new createHttpError.Unauthorized(
        "Invalid refresh token, please login again",
      ),
    );
  }

  try {
    const storedToken = await tokenService.findRefreshToken(
      decodedToken._id,
      refreshTokenFromCookies,
    );

    if (!storedToken) {
      return next(
        new createHttpError.Unauthorized(
          "Refresh token not found in database, please login again",
        ),
      );
    }

    const user = await userService.getUserById(decodedToken._id);

    if (!user) {
      return next(new createHttpError.Unauthorized("User not found"));
    }

    const { accessToken, refreshToken: newRefreshToken } =
      tokenService.generateToken(createAuthPayload(user));

    await tokenService.updateRefreshToken(decodedToken._id, newRefreshToken);
    setAuthCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
      auth: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  logout,
  refreshToken,
  sendSignupOtp,
  verifySignupOtp,
};
