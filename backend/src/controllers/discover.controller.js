

/**
 * Discover mentors or peers based on interests within the same organization
 */
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Connection } from '../models/connection.model.js';

/**
 * Discover mentors or peers based on interests within the same organization
 * Excludes only pending/accepted connections (not rejected)
 * Sorts by skill similarity to the querying user (descending)
 * Supports page-based pagination (?page=1&limit=10)
 */
export const discoverUsers = asyncHandler(async (req, res) => {
    const { type, domain, page = 1, limit = 10 } = req.query;
    const currentUser = req.user;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) throw new ApiError(400, "Invalid page number");
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) throw new ApiError(400, "Invalid limit (1-50)");

    // ✅ Only exclude pending and accepted connections, NOT rejected
    const existingConnections = await Connection.find({
        $or: [
            { senderId: currentUser._id },
            { receiverId: currentUser._id }
        ],
        status: { $in: ["pending", "accepted"] }
    });

    const excludedUserIds = existingConnections.map(conn =>
        conn.senderId.toString() === currentUser._id.toString()
            ? conn.receiverId.toString()
            : conn.senderId.toString()
    );
    excludedUserIds.push(currentUser._id.toString()); // Exclude self

    // Base query — same org, exclude pending/accepted connections
    let query = {
        _id: { $nin: excludedUserIds },
        orgCode: currentUser.orgCode
    };

    if (type === 'mentor') {
        query.openToMentor = true;
        if (domain) query['mentorDomains.name'] = domain;
    } else if (type === 'peer' && domain) {
        query['domains.name'] = domain;
    }

    // Fetch all matching users (we sort in JS for skill similarity)
    const allUsers = await User.find(query).select("-password -refreshToken");

    // ✅ Determine querying user's skills for similarity comparison
    // Collect skills from mentorDomains or regular domains
    let currentUserSkills = [];

    if (type === 'mentor') {
        if (domain) {
            // Get skills from currentUser's mentorDomains for that specific domain
            const matchedMentorDomain = currentUser.mentorDomains?.find(d => d.name === domain);
            if (matchedMentorDomain?.skills?.length) {
                currentUserSkills = matchedMentorDomain.skills.map(s => s.toLowerCase());
            } else {
                // Fall back: if querying user has no mentor skills in that domain, look in regular domains
                const fallbackDomain = currentUser.domains?.find(d => d.name === domain);
                if (fallbackDomain?.skills?.length) {
                    currentUserSkills = fallbackDomain.skills.map(s => s.toLowerCase());
                }
            }
        } else {
            // If no search domain specified, grab ALL mentor skills across all mentorDomains
            if (currentUser.mentorDomains?.length) {
                currentUser.mentorDomains.forEach(md => {
                    if (md.skills?.length) {
                        md.skills.forEach(s => currentUserSkills.push(s.toLowerCase()));
                    }
                });
            }
            // Unique them
            currentUserSkills = [...new Set(currentUserSkills)];
        }
    } else {
        // type === 'peer' -> extract from domains
        if (domain) {
            const matchedDomain = currentUser.domains?.find(d => d.name === domain);
            if (matchedDomain?.skills?.length) {
                currentUserSkills = matchedDomain.skills.map(s => s.toLowerCase());
            }
        }
    }

    // ✅ Score and sort users by skill overlap
    const scored = allUsers.map(user => {
        let otherSkills = [];

        if (type === 'mentor') {
            if (domain) {
                const matchedMentorDomain = user.mentorDomains?.find(d => d.name === domain);
                if (matchedMentorDomain?.skills?.length) {
                    otherSkills = matchedMentorDomain.skills.map(s => s.toLowerCase());
                }
            } else {
                if (user.mentorDomains?.length) {
                    user.mentorDomains.forEach(md => {
                        if (md.skills?.length) {
                            md.skills.forEach(s => otherSkills.push(s.toLowerCase()));
                        }
                    });
                }
                otherSkills = [...new Set(otherSkills)];
            }
        } else {
            // type === 'peer'
            if (domain) {
                const matchedDomain = user.domains?.find(d => d.name === domain);
                if (matchedDomain?.skills?.length) {
                    otherSkills = matchedDomain.skills.map(s => s.toLowerCase());
                }
            }
        }

        let score;

        if (currentUserSkills.length === 0) {
            // ✅ Current user has no skills in this domain — rank by total skills count
            score = otherSkills.length;
        } else {
            // ✅ Rank by number of overlapping skills
            score = otherSkills.filter(s => currentUserSkills.includes(s)).length;
        }

        return { user, score };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // ✅ Apply pagination after sorting
    const total = scored.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginated = scored
        .slice((pageNum - 1) * limitNum, pageNum * limitNum)
        .map(entry => entry.user);

    return res.status(200).json(
        new ApiResponse(200, {
            users: paginated,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages
            }
        }, `Discovered ${type}s successfully`)
    );
});
