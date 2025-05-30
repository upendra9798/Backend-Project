class ApiResponse {
    constructor(statusCode, data, message="Success"){
        this.statusCode = statusCode; // Set the HTTP status code for the response
        this.data = data; // Set the data to be returned in the response
        this.message = message; // Set the success message
        this.success = statusCode<400; // Indicate if the response is successful (status code < 400)
        //if >400 then it is an error and go through APIError class
    }
}

export { ApiResponse };
// This class is used to create a standardized API response format