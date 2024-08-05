import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express()

// app.use is general way of using middleware.
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))// form se jb data liya tb ka configuration.
// URL have its encoder 
app.use(express.urlencoded({extended: true, limit:"16kb"})) // extended alloe nested object.


// somthing that we want to store in our own server such as images, pdf, etc.
app.use(express.static)

app.use(cookieParser())








export{app}