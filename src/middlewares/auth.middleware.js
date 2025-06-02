import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"


//for logut of user
export const verifyJWT = asyncHandler(async(req,res, next) => {
   try {
     const token = req.cookies?.accessToken || req.headers("Authorization")?.replace("Bearer ", "") 
 
     if(!token) {
         throw new ApiError(401, "Access token is required")
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
     //jwt.verify() is used to verify the token and decode it
     //it takes the token and the secret key as arguments
     //it decodes the token as it is encoded with the secret key
     //  and we can access the user information from the decoded token only
 
     const user = await User.findById(decodedToken._id).select("-password -refreshToken") //._id -> _ is important before id,
     //  it is a convention in mongoose to use _id for the primary key
 
     if(!user) {
         throw new ApiError(404, "Invalid access token")
     }
 
     req.user = user;
     next()
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
   }
})