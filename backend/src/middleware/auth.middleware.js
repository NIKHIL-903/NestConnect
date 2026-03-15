import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';

/**
 * Verifies JWT access token and attaches decoded user to request object
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // Read token from Authorization header or cookies
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        // Verify token
        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Fetch user from DB and attach to req.user
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        // Attach user to req
        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication Error:", error?.message || "Invalid access token");
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});
