import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { Organization } from '../models/organization.model.js';
import { User } from '../models/user.model.js';

const requiredUserFields = [
    'name',
    'email',
    'password',
    'userId',
    'orgCode',
    'doorNo',
    'floor',
    'block',
    'bio',
    'occupation'
];

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const removeLocalFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const validateDomains = (domains, fieldName) => {
    if (!Array.isArray(domains) || domains.length === 0) {
        return [`${fieldName} must contain at least 1 domain`];
    }

    return domains.flatMap((domain, index) => {
        const errors = [];
        if (!domain || typeof domain !== 'object') {
            return [`${fieldName}[${index}] must be an object`];
        }

        if (!normalizeText(domain.name)) {
            errors.push(`${fieldName}[${index}].name is required`);
        }

        if (!Array.isArray(domain.skills) || domain.skills.filter(skill => normalizeText(skill)).length === 0) {
            errors.push(`${fieldName}[${index}] must have at least 1 skill`);
        }

        return errors;
    });
};

const cleanDomains = (domains = []) => (
    domains.map(domain => ({
        name: normalizeText(domain.name),
        skills: domain.skills.map(skill => normalizeText(skill)).filter(Boolean)
    }))
);

const bulkRegisterSeededUsers = asyncHandler(async (req, res) => {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
        throw new ApiError(400, 'users must be a non-empty array');
    }

    const orgCodes = [...new Set(users.map(user => normalizeText(user?.orgCode)).filter(Boolean))];
    const validOrganizations = await Organization.find({ orgCode: { $in: orgCodes } })
        .select('orgCode')
        .lean();
    const validOrgCodes = new Set(validOrganizations.map(org => org.orgCode));

    const requestEmailCounts = new Map();
    const requestUserIdCounts = new Map();

    users.forEach(user => {
        const email = normalizeKey(user?.email);
        const userId = normalizeKey(user?.userId);

        if (email) requestEmailCounts.set(email, (requestEmailCounts.get(email) || 0) + 1);
        if (userId) requestUserIdCounts.set(userId, (requestUserIdCounts.get(userId) || 0) + 1);
    });

    const emails = [...requestEmailCounts.keys()];
    const userIds = [...requestUserIdCounts.keys()];
    const existingUsers = await User.find({
        $or: [
            { email: { $in: emails } },
            { userId: { $in: userIds } }
        ]
    })
        .select('email userId')
        .lean();

    const existingEmails = new Set(existingUsers.map(user => user.email));
    const existingUserIds = new Set(existingUsers.map(user => user.userId));
    const acceptedEmails = new Set();
    const acceptedUserIds = new Set();
    const skippedUsers = [];
    const usersToCreate = [];

    users.forEach((user, index) => {
        const errors = [];
        const email = normalizeKey(user?.email);
        const userId = normalizeKey(user?.userId);
        const openToMentor = user?.openToMentor === true;

        requiredUserFields.forEach(field => {
            if (!normalizeText(user?.[field])) {
                errors.push(`${field} is required`);
            }
        });

        errors.push(...validateDomains(user?.domains, 'domains'));

        if (openToMentor) {
            errors.push(...validateDomains(user?.mentorDomains, 'mentorDomains'));
        }

        if (normalizeText(user?.orgCode) && !validOrgCodes.has(normalizeText(user.orgCode))) {
            errors.push('Invalid organization code');
        }

        if (email && existingEmails.has(email)) {
            errors.push('User with email already exists');
        }

        if (userId && existingUserIds.has(userId)) {
            errors.push('User with userId already exists');
        }

        if (email && requestEmailCounts.get(email) > 1 && acceptedEmails.has(email)) {
            errors.push('Duplicate email in request');
        }

        if (userId && requestUserIdCounts.get(userId) > 1 && acceptedUserIds.has(userId)) {
            errors.push('Duplicate userId in request');
        }

        if (errors.length > 0) {
            skippedUsers.push({
                index,
                email: email || user?.email || null,
                userId: userId || user?.userId || null,
                reasons: errors
            });
            return;
        }

        acceptedEmails.add(email);
        acceptedUserIds.add(userId);

        usersToCreate.push({
            name: normalizeText(user.name),
            email,
            password: user.password,
            userId,
            orgCode: normalizeText(user.orgCode),
            doorNo: normalizeText(user.doorNo),
            floor: normalizeText(user.floor),
            block: normalizeText(user.block),
            bio: normalizeText(user.bio),
            achievements: normalizeText(user.achievements),
            occupation: normalizeText(user.occupation),
            domains: cleanDomains(user.domains),
            openToMentor,
            mentorDomains: openToMentor ? cleanDomains(user.mentorDomains) : [],
            profileImage: '',
            isSeededUser: true
        });
    });

    const usersWithHashedPasswords = await Promise.all(
        usersToCreate.map(async user => ({
            ...user,
            password: await bcrypt.hash(user.password, 10)
        }))
    );

    let createdUsers = [];
    if (usersWithHashedPasswords.length > 0) {
        try {
            createdUsers = await User.insertMany(usersWithHashedPasswords, { ordered: false });
        } catch (error) {
            const writeErrors = error?.writeErrors || error?.result?.result?.writeErrors || [];
            const duplicateErrors = writeErrors.filter(writeError => writeError?.code === 11000);

            if (duplicateErrors.length === 0 && error?.code !== 11000) {
                throw error;
            }

            duplicateErrors.forEach(writeError => {
                skippedUsers.push({
                    email: writeError?.err?.op?.email || writeError?.op?.email || null,
                    userId: writeError?.err?.op?.userId || writeError?.op?.userId || null,
                    reasons: ['Duplicate email or userId']
                });
            });

            const attemptedUserIds = usersWithHashedPasswords.map(user => user.userId);
            createdUsers = await User.find({
                userId: { $in: attemptedUserIds },
                isSeededUser: true
            })
                .select('-password -refreshToken')
                .lean();
        }
    }

    const safeCreatedUsers = createdUsers.map(user => {
        const userObject = typeof user.toObject === 'function' ? user.toObject() : user;
        delete userObject.password;
        delete userObject.refreshToken;
        return userObject;
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                createdCount: safeCreatedUsers.length,
                skippedCount: skippedUsers.length,
                createdUsers: safeCreatedUsers,
                skippedUsers
            },
            'Seeded users processed'
        )
    );
});

const bulkUploadSeededProfilePictures = asyncHandler(async (req, res) => {
    const files = req.files || [];

    if (!Array.isArray(files) || files.length === 0) {
        throw new ApiError(400, 'At least 1 image is required');
    }

    const uploadedUsers = [];
    const skippedUsers = [];
    const failedUploads = [];

    for (const file of files) {
        const userId = normalizeKey(path.parse(file.originalname).name);

        try {
            const user = await User.findOne({ userId, isSeededUser: true });

            if (!user) {
                skippedUsers.push({
                    file: file.originalname,
                    userId,
                    reason: 'Seeded user not found'
                });
                removeLocalFile(file.path);
                continue;
            }

            const uploadedImage = await uploadOnCloudinary(file.path);

            if (!uploadedImage?.url) {
                failedUploads.push({
                    file: file.originalname,
                    userId,
                    reason: 'Cloudinary upload failed'
                });
                continue;
            }

            user.profileImage = uploadedImage.url;
            await user.save({ validateBeforeSave: false });

            uploadedUsers.push({
                userId: user.userId,
                email: user.email,
                profileImage: user.profileImage
            });
        } catch (error) {
            failedUploads.push({
                file: file.originalname,
                userId,
                reason: error?.message || 'Upload failed'
            });
            removeLocalFile(file.path);
        }
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                uploadedUsers,
                skippedUsers,
                failedUploads
            },
            'Seeded profile picture upload processed'
        )
    );
});

export { bulkRegisterSeededUsers, bulkUploadSeededProfilePictures };
