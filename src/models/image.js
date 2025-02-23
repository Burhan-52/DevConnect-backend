import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
    imageUrl: String,
});

const Image = mongoose.model("Payment", ImageSchema);

export default Image;
