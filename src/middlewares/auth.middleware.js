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
 
     const user = await User.findById(decodedToken.id).select("-password -refreshToken")
 
     if(!user) {
         throw new ApiError(404, "Invalid access token")
     }
 
     req.user = user;
     next()
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
   }
})