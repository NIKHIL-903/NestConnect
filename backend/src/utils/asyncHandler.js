/**
 * Wraps async controllers to automatically forward errors to the error middleware
 * @param {Function} requestHandler - The async controller function
 */
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};

export { asyncHandler };
