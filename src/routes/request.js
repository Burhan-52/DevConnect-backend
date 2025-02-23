import express from "express";
import userAuth from "../middlewares/auth.js";
import connectionRequests from "../models/connectionRequest.js";
import User from "../models/user.js";
import { run } from "../../utils/sendEmail.js";

const router = express.Router();

router.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.toUserId;
    const status = req.params.status;

    const allowedStatus = ["interested", "ignored"];

    if (!allowedStatus.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: `Invalid status type ${status}` });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.send(404).json({ success: true, message: "User not found!" });
    }

    const existingConnectionRequest = await connectionRequests.findOne({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId },
      ],
    });

    if (existingConnectionRequest) {
      return res.status(400).json({
        success: true,
        message: "Connection Request Already Exists..",
      });
    }

    const connectionRequest = new connectionRequests({
      fromUserId,
      toUserId,
      status,
    });

    await connectionRequest.save();

    res.status(200).json({
      success: true,
      message: `${req.user.firstName} is ${status} in ${toUser.firstName}`,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  "/request/recived/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const { status, requestId } = req.params;
      const loggedInUser = req.user;

      const allowedStatus = ["accepted", "rejected"];

      if (!allowedStatus.includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: `Invalid status type ${status}` });
      }

      const connectionRequest = await connectionRequests.findOne({
        // $and: [{ toUserId: loggedInUser._id }, { status: "interested" }],
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });

      if (!connectionRequest) {
        return res
          .status(400)
          .json({ success: false, message: "Connection request is not found" });
      }

      connectionRequest.status = status;
      const data = await connectionRequest.save();
      return res.status(200).json({
        success: true,
        message: `Connection request ${status} your Request`,
        data,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
