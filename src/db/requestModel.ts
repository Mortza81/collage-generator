import mongoose from "mongoose";
const RequestSchema=new mongoose.Schema({
    link:String,
    verticalOrHorizontal:{
        type:String,
        enum:['vertical','horizontal']
    },
    borderSize:Number,
    borderColor:{
        type:String
    },
    user:{
        ref:"User",
        type:mongoose.Schema.ObjectId
    },
    state:{
        type:String,
        enum:['pending','in progress','canceled']
    }
})
const Request=mongoose.model('User',RequestSchema)
export default Request