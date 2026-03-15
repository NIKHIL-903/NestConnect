import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Organization } from '../models/organization.model.js';
import crypto from 'crypto';

/**
 * Generate a random 6 character alphanumeric code
 */
const generateOrgCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

/**
 * Create a new organization
 */
export const createOrganization = asyncHandler(async (req, res) => {
    const { orgName, city, description } = req.body;

    if (!orgName) {
        throw new ApiError(400, "Organization name is required");
    }

    // Generate unique org code
    let orgCode;
    let isUnique = false;
    
    while (!isUnique) {
        orgCode = generateOrgCode();
        const existingOrg = await Organization.findOne({ orgCode });
        if (!existingOrg) isUnique = true;
    }

    const organization = await Organization.create({
        orgName,
        orgCode,
        city,
        description,
        createdBy: req.user?._id // Assumes user is authenticated, though requirements say auth needed? Actually requirements say create org returns orgCode. If it requires auth we keep this.
    });

    return res.status(201).json(
        new ApiResponse(201, { orgCode: organization.orgCode, organization }, "Organization created successfully")
    );
});

/**
 * Get organization by code
 */
export const getOrganization = asyncHandler(async (req, res) => {
    const { orgCode } = req.params;

    const organization = await Organization.findOne({ orgCode });

    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }

    return res.status(200).json(
        new ApiResponse(200, organization, "Organization fetched successfully")
    );
});

/**
 * Update organization
 */
export const updateOrganization = asyncHandler(async (req, res) => {
    const { orgCode } = req.params;
    const { orgName, city, description } = req.body;

    const organization = await Organization.findOneAndUpdate(
        { orgCode },
        { 
            $set: {
                ...(orgName && { orgName }),
                ...(city && { city }),
                ...(description && { description })
            }
        },
        { new: true, runValidators: true }
    );

    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }

    return res.status(200).json(
        new ApiResponse(200, organization, "Organization updated successfully")
    );
});

/**
 * Check if organization code exists
 */
export const checkOrgCode = asyncHandler(async (req, res) => {
    const { orgCode } = req.params;

    const organization = await Organization.findOne({ orgCode }).select("orgName");

    if (!organization) {
        return res.status(200).json(
            new ApiResponse(200, { valid: false }, "Organization code is invalid")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, { valid: true, orgName: organization.orgName }, "Organization code is valid")
    );
});
