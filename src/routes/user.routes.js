import { Router } from "express";
import {
     changeCurrentPassword,
     getCurrentUser,
     getUserChannelProfile,
     getWatchHistory,
     loginUser,
     logoutUser,
     refreshAccessToken,
     registerUser,
     updateAccountDetails 
    } from "../controllers/user.controller.js";//import lik this when not export default
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { get } from "http";
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

//secured routes(verifyJWT-used so that only logged in users can access these routes)
router.route("/logout").post(verifyJWT, logoutUser)//verifyJWT is used at first position 
router.route("/refresh-token").post(refreshAccessToken)
//we have used jwt in refreshAccessToken so we not used it here like in logoutUser up
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
//patch is used to update a particular field in the user account
//while post is used to create a new user account(all details will update)
router.route("/avatar").patch(
    verifyJWT,
    upload.single("avatar"), //single file upload for avatar
    updateAccountDetails
)
router.route("/cover-image").patch(
    verifyJWT,
    upload.single("coverImage"), //single file upload for cover image
    updateAccountDetails
)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);//-for params
// /c/:username :username is a URL parameter (called a "route param").
// Example: /c/upendra123 will extract username = "upendra123".
router.route("/history").get(verifyJWT,getWatchHistory)

export default router;

// // What router does:
// Acts as a mini Express application.
// Handles a group of related routes (e.g., all user-related routes like /register, /login).
// Allows you to add middleware and handlers for specific routes.