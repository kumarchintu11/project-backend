// it will just create methods and export it.


// Syntax1: using promises
const asyncHandler = (requestHandler) =>{
    (req, res, next) =>{
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err)) 
    }
}


export {asyncHandler}




//Syntax2: using try-catch
// const asyncHandler = (fn) => async (req, res, next) =>{
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: flag, // for the front end developer
//             message: err.message
//          })
//     }
// }

