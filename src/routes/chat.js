import express from "express";
import Chat from "../models/chat.js";
import userAuth from "../middlewares/auth.js";

const router = express.Router();

router.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user;

  try {
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    }).populate({
      path: "message.senderId",
      select: "firstName lastName",
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, targetUserId],
        message: [],
      });
    }

    await chat.save();

    return res.status(200).json({
      success: true,
      message: "All chat fetched Successfully",
      data: chat,
    });
  } catch (error) {
    console.log(error);
  }
});

export default router;
