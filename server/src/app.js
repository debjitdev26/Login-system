import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express()
app.use(express.json())
app.use(morgan("dev"))
app.use(cookieParser())
app.use(cors({
	origin: true,
	credentials: true
}))

export default app
