import multer from 'multer'; 
//multer is a middleware for handling multipart/form-data, which is used for uploading files
// it uploads files from user to the server and then we can upload it to cloudinary

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/public/temp') //cb-callback function to indicate the destination of the file
    //null means no error handling
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname )
  }
})

export const upload = multer({
     storage
     })