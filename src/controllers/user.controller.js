import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"



const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accesToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()


        // save refresh token inside the database.
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return {accesToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token.")
    }
}



const registerUser  =  asyncHandler (async (req, res) => {
    /* some basics steps to be followed during the registration process.
        1. get user details from frontend.
        2. validation  -- not empty
        3. check if user already exists: by username or email
        4. check for images, check for avator
        5. upload them to cloudinary, avatar
        6. create user object - create entry in database.
        7. remove password and refresh token field fron response.
        8. check for user creation i.e user is created or not
        9. if created then return response.
    */

    
    const {fullName, username, email, password} = req.body;
    console.log("email", email);
    // console.log(req.body);// this will return only the above fields excluding avatar and coverImage.
    

    // // basic way
    // if(fullname === ""){
    //     throw new ApiError (400, "fullname is required")
    // }

    if(
        [fullName, email, username, password].some((field) => field?.trim ==="")
    ){
        throw new ApiError(400, "All fields are required ")
    }
    
    // User.findOne({username }) //  for single value
    const existedUser = await User.findOne({
        $or: [{username}, {email}]// for multiple values
    })

    if(existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }
    // console.log(req.files);
    
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    // console.log(avatarLocalPath);
    
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) 
        && req.files.coverImage.length>0){
            coverImageLocalPath = req.files.coverImage[0].path
        }


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is necessary")
    }
    
    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(400, "Avatar file is mostly necessary")
    }


    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // if no cover image then make it null
        email,
        password,
        username: username.toLowerCase()

    });
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if(!createdUser){
        throw new ApiError (500, "something went wrong while creating user !!!")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Created Successfully")
    )
})

const loginUser = asyncHandler (async (req, res) => {
    // req body -> data
    // check user by username or email
    // find the user 
    // password check
    // access and refresh token

    const {email, username, password} = req.body

    if(!(username || email)){
        throw new ApiError (400 , "username or email is required")
    }
    
    // if(!username && !email){
    //     throw new ApiError (400 , "uername or email is required")
    // }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if(!user){
        throw new ApiError (404 , "user doen not exist")
    }
    // Log the password and hashed password for debugging
    console.log('Input Password:', password);
    console.log('Stored Hashed Password:', user.password);

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError (401, "invalid user credentials")
    }

    const {accesToken, refreshToken} = await generateAccessAndRefreshTokens(user._id); 

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    // send tokens to cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accesToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accesToken, refreshToken
            },
            "user logged in successfully"

        ))


})


const logoutUser  =     asyncHandler(async(req, res) =>{
    // clear the user cookies
    // clear the refresh token of the user from database
    // we need middle ware for the aboves 
    await  User.findOneAndUpdate(
        req.user._id,
        {
            $set: {refreshToken: undefined}
        },
        {
            new :true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
}) 


const refreshAccessToken = asyncHandler (async (req, res) => {
    const incomingRefreshToken = req.cookies.
    refreshToken || req.body.refreshToken


    if(!incomingRefreshToken){
        throw new ApiError( 401, "unautorised request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError (401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure:true
        }
        const {accesToken, newrefreshToken}= await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accesToken", accesToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accesToken, refreshToken: newrefreshToken 
                },
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh Token")
    }


})



const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword }= req.body
    // const {oldPassword, newPassword, conPassword }= req.body

    // if(newPassword === conPassword){
    //     throw new ApiError()
    // }


    const user = await req.user?._id;
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError (400, "invalid old password")
    }

    user.password = password;
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser  =asyncHandler (async(req, res) => {
    return res
    .status(200)
    .json(200, req.user, "current user fetvhed successfully")
})



// update text data
const updateAccountDetails = asyncHandler(async(req, res) =>{
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiError(400, "all fields are required")

    }

    User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email:email
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "account updated successfully"))
})

// update files
const updateUserAvatar = asyncHandler ( async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError (400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar imsge updated successfully")
    )
})

const updateUserCoverImage = asyncHandler ( async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError (400, "CoverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "CoverImage image updated successfully") 
    )
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
    updateUserCoverImage
}