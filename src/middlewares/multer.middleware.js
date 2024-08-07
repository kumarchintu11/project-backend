import multer from "multer";

// to store file on storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp") // cb here is call back
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    //   cb(null, file.fieldname + '-' + uniqueSuffix)
      cb(null, file.originalname)
    }
})
  
export const upload = multer({ storage,  })