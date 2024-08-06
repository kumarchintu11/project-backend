// import { v2 } from "cloudinary";// below we gave a name for v2 for our convenience.


import { v2 as cloudinary} from "cloudinary";
import fs from "fs"


cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully
        console.log("File has been successfully uploaded", response.url);
        
    } catch (error) {
        // to remove unwanted(or locally saved temporarily as the file upload operation fails ) 
        fs.unlinkSync(localFilePath);
    }
}


// cloudinary.v2.uploader.upload("https://upload.wikimedia.org/wikipedia.commas/a/ae/Olympic_flag.jpg", 
//     {public_id: "olympic_flag"},
//     function(error, result) {console.log(result);
//     }
// )

export {uploadOnCloudinary}