import mongoose from "mongoose";
const logSchema=new mongoose.Schema({
    event:String,
    message:String,
    request:{
        type:mongoose.Schema.ObjectId
        ,ref:"Request"
    },
    time:{
        type:Date,
        default:Date.now()
    }
})
const Log=mongoose.model('Log',logSchema)
export default Log