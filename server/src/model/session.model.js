import mongoose from "mongoose";

const sessionSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required:[true,"user Id is required"]
    },
    ip: {
        type: String,
        required:[true,"ip is required"]
    },
    refreshToken: {
        type: String,
        required:[true, "refreshToken is required"]
    },
    userAgent: {
        type: String,
        required:[true, "User Agent is required"]
    },
    revoked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps:true
})


const sessionModel = mongoose.model("sessions", sessionSchema)
export default sessionModel


