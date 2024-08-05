// require('dotenv').config({path: './env'}) : becuase this require is ruining the program radability instead use import.

import dotenv from "dotenv"; //  after import we need to config
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})


// console.log('MONGODB_URI:', process.env.MONGODB_URI);  // Debugging :  it will let u not whether we are getting the url or not.


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () =>{
        console.log(`Server is running at port: ${process.env.PORT}`);
        
    })
})
.catch((err ) => {
    console.log("MONGO DB connection failed !!!! ", err);
    
})














// import mongoose from "mongoose";
// import {DB_NAME} from "./constants";

// import express from "express";

// const app = express();

// m=1 : using function

// function connectionBD(){}

// connectionBD()


// m-2 : using IIFE -- immediate execuatble function
//  it`s a better approach.
// ;(async() => {})() -- - here ; is used to clear before execution
// (async() => {
//     try{
//         await mongoose.connect(`${process.env.MONGOBB-URI}/${DB_NAME}`);

//         // to talk with the app
//         app.on("error", (error) => {
//             console.log("ERRRR", error);
//             throw error;
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })
//     }catch (error){
//         console.log("ERROR: ", error);
//         throw err
//     }
// })()