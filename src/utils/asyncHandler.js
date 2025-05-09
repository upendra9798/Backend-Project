 // We are making here a wrapper fn which we use everywhere in the project
//     // to handle the errors in a single place instead of writing try-catch block everywhere

// M1 - Using Promise.resolve to handle async errors (Better looking)
//next is a function that is used to pass control to the next middleware function in the stack
//middleware is a type of checkpoint in the request-response cycle of an Express application(for ex checking authentication, logging, etc.)
const asyncHandler = (requestHandler) => {
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    //error, request, response, next
    //next is a function that is used to pass control to the next middleware function in the stack
    }
}


export {asyncHandler}

// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}

// #M2 - Try catch method
    // const asyncHandler = (func) => async (req, res, next) => {
    //     try {
            
    //     } catch (error) {
    //         res.status(error.code || 500).json({
    //             success: false,
    //             message: error.message || "Internal Server Error",
    //         });
    //     }
    // }