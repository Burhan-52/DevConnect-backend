import express from "express";
import userAuth from "../middlewares/auth.js";
import razorpayInstance from "../../utils/razorpay.js";
import Payment from "../models/payment.js";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";
import User from "../models/user.js";

const router = express.Router();

var amount = { GOLD: 49, SILVER: 29 };

router.post("/payment/create", userAuth, async (req, res) => {
  const { membershipType } = req.body;
  const loggedInUser = req.user;
  try {
    const order = await razorpayInstance.orders.create({
      amount: amount[membershipType] * 100,
      currency: "INR",
      receipt: "order_rcptid_11",
      notes: {
        firstName: loggedInUser.firstName,
        lastName: loggedInUser.lastName,
        membershipType: amount[membershipType],
      },
    });

    const savedPayment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });

    await savedPayment.save();

    res.status(200).json({
      success: true,
      message: "order created Successfully",
      data: {
        success: true,
        data: { ...savedPayment.toJSON() },
        key: process.env.RAZOR_PAY_PUBLIC_KEY,
      },
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/payment/webhook", async (req, res) => {
  try {
    const paymentDetails = req.body.payload.payment.entity;
    const webhookSignature = req.get("X-Razorpay-Signature");

    console.log("reaching Headers", paymentDetails, webhookSignature);
    console.log(
      "process.env.RAZOR_PAY_WEBHOOK_KEY",
      process.env.RAZOR_PAY_WEBHOOK_KEY
    );

    const isWebHookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      webhookSignature,
      process.env.RAZOR_PAY_WEBHOOK_KEY
    );
    console.log("isWebHookValid", isWebHookValid);
    if (!isWebHookValid) {
      return res
        .status(400)
        .json({ success: false, message: "Webhook signature is invalid" });
    }

    const payment = await Payment.findOne({
      orderId: paymentDetails.order_id,
    });

    console.log("payment", payment);

    await payment.save();

    const user = await User.findOne({
      _id: payment.userId,
    });

    console.log("user", user);

    user.isPremium = true;
    user.membershipType = payment?.notes?.memberShipType;
    await user.save();

    // if (req.body.event === "payment.captured") {
    // }
    // if (req.body.event === "payment.failed") {
    // }

    return res.status(200).json({
      success: true,
      message: "Webhook Received Successfully",
    });
  } catch (err) {
    console.log(err)
  }
});

router.get("/payment/verify", userAuth, async (req, res) => {
  const user = req.user;
  if (user.isPremium) {
    return res
      .status(200)
      .json({ success: true, isPremium: true, message: "User is premium" });
  } else {
    return res.status(200).json({
      success: true,
      isPremium: false,
      message: "User is not premium",
    });
  }
});

export default router;
