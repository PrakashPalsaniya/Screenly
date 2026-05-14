const { UserModel } = require("./user.model");

const createUser = async (user) => {
  const newUser = new UserModel(user);
  return await newUser.save();
};

const getAllUsers = async () => {
  return await UserModel.find();
};

const getUserById = async (id) => {
  return await UserModel.findById(id);
};

const getUserByEmail = async (email) => {
  return await UserModel.findOne({ email });
};

const activateUser = async (id, updateData) => {
  const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  activateUser,
};