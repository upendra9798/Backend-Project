import express from "express"  
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({ // cors is used to allow cross-origin requests(means requests from different domains)
    origin: process.env.CORS_ORIGIN,
    credentials: true // Allow credentials (cookies, authorization headers, etc.) to be sent with requests
}))

//parsing middlewares
app.use(express.json({limit: "16kb"})) // Parse incoming JSON requests with a limit of 16KB
app.use(express.urlencoded({extended: true, limit: "16kb"})) // Parse URL-encoded requests with a limit of 16KB
app.use(express.static("public")) // Serve static files from the "public" directory
app.use(cookieParser()) // Parse cookies from incoming requests

// Importing routes
import userRouter from "./routes/user.routes.js"
//we gave userRouter name-we can give any name if we export it by export default method

//routes declaration
app.use("/api/v1/users", userRouter) // Use the user router for all requests to /api/v1/user
//if any user user /users then it will go to user.routes.js file

// http://localhost:8000/api/v1/users/register

export {app}