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
  userEmail: {
    ref: "User",
    type: String,
  },
  state: {
    type: String,
    enum: ["Pending","Cancelled","Failed",'Successfull'],
  },
  date:{
    type:Date,
    default:Date.now()
  }
});
const Request = mongoose.model("Request", RequestSchema);
export default Request;
