import jwt from "jsonwebtoken";
import User from "../models/user.js";

const userAuth = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    let { token } = cookies;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Session expired.. please login again",
      });
    }

    var decoded = jwt.verify(token, "DevTinder");

    if (!decoded) {
      throw new Error("Invalid credentials");
    }

    let getUser = await User.findOne({ _id: decoded._id });

    if (!getUser) {
      throw new Error("User Not found");
    }

    req.user = getUser;

    next();
  } catch (error) {
    console.log(error);
  }
};

export default userAuth;
