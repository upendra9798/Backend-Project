//nodejs provides a built-in Error class
// The Error class is the base class for all errors in JavaScript. 
// It provides a way to create custom error types by extending it.


class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message); // Call the parent constructor with the error message
        this.statusCode = statusCode; // Set the HTTP status code for the error
        this.data = null; // Initialize data to null (can be used to store additional information)
        this.message = message; // Set the error message
        this.success = false;
        this.errors = errors; // Store any additional error information

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor) 
        }
    }
}

export {ApiError}