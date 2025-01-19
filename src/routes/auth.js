import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { validateSignUpData } from "../../utils/validation.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req);

    const { firstName, lastName, email, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      throw new Error("Email ID already registered");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const saveUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
    });

    if (saveUser) {
      res.status(200).json({ succes: true, user: saveUser });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    let userInfo = await User.findOne({ email });
    if (!userInfo) {
      throw new Error("User not Found");
    }

    const verifyPassword = await bcrypt.compare(password, userInfo.password);

    if (!verifyPassword) {
      throw new Error("Invalid Credential");
    }

    let token = jwt.sign({ _id: userInfo._id }, "DevTinder");

    res
      .status(200)
      .cookie("token", token, {
        expires: new Date(Date.now() + 8 * 3600000),
      })
      .json({ success: true, message: "Login Succesfully", data: userInfo });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/logout", (req, res) => {
  res
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({ success: true, message: "Logout Succesfully" });
});

router.patch("/forgotpassword", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    const userInfo = await User.findOne({ email });

    if (!userInfo) {
      return res
        .status(200)
        .json({ succes: false, message: "Invalid Creadentials" });
    }

    const verifyPassword = await bcrypt.compare(oldPassword, userInfo.password);

    if (!verifyPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }

    let comparePassword = oldPassword.localeCompare(newPassword);

    if (comparePassword < -1) {
      return res
        .status(400)
        .json({ message: "old password and new password cannot be same" });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);

    userInfo.password = hashPassword;

    await userInfo.save();

    return res
      .status(200)
      .json({ success: true, message: "Password Reset Successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
