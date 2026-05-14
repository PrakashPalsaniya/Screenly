const UserService = require("./user.service");

const sanitizeUser = (user) => {
  if (!user) return null;

  const userObject = user.toObject ? user.toObject() : { ...user };
  delete userObject.passwordHash;

  return userObject;
};

const createUser = async (req, res, next) => {
  try {
    const user = await UserService.createUser(req.body);
    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await UserService.getAllUsers();
    res.status(200).json(users.map((user) => sanitizeUser(user)));
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await UserService.getUserById(req.user?._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

const activateUser = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const updateData = req.body;

    updateData.activateUser = true;

    const updatedUser = await UserService.activateUser(userId, updateData);

    res.status(200).json(sanitizeUser(updatedUser));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  activateUser,
};