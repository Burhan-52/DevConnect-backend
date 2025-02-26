import mongoose from "mongoose";

const otpVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
    },
    otp: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const otpVerification = mongoose.model(
  "otpverification",
  otpVerificationSchema
);

export default otpVerification;
