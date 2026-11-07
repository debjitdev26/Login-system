import config from "../config/config.js";
import userModel from "../model/user.model.js";
import sessionModel from "../model/session.model.js";
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { Turnstile } from "@marsidev/react-turnstile";
import bcrypt from 'bcrypt'
import { generateOtp, getOtpHtml } from "../utils/utils.js";
import otpModel from "../model/otp.model.js";
import { sendEmail } from "../services/email.service.js";
import rateLimit from "express-rate-limit";
import cron from "node-cron";


// per day at 2am unverified user will be delete which have created 7 days before
cron.schedule("0 2 * * *", async () => {
    try {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const result = await userModel.deleteMany({
            verified: false,
            createdAt: { $lt: cutoff }
        });
        console.log(`Deleted ${result.deletedCount} unverified users`);
    } catch (err) {
        console.error("User cleanup error:", err);
    }
});

async function verifyTurnstile(token) {

    const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: token
            })
        }
    );

    const result = await response.json();

    return result.success;
}


// auth/api/verify-for-resetpass
export async function verifyforresetpassword(req, res) {
    try {
        const email = req.body.email.toLowerCase();  //convert email to lowercase
        const isUserExist = await userModel.findOne({ email: email })
        if (!isUserExist || !isUserExist.verified) {
            return res.status(409).json({
                message: "user is not exist or unverified"
            })
        }
        if (isUserExist && isUserExist.verified) {
            // count otp request under 10 minute from same email and if count >= 3 then otp sending will be block 
            const recentOtpCount = await otpModel.countDocuments({
                email,
                createdAt: {
                    $gte: new Date(Date.now() - 10 * 60 * 1000)
                }
            });

            if (recentOtpCount >= 3) {
                return res.status(429).json({
                    message: "Too many OTP requests for this email. Try again later."
                });
            }


            // otp generate
            const otp = generateOtp()
            const otpHtml = getOtpHtml(otp)
            const otpHash = crypto.createHash("sha256").update(otp).digest("hex")
            // Remove previous OTP
            await otpModel.deleteMany({
                user: isUserExist._id
            });
            await otpModel.create({
                user: isUserExist._id,
                email: isUserExist.email,
                otpHash,
                purpose: "reset-password",
                expiresAt: new Date(Date.now() + 5 * 60 * 1000)     // otp expires at 5 minute. after 5 minute the otp will be ddeleted from otpModel
            })


            //email send
            await sendEmail(isUserExist.email, "OTP verification", `Your OTP is ${otp}`, otpHtml)
            return res.status(200).json({
                message: "Verification OTP sent"
            });
        }
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


export async function register(req, res) {
    try {

        const { password, turnstileToken } = req.body
        const email = req.body.email.toLowerCase();


        // Bot protection
        if (!turnstileToken) {
            return res.status(400).json({
                message: "Bot verification required"
            });
        }
        const turnstileValid = await verifyTurnstile(turnstileToken);
        if (!turnstileValid) {
            return res.status(403).json({
                message: "Bot verification failed"
            });
        }


        const isUserExist = await userModel.findOne({ email: email })

        if (isUserExist) {
            if (isUserExist.verified) {

                return res.status(409).json({
                    message: "user already exist"
                })
            }

            const isMatch = await bcrypt.compare(password, isUserExist.password);
            if (!isMatch) {
                return res.status(400).json({
                    message: "Password mismatch. Use the same password you registered with."
                });
            }

            // count otp request under 10 minute from same email and if count >= 3 then otp sending will be block 
            const recentOtpCount = await otpModel.countDocuments({
                email,
                createdAt: {
                    $gte: new Date(Date.now() - 10 * 60 * 1000)
                }
            });

            if (recentOtpCount >= 3) {
                return res.status(429).json({
                    message: "Too many OTP requests for this email. Try again later."
                });
            }


            // otp generate
            const otp = generateOtp()
            const otpHtml = getOtpHtml(otp)
            const otpHash = crypto.createHash("sha256").update(otp).digest("hex")
            // Remove previous OTP
            await otpModel.deleteMany({
                user: isUserExist._id
            });
            await otpModel.create({
                user: isUserExist._id,
                email: isUserExist.email,
                otpHash,
                purpose: "verify-email",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)     // otp expires at 10 minute. after 10 minute the otp will be ddeleted from otpModel
            })


            //emmail send
            await sendEmail(isUserExist.email, "OTP verification", `Your OTP is ${otp}`, otpHtml)


            return res.status(200).json({
                message: "Verification OTP sent"
            });


        }


        const saltRounds = 10;
        const hashPassword = await bcrypt.hash(password, saltRounds);
        const user = await userModel.create({
            email,
            password: hashPassword
        })



        // otp generate
        const otp = generateOtp()
        const otpHtml = getOtpHtml(otp)
        const otpHash = crypto.createHash("sha256").update(otp).digest("hex")

        await otpModel.create({
            user: user._id,
            email: user.email,
            otpHash,
            purpose: "verify-email",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)     // otp expires at 5 minute. after 10 minute the otp will be ddeleted from otpModel
        })


        //emmail send
        await sendEmail(user.email, "OTP verification", `Your OTP is ${otp}`, otpHtml)





        res.status(200).json({
            message: "user registered successfully!",
            user: {
                email: user.email
            },
            verified: user.verified
        })
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

//limit req from same ip address
export const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        message: "Too many registration attempts. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

export const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 4,
    message: {
        message: "Too many otp send. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

export async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
        return res.status(401).json({
            message: "RefreshToken not found"
        })
    }
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)     //decode the refreshToken
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")
    const session = await sessionModel.findOne({
        refreshToken: refreshTokenHash,
        revoked: false          //if user logout the revoked:true otherwise revoked:false
    })
    if (!session) {
        return res.status(401).json({
            message: "refresh token invalid"
        })
    }
    const accessToken = jwt.sign({      //create accessToken
        id: decoded.id,
        sessionId: session._id
    }, config.JWT_SECRET, {
        expiresIn: "7m"
    })
    const newrefreshToken = jwt.sign({    //create newrefreshToken
        id: decoded.id
    }, config.JWT_SECRET, {
        expiresIn: "7d"
    })
    const user = await userModel.findById(decoded.id)
    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }
    
    const newrefreshTokenHash = crypto.createHash("sha256").update(newrefreshToken).digest("hex")
    session.refreshToken = newrefreshTokenHash
    await session.save()       // Save the updated session with the new refresh token hash
    res.cookie("refreshToken", newrefreshToken, {     // Store the new refresh token in an HttpOnly cookie
        httpOnly: true,
        secure: false,         // Set to false for local development (localhost)
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000   //7 days
    })
    res.status(200).json({
        message: "accessToken refreshed successfully",
        user: {
            email: user.email
        },
        accessToken
    })
}



export async function getme(req, res) {
    const token = req.headers.authorization?.split(" ")[1]  // Extract the JWT access token from the Authorization header
    if (!token) {
        res.status(401).json({
            message: "token not found"
        })
    }
    try {

        const decode = jwt.verify(token, config.JWT_SECRET)
        const user = await userModel.findById(decode.id)
        res.status(200).json({
            message: "User fetched successfully",
            user: {
                email: user.email
            }
        })
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired"
        })
    }
}
export async function login(req, res) {
    const { password, turnstileToken } = req.body
    const email = req.body.email.toLowerCase()
    // Bot protection
    if (!turnstileToken) {
        return res.status(400).json({
            message: "Bot verification required"
        });
    }
    const turnstileValid = await verifyTurnstile(turnstileToken);
    if (!turnstileValid) {
        return res.status(403).json({
            message: "Bot verification failed"
        });
    }
    const user = await userModel.findOne({ email })
    if (!user) {
        return res.status(401).json({ message: "email not found" })
    }
    if (!user.verified) {
        return res.status(401).json({ message: "User not verified" })
    }

    const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
        return res.status(401).json({ message: "email or password is wrong" })
    }

    const refreshToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET, {
        expiresIn: "7d"
    })
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")
    const session = await sessionModel.create({
        user: user._id,
        ip: req.ip,
        refreshToken: refreshTokenHash,
        userAgent: req.headers["user-agent"]
    })
    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id
    }, config.JWT_SECRET, {
        expiresIn: "7m"
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.status(200).json({
        message: "user Logged In successfully!",
        user: {
            email: user.email
        },
        accessToken
    })
}

export async function logout(req, res) {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
        return res.status(400).json({
            message: "refreshToken not found"
        })
    }
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")
    const session = await sessionModel.findOne({
        refreshToken: refreshTokenHash,
        revoked: false
    })
    if (!session) {
        return res.status(400).json({
            message: "Invalid refreshToken"
        })
    }
    session.revoked = true
    session.save()
    res.clearCookie("refreshToken")
    res.status(200).json({
        message: "logout successfully"
    })
}


export async function logoutAll(req, res) {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
        return res.status(400).json({
            message: "refreshToken not found"
        })
    }
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)
    await sessionModel.updateMany({       // updateMany: revoke all active sessions for this user
        user: decoded._id,
        revoked: false
    }, {
        revoked: true
    })
    res.clearCookie("refreshToken")
    res.status(200).json({
        message: "logged out from all device successfully"
    })
}

export async function verifyEmail(req, res) {
    const { email, otp, purpose } = req.body
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex")
    const otpDoc = await otpModel.findOne({
        email,
        otpHash,
        purpose
    })
    if (!otpDoc) {
        return res.status(401).json({
            message: "Invalid OTP"
        })
    }
    let user;
    if (purpose === "verify-email") {

        user = await userModel.findByIdAndUpdate(
            otpDoc.user,
            { verified: true },
            { new: true }  // { new: true } ensures the returned document is the updated one
        )
    }
    if (purpose === "reset-password") {
        user = await userModel.findOne({ _id: otpDoc.user })
    }

    await otpModel.deleteMany({
        user: otpDoc.user
    })

    if (purpose === "reset-password") {
        const resetToken = jwt.sign(    //token for reset the password
            {
                email
            },
            config.JWT_SECRET,
            {
                expiresIn: "10m"
            }
        );
        return res.status(200).json({
            message: "Email verified successfully",
            user: {
                email: user.email,
                verified: user.verified
            },
            resetToken

        })
    }




    const refreshToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET, {
        expiresIn: "7d"
    })
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")
    const session = await sessionModel.create({
        user: user._id,
        ip: req.ip,
        refreshToken: refreshTokenHash,
        userAgent: req.headers["user-agent"]
    })
    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id
    }, config.JWT_SECRET, {
        expiresIn: "7m"
    })
     res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })



    return res.status(200).json({
        message: "Email verified successfully",
        user: {
            email: user.email,
            verified: user.verified
        },
        accessToken

    })

}

export async function resendOtp(req, res) {

    const { email, purpose } = req.body
    const user = await userModel.findOne({
        email
    })

    // Count how many OTP requests were made for this email in the last 10 minutes
    const recentOtpCount = await otpModel.countDocuments({
        email,
        createdAt: {
            $gte: new Date(Date.now() - 10 * 60 * 1000)
        }
    });

    if (recentOtpCount >= 2) {
        return res.status(429).json({
            message: "Too many OTP requests for this email. Try again later."
        });
    }


    // otp generate
    const otp = generateOtp()
    const otpHtml = getOtpHtml(otp)
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex")
    // Remove previous OTP
    await otpModel.deleteMany({
        user: user._id
    });
    await otpModel.create({
        user: user._id,
        email: user.email,
        otpHash,
        purpose: purpose,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)     // otp expires at 5 minute. after 10 minute the otp will be ddeleted from otpModel
    })


    //email send
    await sendEmail(user.email, "OTP verification", `Your OTP is ${otp}`, otpHtml)


    return res.status(200).json({
        message: "Verification OTP sent"
    });

}

export async function resetPass(req, res) {
    try {
        const { resetToken, password } = req.body
        const hashPassword = await bcrypt.hash(password, 10);
        const decoded = jwt.verify(
            resetToken,
            config.JWT_SECRET
        )

        const user = await userModel.findOne({ email: decoded.email })

        if (!user) {
            return res.status(401).json({ message: "Email not found" })
        }

        user.password = hashPassword
        await user.save()
        return res.status(200).json({
            message: "Password reset successfully"
        })
    } catch (error) {
        return res.status(401).json({
            message: "Reset token expired or invalid"
        });
    }

}

