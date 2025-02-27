import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { validateSignUpData } from "../../utils/validation.js";
import { run } from "../../utils/sendEmail.js";
import { sendOtpVerificationEmail } from "../../utils/helper.js";
import otpVerification from "../models/otpVerification.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req);

    const { firstName, lastName, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user && !user.verified) {
      await otpVerification.deleteMany({ userId: user._id });
      await sendOtpVerificationEmail(user, res);
      return;
    }

    if (user && !user.verified) {
      return res.status(409).json({
        success: false,
        message:
          "Email ID already registered but Email is not verified please verify",
      });
    }

    if (user && user.verified) {
      return res.status(401).json({
        success: false,
        message: "Email is already registered and verified please Login!!",
      });
    }
    const hashPassword = await bcrypt.hash(password, 10);

    const saveUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
    });

    // let token = jwt.sign({ _id: saveUser._id }, process.env.JWT_SECRET);

    if (saveUser) {
      await sendOtpVerificationEmail(saveUser, res);
      return;
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

    const body = `
    <p>Dear Recipient,</p>
    <p>We have received your request for reset password.<br></br>
    To reset, please click the link below:</p>

    https://devconnects.xyz/password/reset/${userInfo._id}/${token}
    <p>This link is valid for two hours from your request initiation for password recovery.</p>


    <p>Regards,<br></br
    devConnect</p>`;

    await run(userInfo.email, "Password Reset Email", body);

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

router.post("/verifyotp", async (req, res) => {
  try {
    let { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: "Empty otp details are not allowed",
      });
    }

    const otpVerificationDetails = await otpVerification.findOne({
      userId,
    });

    if (!otpVerificationDetails) {
      return res.status(400).json({
        success: false,
        message:
          "Account record doesn't exist or has been verified already. please sign up or login.",
      });
    }

    const { expiresAt, otp: hashedOtp } = otpVerificationDetails;

    if (expiresAt < Date.now()) {
      await otpVerification.deleteMany({ userId });
      return res.json({
        success: false,
        message: "Code has expired. please request again.",
      });
    } else {
      const validOtp = await bcrypt.compare(otp, hashedOtp);

      if (!validOtp) {
        return res.status(400).json({
          success: false,
          message: "Invalid code passed. check your inbox",
        });
      } else {
        await User.updateOne({ _id: userId }, { verified: true });
        await otpVerification.deleteMany({ userId });

        const saveUser = await User.find({ _id: userId });
        let token = jwt.sign({ _id: saveUser._id }, process.env.JWT_SECRET);

        res
          .cookie("token", token, {
            expires: new Date(Date.now() + 8 * 3600000),
          })
          .json({
            status: "Verified",
            message: "user email verified successfully",
            success: true,
            data: saveUser,
          });
      }
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/resendOtpVerificationCode", async (req, res) => {
  try {
    let { userId, email } = req.body;
    console.log(userId, email)
    if (!userId || !email) {
      res.status(400).josn({
        success: false,
        message: "Empty user details are not allowed",
      });
    }

    const userDetail = await User.findOne({ _id: userId });
    if (!userDetail) {
      res.json({
        success: false,
        message: "email not found please sign up again",
      });
    }
    console.log(userDetail)

    await otpVerification.deleteMany({ userId });
    await sendOtpVerificationEmail(userDetail, res);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
