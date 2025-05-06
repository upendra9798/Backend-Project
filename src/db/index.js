/**
 * Connects to the MongoDB database using Mongoose.
 * 
 * This function attempts to establish a connection to the MongoDB database
 * using the connection URI specified in the `MONGODB_URI` environment variable
 * and the database name defined in the `DB_NAME` constant. If the connection
 * is successful, a success message is logged to the console. If the connection
 * fails, an error message is logged, and the process exits with a non-zero status.
 * 
 * @async
 * @function connectDB
 * @throws Will log an error and terminate the process if the connection fails.
 */
import mongoose from "mongoose";
import { DB_NAME } from "../constant.js"; //have to write constant.js 

const connectDB = async () => {
    try {
       const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log((`\n MongoDB connected !! DB HOST: 
            ${connectionInstance.connection.host}`)); //try console.log(connectionInstance)      
            // ${connectionInstance.connection.host} - this is the host of the database
    } catch (error) {
        console.log("MONGODB connection failed", error);
        process.exit(1)//Exits the Node.js process with exit code 1, indicating an error.
    }
}

export default connectDB
