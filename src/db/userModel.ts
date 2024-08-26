import mongoose from "mongoose";
const UserSchema=new mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:true
    },
    uploadUrl:String,
    uploadFiles:[String],
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
})
UserSchema.virtual("requests",{
    ref:'Request',
    localField:'_id',
    foreignField:'user'
})
const User=mongoose.model('User',UserSchema)
export default User