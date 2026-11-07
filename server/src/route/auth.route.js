import { Router } from "express";
import * as authController from '../controllers/auth.controller.js'
const authRouter = Router()
authRouter.post('/register', authController.registerLimiter, authController.register)
authRouter.post('/login', authController.login)
authRouter.get('/getme', authController.getme)
authRouter.post('/refresh-token', authController.refreshToken)
authRouter.post('/logout', authController.logout)
authRouter.post('/logoutall', authController.logoutAll)
authRouter.post('/verify-for-resetpass', authController.verifyforresetpassword)
authRouter.post('/reset-pass', authController.resetPass)
authRouter.post('/verifyemail',authController.otpLimiter, authController.verifyEmail)
authRouter.post('/resend-otp',authController.otpLimiter, authController.resendOtp)

export default authRouter