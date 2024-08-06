import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username : {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true // to enable searching field
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName : {
            type: String,
            required: true,
            trim: true,
            index: true 
        },
        avatar : {
            type: String, // we will use cloudnery url
            required: true,
        },
        coverImage : {
            type: String
        },
        watchHistory: [
            {
                type : Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password : {
            type : String,
            required: [true, "Password is required"]
        },
        refreshToken: {
            type : String
        }
    },
    {
        timestamps: true
    }
)


// it is a hook
userSchema.pre("save", async function (next) {
    if(this.isModified("password")) return next(); // if not modified then go to next
    this.password = await bcrypt.hash(this.password, 10); // encrypt the password.
    next();
}); /* here don't use arrow function because 
it doen't have contect ogf this. hence we will not 
be able to access the above fields.*/

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password) ;// return boolean value.
}


userSchema.methods.generateAccessToken = function(){ 
    // this process doesn't take much time
   return jwt.sign(
        {
            _id : this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);