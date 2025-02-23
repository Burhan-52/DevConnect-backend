import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

var instance = new Razorpay({
  key_id: process.env.RAZOR_PAY_PUBLIC_KEY,
  key_secret: process.env.RAZOR_PAY_SECRET_KEY,
});

export default instance;
