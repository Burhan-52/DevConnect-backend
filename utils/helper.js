import otpVerification from "../src/models/otpVerification.js";
import bcrypt from "bcrypt";
import { run } from "./sendEmail.js";

export const sendOtpVerificationEmail = async (saveUser, res) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const body = `<p>Enter <b>${otp}</b> in the app to verify your email address and complete the sign in process</p>
    <p>This  code expires in 5 minutes</p>
    `;

    const hashOtp = await bcrypt.hash(otp, 10);

    const newOtpVerification = new otpVerification({
      userId: saveUser._id,
      otp: hashOtp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes from now
    });

    await newOtpVerification.save();
    let sendEmail = await run(saveUser.email, "Otp Verification", body);
    return res.status(200).json({
      status: "Pending",
      message: "Verification otp email sent",
      data: saveUser._id,
      success: true,
    });
  } catch (err) {
    res.status(200).json({
      status: "failed",
      message: err.message,
    });
  }
};
