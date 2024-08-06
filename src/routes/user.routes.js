import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxcount: 1
        },// this object is for avatar
        {
            name: "CoverImage",
            maxCount: 1
        } // this is for cover image
    ])    ,
    registerUser
)


export default router;