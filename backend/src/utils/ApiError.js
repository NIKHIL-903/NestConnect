/**
 * Standard API error handling class
 */
class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message); // already exists in the parent class super() -> parent constructor
        this.statusCode = statusCode; // assigning works even with out declaring variables
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
