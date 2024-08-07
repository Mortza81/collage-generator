import mongoose from "mongoose";
const RequestSchema = new mongoose.Schema({
  images: [String],
  link: String,
  verticalOrHorizontal: {
    type: String,
    enum: ["vertical", "horizontal"],
  },
  borderSize: Number,
  borderColor: {
    type: String,
  },
  user: {
    ref: "User",
    type: mongoose.Schema.ObjectId,
  },
  state: {
    type: String,
    enum: ["Pending","Canceled","Failed",'Successfull'],
  },
});
const Request = mongoose.model("Request", RequestSchema);
export default Request;
