import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser  =   asyncHandler (async (req, res) => {
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
    console.log(req.body);
    

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

export {registerUser}