import express from "express";
import User from "../models/user.js";
import userAuth from "../middlewares/auth.js";
import { validateProfileEditData } from "../../utils/validation.js";

const router = express.Router();

router.get("/profile/view", userAuth, async (req, res) => {
  const user = req.user;
  try {
    let getUser = await User.findOne({ _id: user._id });

    res.status(200).json({ success: true, data: getUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateProfileEditData(req)) {
      throw new Error("Invalid Edit Request");
    }

    let loggedInUser = req.user;
    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    await loggedInUser.save()

    res.status(200).json({
      success: true,
      profile: loggedInUser,
      message: `${loggedInUser.firstName} your profile update successfully`,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
