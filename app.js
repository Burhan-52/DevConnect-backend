import express from "express";
import { connectDB } from "./src/config/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./src/routes/auth.js";
import profileRouter from "./src/routes/profile.js";
import requestRouter from "./src/routes/request.js";
import userRouter from "./src/routes/user.js";
import cors from "cors";

const app = express();

await connectDB();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

app.listen(3000, () => {
  console.log(`localhost is started at ${3000}`);
});
