import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import authRouter from "./src/route/auth.route.js";
connectDB()
app.use('/auth/api', authRouter)
app.listen(3000, (req,res) => {
    console.log("app is listening on port 3000")
})


