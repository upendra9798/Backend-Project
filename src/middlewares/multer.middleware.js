// import multer from 'multer'; 
// //multer is a middleware for handling multipart/form-data, which is used for uploading files
// // it uploads files from user to the server and then we can upload it to cloudinary

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, '/public/temp') //cb-callback function to indicate the destination of the file
//     //null means no error handling
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname )
//   }
// })

// export const upload = multer({
//      storage
//      })

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create the upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'public', 'temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);  // correct full path
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

export const upload = multer({ storage });
