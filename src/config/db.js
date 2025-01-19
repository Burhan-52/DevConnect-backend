// mongodb+srv://burhan:6GRO2qPuJqnL6uQN@devtinder.ih14k.mongodb.net/

import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(
      "mongodb+srv://burhan:6GRO2qPuJqnL6uQN@devtinder.ih14k.mongodb.net/devTinder"
    );
    console.log("db successfully connected");
  } catch (err) {
    console.log(err);
  }
}

