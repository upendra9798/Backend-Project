import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models//user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
//jwt is used to create token(like access token and refresh token) token-based authentication
//asyncHandler is a middleware that handles errors in async functions
// it takes a function as an argument and returns a new function that calls the original function

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()//calling the methods by ()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken 
        await user.save({validateBeforeSave: false})
// The newly generated refreshToken is stored in the user's document in the database.
// validateBeforeSave: false is used to skip any schema validation
//  before saving, which is okay here because you're not changing anything like the password or email that usually has strict validators.
//generateAccessToken and generateRefreshToken are methods defined in the user model
        //these methods generate the access token and refresh token respectively

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req,res) => {
    // 1. get user deatials from frontend
    // 2. validation - not empty
    // 3. check if user already exist: username, email
    // 4. check for images, avatar
    // 5. upload to cloudinary, avatar
    // 6. create user object - create entry in db
    // 7. remove pasword and refresh token field from response
    // 8. check for user creation
    // 9. return res 
   
//1. user details
    const {fullName, email, username, password} = req.body
    // console.log("email: ",email);

//2. validation
    if(
        [fullName,email,username,password].some((field) => field?.trim() ==="")
        //if field is present and it is empty then throw error
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //3. check if user already exists
    //findOne is a mongoose method that returns the first document that matches the query
    const existedUser = await User.findOne({
        $or: [{ email }, { username} ] //if either username or email exists, then it will return the error
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    //4. check for images, avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //5. upload to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(500, "Failed to upload avatar image")
    }

    //6. create user object - create entry in db
    // User.create is a mongoose method that creates a new document in the database
    const user = await User.create({
        fullName,
        avatar: avatar.url, //cloudinary url
        coverImage: coverImage?.url || "", //cloudinary url// if cover image is not present then it will be empty string
        email,
        password,
        username: username.toLowerCase(), //to make username lowercase
    })

    //7. remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
     //select is a mongoose method that selects the fields to return, here we are excluding password and refreshToken
   
    //8. check for user creation
     if(!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user")
    }

    //9. return res
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // 1. req body -> data
    // 2. username or email
    // 3. find the user
    // 4. password check
    // 5. access and refresh token
    // 6. send cookie

    // 1. req body data
    const {email, username, password} = req.body 

    // 2. username or email
    if(!(username || email)){//"If neither username nor email is truthy."
        throw new ApiError(400, "username or email is required")
    }

    // 3. find the user
    const user = await User.findOne({//User is a mongoose model that represents the user collection in the database
        $or: [{username}, {email}]
    })

    if(!user){//here we use user not User.findOne because we are checking if our user is null or not
        throw new ApiError(404, "User not found")
    }

    // 4. password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    //5. access and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    //6. send cookie
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    //select is a mongoose method that selects the fields to return, here we are excluding password and refreshToken

    const options = { //options for the cookie
        httpOnly: true,
        secure: true
    }//by this cookies will only be modified by the server and not by the client

    return res.
    status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )

})

// as we don't have a refresh token route, we will use the logout route to clear the refresh token from the user document
//to do this we have created a middleware called verifyJWT in auth.middleware.js
const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
    req.user._id,
    {
        $set: {
            refreshToken: undefined           
        }
    },
    {
        new: true
    }
   )

    const options = { //options for the cookie
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(
        200,
        null, //or {}
        "User logged out successfully"
    ))
})


// Generating new access token using refresh token when access token expires
const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 
//body-when using mobile app, cookies-when using web app

if(!incomingRefreshToken){ 
    throw new ApiError(400, "Refresh token is required")
}

try {
    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
     
    const user = await User.findById(decodedToken?._id)
    
    if(!user) {
        throw new ApiError(404, "Invalid refresh token")
    }
    
    if(incomingRefreshToken != user?.refreshToken){
        throw new ApiError(401, "Refresh token is expired or used")
    }
    //incomingRefreshToken- token sent by the user
    // user.refreshToken - token stored in the database
    
    //refresh token matches, so we can generate a new access token
    const options = {
        httpOnly: true,
        secure: true
    }
    
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access token refreshed"
        )
    )
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
}
})

const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword} =req.body

    const user = await User.findById(req.user?._id) //req.user from auth middleware
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)//from user.model

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalis old password")
    }

    user.password = newPassword //updating the password
    await user.save({validateBeforeSave: false}) //validateBeforeSave: false is used to skip any schema validation

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Password changed successfully"
        )
    )
}) 

const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user,"current user fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName,email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email:email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar= asyncHandler(async(req,res) => {
//📁  Step 1: Get the Local Path of the Uploaded File
    const avatarLocalPath = req.file?.path

 //🚫 Step 2: Check if File Exists
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

//☁️ Step 3: Upload to Cloudinary
    //avatar name same as user.model
    const avatar = await uploadOnCloudinary(avatarLocalPath)

//❗ Step 4: Validate Cloudinary Upload
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

// 👤 Step 5: Update User Document
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar is updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image file is missing")
    }

    //coverImage name same as user.model
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url3
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover image updated successfully")
    )
})

//Aggregation pipelines
const getUserChannelProfile = asyncHandler(async(req,res) => {
    const {username} = req.params //taking from link(profile)-params

    if(!username?.trim()){//trim() is used to remove whitespace from both ends of a string
        throw new ApiError(400,"username is missing")
    }

    //aggregate is a mongoose method that allows us to perform complex queries on the database
    //it is used to join multiple collections and perform operations on them
    const channel = await User.aggregate([
        {
            $match:{//matching the username in the database
                username: username?.toLowerCase() //it is used to match the username in the database
            }
        },
        {//checking subscribers
            $lookup: {//lookup is used to join two collections
                from: "subscriptions", //the collection we want to join with(from subscription.model.js)
                localField: "_id", //the field in the current collection
                foreignField: "channel", //the field in the other collection(from subscription.model.js)
                as: "subscribers" //the name of the field to add to the current collection
            }
        },
         {//checking channels subscribed to
            //this will give us the channels that the user is subscribed to
            $lookup: {
                from: "subscriptions", 
                localField: "_id", 
                foreignField: "subscriber", //(from subscription.model.js)
                as: "subscriberdTo" 
            }
        },  
        {
            $addFields: { //adding new fields to the current collection
                subscribersCount:{
                    $size: "$subscribers" //adding a new field(so $) to the current collection
                },
                channelsSubscribedTOCount:{
                    $size:"$subscriberdTo" //adding a new field to the current collection
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "subscribers.subscriber"]},
                        then:true,
                        else:false
              //if the user is logged in then it will have an id, 
              //we will compare it with the subscriber's id in the subscribers array
              //if it is present then it will return true(subscribed), else false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedTOCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email:1
                //project is used to select the fields to return
                //1 means include the field, 0 means exclude the field
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"channel does not exist")
    }

    return res//aggregate returns an array of objects
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User Channel profile fetched successfully")
    )//channel[0] is used to get the first object from the array
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match: { //we look for the user by their ID
            _id: new mongoose.Types.ObjectId(req.user._id) //converting string to ObjectId
    //req.user._id return a string, but we need to match it with ObjectId in the database
    //generally we write only req.user._id because mongoose converts it to ObjectId automatically
    // but here we are using aggregate so we need to convert it manually, it does not pass through
    //  the mongoose middleware
        }
    },
    {
        $lookup: {
            from: "videos", //the collection we want to join with(from video.model.js)
            localField: "watchHistory", //the field in the current collection(user)
            foreignField: "_id", //the field in the other collection(from video.model.js)
            as: "watchHistory", //the name of the field to add to the current collection
            pipeline:[
                {
                    $lookup: {//sub-lookup to get the owner of the video
                        from:"users", //the collection we want to join with(from user.model.js)
                        localFiels: "owner", //the field in the current collection(video)
                        foreignField: "_id", //the field in the other collection(from user.model.js)
                        as: "owner",//the name of the field to add to the current collection
                        pipeline:[
                            {
                                $project: {//only selecting the fields we need to show for the owner
                                    fullName: 1,//not selecting email and password,etc
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: { 
                        owner: {//returning the first owner from the array as it returns an array
                            $first: "$owner" //getting the first owner from the array
                        }
                //   new ApiResponse(200, channel[0],-earlier we used this to return the channel profile first object from the array
                    }
                }
            ]
        }
    }
    ])

     return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
//Summary:
//1. We match the user by their ID.
//2. We use $lookup to join the user collection with the video collection and 
// calculated the watch history.The result is a watchHistory array populated with full video documents.
//3. Nested Lookup to Get Video Owner Info
// For each video in the history, a sub-lookup fetches the video owner from the users collection.
//4. Return Response
// Sends back the populated watch history (with video and owner info)
//  in the response body.


})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

//name,gmail,phone no,pass,address