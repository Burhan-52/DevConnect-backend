import express from "express";
import userAuth from "../middlewares/auth.js";
import connectionRequests from "../models/connectionRequest.js";
import User from "../models/user.js";

const router = express.Router();

const USER_SAFE_DATA = "firstName lastName age skills about gender photoUrl isPremium";

router.get("/user/request/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequest = await connectionRequests
      .find({
        toUserId: loggedInUser._id,
        status: "interested",
      })
      .populate("fromUserId", USER_SAFE_DATA);

    return res.status(200).json({
      success: true,
      message: "Data fetched Successfully",
      data: connectionRequest,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequest = await connectionRequests
      .find({
        $or: [
          { toUserId: loggedInUser._id, status: "accepted" },
          { fromUserId: loggedInUser._id, status: "accepted" },
        ],
      })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);

    const data = connectionRequest.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    return res.status(200).json({
      success: true,
      message: "Data fetched Successfully",
      data,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/user/feed", userAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const loggedInUser = req.user;

    let connectionRequest = await connectionRequests
      .find({
        $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
      })
      .select("fromUserId toUserId");

    let hideUserFromFeed = new Set();

    connectionRequest.forEach((req) => {
      hideUserFromFeed.add(req.fromUserId.toString());
      hideUserFromFeed.add(req.toUserId.toString());
    });

    let users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUserFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    })
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Sent feed fetched Successfully",
      data: users,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
