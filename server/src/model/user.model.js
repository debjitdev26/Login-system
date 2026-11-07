import mongoose from "mongoose";
const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, "email is required"],
        unique: [true, "email is already exist"]
    },
    password: {
        type: String,
        required: [true, "password is required"],
    },
    verified: {
        type: Boolean,
        default: false
    }
})

const userModel = mongoose.model("user", userSchema)
export default userModel
