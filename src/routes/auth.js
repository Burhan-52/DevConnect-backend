import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { validateSignUpData } from "../../utils/validation.js";
import { run } from "../../utils/sendEmail.js";

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

    let token = jwt.sign({ _id: saveUser._id }, process.env.JWT_SECRET);

    if (saveUser) {
      res
        .status(200)
        .cookie("token", token, {
          expires: new Date(Date.now() + 8 * 3600000),
        })
        .json({ success: true, data: saveUser });
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

    let token = jwt.sign({ _id: userInfo._id }, process.env.JWT_SECRET);

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

router.post("/verify/email", async (req, res) => {
  try {
    const { email } = req.body;
    const userInfo = await User.findOne({ email });

    if (!userInfo) {
      return res
        .status(404)
        .json({ succes: false, message: "Email is not registered" });
    }

    let token = jwt.sign({ _id: userInfo._id }, process.env.JWT_SECRET);
    console.log(token)

    const body = `
    Dear Recipient,
    We have received your request for reset password.
    To reset, please click the link below:

    https://devconnects.xyz/password/reset/${userInfo._id}/${token}
    This link is valid for two hours from your request initiation for password recovery.


    Regards,
    devConnect`;

    await run(userInfo.email,"Password Reset Email", body);

    return res
      .status(200)
      .json({ succes: true, message: "Sent Email to your registered EmailID" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
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
