import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

/**
 * Get current user profile
 */
export const getUserProfile = asyncHandler(async (req, res) => {
    const user = req.user;
    
    return res.status(200).json(
        new ApiResponse(200, user, "User profile fetched successfully")
    );
});

/**
 * Update current user profile
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
    const { 
        name, bio, achievements, occupation, block, floor, doorNo, userId
    } = req.body;

    // ✅ Parse JSON strings from multipart/form-data
    let domains_parsed;
    let mentorDomains_parsed;
    let effectiveOpenToMentor = req.user.openToMentor;

    // Parse openToMentor string to boolean if provided
    if (req.body.openToMentor !== undefined) {
        effectiveOpenToMentor = req.body.openToMentor === "true";
    }

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

    // ✅ Validate mentorDomains logic based on effective openToMentor state
    let finalMentorDomains;

    if (effectiveOpenToMentor) {
        // If it's true, and we are updating the arrays, mentorDomains_parsed must be valid
        if (req.body.mentorDomains) {
            if (!Array.isArray(mentorDomains_parsed) || mentorDomains_parsed.length === 0) {
                throw new ApiError(400, "Must provide at least 1 mentor domain when openToMentor is true");
            }
            
            const isValidMentorDomains = mentorDomains_parsed.every(
                domain => domain.name && Array.isArray(domain.skills) && domain.skills.length > 0
            );

            if (!isValidMentorDomains) {
                throw new ApiError(400, "Each mentor domain must have at least 1 skill");
            }

            finalMentorDomains = mentorDomains_parsed;
        }
        // If mentorDomains is NOT provided but openToMentor is true, we leave the existing one as is
    } else {
        // openToMentor is false
        if (req.body.mentorDomains && mentorDomains_parsed.length > 0) {
            throw new ApiError(400, "Cannot provide mentorDomains when openToMentor is false");
        }
        
        // Ensure it gets wiped
        finalMentorDomains = [];
    }

    let profileImageLocalPath = req.file?.path;
    let newProfileImage = req.user.profileImage;

    if (profileImageLocalPath) {
        const avatar = await uploadOnCloudinary(profileImageLocalPath);
        if (avatar) {
            newProfileImage = avatar.url;
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                ...(name && { name }),
                ...(bio && { bio }),
                ...(achievements && { achievements }),
                ...(occupation && { occupation }),
                ...(block && { block }),
                ...(floor && { floor }),
                ...(doorNo && { doorNo }),
                ...(userId && { userId }),
                ...(domains_parsed && { domains: domains_parsed }),
                ...(finalMentorDomains && { mentorDomains: finalMentorDomains }),
                openToMentor: effectiveOpenToMentor,
                profileImage: newProfileImage
            }
        },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "User profile updated successfully")
    );
});

/**
 * Fetch another user's profile using userId
 */
export const getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findOne({ userId }).select("-password -refreshToken -email");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, user, "User fetched successfully")
    );
});

/**
 * Check if a userId is already taken
 */
export const checkUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findOne({ userId }).select("_id");

    if (user) {
        return res.status(200).json(
            new ApiResponse(200, { available: false }, "User ID is already taken")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, { available: true }, "User ID is available")
    );
});
