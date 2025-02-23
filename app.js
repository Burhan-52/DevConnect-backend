import express from "express";
import { connectDB } from "./src/config/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./src/routes/auth.js";
import profileRouter from "./src/routes/profile.js";
import requestRouter from "./src/routes/request.js";
import userRouter from "./src/routes/user.js";
import chatRouter from "./src/routes/chat.js";
import paymentRouter from "./src/routes/payment.js";
import cors from "cors";
import intializedSocket from "./utils/socket.js";
import dotenv from "dotenv";
import http from "http"

dotenv.config();
const app = express();

app.use(
  cors({
    // origin: "http://localhost:5173",
    origin: "https://devconnects.xyz/api",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);
app.use("/", paymentRouter);

const server = http.createServer(app);
intializedSocket(server);

await connectDB();

server.listen(3000, () => {
  console.log(`localhost is started at ${3000}`);
});
