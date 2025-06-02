//we have to take file from user and upload it to cloudinary and then we have to get the url of the file and send it back to the user
//done in 2 steps
//1.uplaod file to server
//2.upload file to cloudinary and get the url of the file and send it back to the user
//if successful then remove the file from server
import { v2 as cloudinary } from 'cloudinary';
import { log } from 'console';
import fs from 'fs'; // File system module to handle file operations(built-in module in node.js)


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });
    
    // Upload an image
    const uploadOnCloudinary = async (localFilePath) => {
        try {
            if(!localFilePath) return null; // If no file path is provided, return null
            //uploading file on cloudinary
            const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: 'auto', // Automatically detect the resource type (image or video)
            })
            // file has been uploaded successfully on cloudinary
            // console.log("file is uploaded on cloudinary", response.url);
            fs.unlinkSync(localFilePath); // Delete the local saved temporary file after upload
            return response ; // Return the URL of the uploaded file
            
        } catch (error) {
            fs.unlinkSync(localFilePath); // Delete the local saved temporary file if upload fails
            return null; // Return null if upload fails
        }
    }

    export { uploadOnCloudinary } // Export the function to be used in other files
