import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "user Id is required"]
    },
    email: {
        type: String,
        required: [
            true,
            "email is required"
        ]
    },
    otpHash: {
        type: String,
        required: [
            true,
            "OTP is required"
        ]
    },
    purpose: {
        type: String,
        enum: [
            "verify-email",
            "reset-password"
        ],
        required: true

        
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
})


otpSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

const otpModel = mongoose.model("otp", otpSchema)
export default otpModel
