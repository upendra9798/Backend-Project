import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";//import lik this when not export default
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

//route used for user registration
// multer middleware is used to handle multipart/form-data, which is used for uploading files
router.route("/register").post(
    upload.fields([ //now we can upload multiple files
        {
            name:"avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
//we have used jwt in refreshAccessToken sowe not used it here like in logoutUser up

export default router;

// // What router does:
// Acts as a mini Express application.
// Handles a group of related routes (e.g., all user-related routes like /register, /login).
// Allows you to add middleware and handlers for specific routes.