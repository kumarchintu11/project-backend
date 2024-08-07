import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";



export const verifyJWT = asyncHandler (async(req, _, next ) => {
   try {
    const token = req.cookies?.accessToken || req.header
    ("Authorization"?.replace("Bearer ", ""))
 
    if(!token){
     throw new ApiError(401, "Unauthorized request")
    } 
 
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    if(!user){
     // discuss about frontend
     throw new ApiError(401, "invalid Access Token")
    }
    req.user = user;
    next() // it says that my work is done so execite the next.
    
   } catch (error) {
    throw new ApiError(401, error?.message || "invalid Access Token")

   }
}) 