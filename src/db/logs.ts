import mongoose from "mongoose";
const logSchema=new mongoose.Schema({
    event:String,
    message:String,
    jobId:String
})
const Log=mongoose.model('Log',logSchema)
export default Log