import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.utils.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';

/**
 * Register a new user
 */
const registerUser = asyncHandler(async (req, res) => {
    // Extract fields from request
    const {
        name,
        email,
        password,
        userId,
        orgCode,
        doorNo,
        floor,
        block,
        bio,
        achievements,
        occupation
    } = req.body;

    // Parse JSON strings from multipart/form-data
    let domains_parsed = [];
    let mentorDomains_parsed = [];
    let isOpenToMentor = req.body.openToMentor === "true"; // Parse string boolean

    if (req.body.domains) {
        try {
            domains_parsed = JSON.parse(req.body.domains);
        } catch {
            throw new ApiError(400, "Invalid format for domains");
        }
    }

    if (req.body.mentorDomains) {
        try {
            mentorDomains_parsed = JSON.parse(req.body.mentorDomains);
        } catch {
            throw new ApiError(400, "Invalid format for mentorDomains");
        }
    }

    // Validate mentorDomains based on openToMentor
    if (isOpenToMentor) {
        if (!Array.isArray(mentorDomains_parsed) || mentorDomains_parsed.length === 0) {
            throw new ApiError(400, "Must provide at least 1 mentor domain when openToMentor is true");
        }
        
        // Every mentor domain must have at least 1 skill
        const isValidMentorDomains = mentorDomains_parsed.every(
            domain => domain.name && Array.isArray(domain.skills) && domain.skills.length > 0
        );

        if (!isValidMentorDomains) {
            throw new ApiError(400, "Each mentor domain must have at least 1 skill");
        }
    } else {
        if (req.body.mentorDomains && mentorDomains_parsed.length > 0) {
            throw new ApiError(400, "Cannot provide mentorDomains when openToMentor is false");
        }
        mentorDomains_parsed = []; // Clear it just in case
    }

    // Validate required fields
    if (!name || !email || !password || !userId || !orgCode || !doorNo || !block) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // Checking organization code validity
    const { Organization } = await import('../models/organization.model.js');
    const isValidOrg = await Organization.findOne({ orgCode });
    if (!isValidOrg) {
        throw new ApiError(400, "Invalid organization code");
    }

    // Check if user already exists
    const existedUserByEmail = await User.findOne({ email });
    if (existedUserByEmail) {
        throw new ApiError(409, "User with email already exists");
    }

    const existedUserByUserId = await User.findOne({ userId });
    if (existedUserByUserId) {
        throw new ApiError(409, "User with userId already exists");
    }

    // Handle profile image upload (optional)
    let profileImageLocalPath = req.file?.path;
    let profileImage = "";
    if (profileImageLocalPath) {
        const avatar = await uploadOnCloudinary(profileImageLocalPath);
        if (avatar) {
            profileImage = avatar.url;
        }
    }

    // Create new user
    const user = await User.create({
        name,
        email,
        password,
        userId,
        orgCode,
        doorNo,
        block,
        bio,
        achievements,
        floor,
        occupation,
        domains: domains_parsed,
        openToMentor: isOpenToMentor,
        mentorDomains: mentorDomains_parsed, // Saved updated mentor domains
        profileImage: profileImage
    });

    // Generate access token and refresh token
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Remove sensitive data
    const createdUser = await User
        .findById(user._id)
        .select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "User registration failed");
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            { user: createdUser, accessToken, refreshToken },
            "User registered successfully"
        )
    );
});

/**
 * Login user and return tokens
 */
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Compare password using bcrypt
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // Generate access token and refresh token
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Return tokens
    return res.status(200).json(
        new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully")
    );
});

/**
 * Refresh access token
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
    // Receive refresh token
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        // Verify refresh token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        // Generate new tokens
        const accessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        // Return new token
        return res.status(200).json(
            new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed")
        );
    } catch (error) {
        console.error("Token Refresh Error:", error?.message || "Invalid refresh token");
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

/**
 * Logout user
 */
const logoutUser = asyncHandler(async (req, res) => {
    // Remove refresh token from DB
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    );

    // Return success response
    return res.status(200).json(
        new ApiResponse(200, {}, "User logged out successfully")
    );
});

/**
 * Get current authenticated user
 */
const getMe = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "User fetched successfully")
    );
});

export { registerUser, loginUser, refreshAccessToken, logoutUser, getMe };
