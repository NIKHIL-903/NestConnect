import { ApiError } from '../utils/ApiError.js';

/**
 * Global error handler middleware
 * Returns structured error responses using ApiError
 */
export const errorHandler = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        // If the error isn't an ApiError instance, wrap it in one
        const statusCode = error.statusCode || 500;
        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
    };

    // Log important server errors
    if (error.statusCode >= 500) {
        console.error(`[Server Error] ${error.message}`, err);
    }

    return res.status(error.statusCode).json(response);
};
