import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models//user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
//asyncHandler is a middleware that handles errors in async functions
// it takes a function as an argument and returns a new function that calls the original function

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
    const {fullname, email, username, password} = req.body
    console.log("email: ",email);

//2. validation
    if(
        [fullname,email,username,password].some((field) => field?.trim() ==="")
        //if field is present and it is empty then throw error
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //3. check if user already exists
    //findOne is a mongoose method that returns the first document that matches the query
    const existedUser =  User.findOne({
        $or: [{ username }, { email }] //if either username or email exists, then it will return the error
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    //4. check for images, avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
        fullname,
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

export {registerUser}

//name,gmail,phone no,pass,address