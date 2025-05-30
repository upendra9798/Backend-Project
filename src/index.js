// require("dotenv").config(); // Load environment variables from .env file
//it works with this too(but not looking good before import functions)


//another way to use dotenv
import dotenv from "dotenv"; // Import dotenv to load environment variables
import connectDB from "./db/index.js"; //sometimes have to use .js extension while importing
import { app } from "./app.js";
// Import the connectDB function to establish a database connection

//have to make changes in pakage.json
dotenv.config({
    path: "./.env" // Specify the path to the .env file
}); // Load environment variables from .env file

connectDB() // Connect to the MongoDB database using Mongoose
.then(()=> { // Start the server only after successful database connection
  // Handle application-level errors
  app.on("error", (error) => {
    console.log("ERRR: ", error);
    throw error;
});

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    } )
})
.catch((err) => {
    console.log("Mongo db connection failed !!!", err);
    
})






/*

// import mongoose from "mongoose";
// import {DB_NAME} from "./constant"

import express from "express"
const app = express()

(async () => { // using async as database is always in another continent
    try {
        // Connect to the MongoDB database using the connection string and database name
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        
        // Handle application-level errors
        app.on("error", (error) => {
            console.log("ERRR: ", error);
            throw error;
        });

        // Start the Express server and listen on the specified port
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        });
    } catch (error) {
        // Log and rethrow any errors that occur during the connection or server setup
        console.error("Error: ", error);
        throw error;
    }
})()

*/