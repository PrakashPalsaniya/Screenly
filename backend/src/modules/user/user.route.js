const express = require("express");

const UserController = require("./user.controller");
const { isVerifiedUser } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", isVerifiedUser, UserController.createUser);
router.get("/", isVerifiedUser, UserController.getAllUsers);
router.get("/me", isVerifiedUser, UserController.getUserById);
router.put("/activate/:id", isVerifiedUser, UserController.activateUser);

module.exports = router;