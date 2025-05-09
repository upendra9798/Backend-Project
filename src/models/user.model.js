import mongoose, {Schema} from 'mongoose';
import jwt from 'jsonwebtoken';//it is used to create token(like access token and refresh token) token-based authentication
import bcrypt from 'bcrypt'; //it is used to hash password(encrypt password)

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar:{
            type: String, //cloudinary url(if we upload image or video it gives a url)
            required: true,
        },
        coverImage:{
            type: String, 
        },
        watchHistory:[
            {
                type: Schema.Types.objectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

//pre is a hook that is used to perform some action before saving the document to the database
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next(); //without this line, it will hash the password every time we update the user
    //if the password is not modified, then it will not hash the password again and again
    this.password = bcrypt.hash(this.password, 10); //hashing the password with 10 salt rounds
    next(); //call the next middleware function in the stack
})
//here we are using bcrypt to hash(encrypt) the password before saving it to the database
 
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password); //compare the password entered by user with the hashed password in the database
//it takes time to compare the password and return true or false
//it is an async function so we are using await here
}

userSchema.methods.generateAcessToken = function(){
    return jwt.sign( //* we are using jwt to create token(like access token and refresh token) token-based authentication */
        {
            _id: this._id,//this._id is the id of the user in the database
            username: this.username,
            email: this.email,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY //access token will expire in 1 day
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign( //* we are using jwt to create token(like access token and refresh token) token-based authentication */
        {
            _id: this._id,//this._id is the id of the user in the database
            username: this.username,
            email: this.email,
            fullname: this.fullname,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY 
        }
    )
}


export const User = mongoose.model('User', userSchema);