import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models//user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
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
    if(!username || email){
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
export {
    registerUser,
    loginUser,
    logoutUser
}

//name,gmail,phone no,pass,address