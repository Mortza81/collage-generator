import mongoose from "mongoose";
const UserSchema=new mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:true
    },
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
})
UserSchema.virtual("requests",{
    ref:'Request',
    localField:'id',
    foreignField:'userde'
})
const User=mongoose.model('User',UserSchema)
export default User