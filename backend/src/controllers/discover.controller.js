import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Connection } from '../models/connection.model.js';

const normalizeSkill = (skill = "") => (
    skill
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\./g, "")
        .replace(/\s+/g, " ")
);

const getDomainSkills = (domains = [], domainName) => {
    if (!Array.isArray(domains)) return [];

    if (domainName) {
        const matchedDomain = domains.find(domain => domain.name === domainName);
        return matchedDomain?.skills || [];
    }

    return domains.flatMap(domain => domain.skills || []);
};

const uniqueNormalizedSkills = (skills = []) => {
    const skillMap = new Map();

    skills.forEach(skill => {
        const normalized = normalizeSkill(skill);
        if (normalized && !skillMap.has(normalized)) {
            skillMap.set(normalized, skill);
        }
    });

    return skillMap;
};

const getProfileCompletenessScore = (user) => {
    let score = 0;
    if (user.profileImage) score += 1;
    if (user.bio) score += 1;
    if (user.occupation) score += 1;
    if (user.achievements) score += 1;
    return score;
};

const buildRelevance = ({ user, currentUserSkillsMap, otherSkills, type, domain }) => {
    const otherSkillsMap = uniqueNormalizedSkills(otherSkills);
    const currentSkillKeys = [...currentUserSkillsMap.keys()];
    const otherSkillKeys = [...otherSkillsMap.keys()];
    const sharedSkillKeys = otherSkillKeys.filter(skill => currentUserSkillsMap.has(skill));
    const sharedSkills = sharedSkillKeys.map(skill => otherSkillsMap.get(skill));
    const overlapRatio = currentSkillKeys.length
        ? sharedSkillKeys.length / currentSkillKeys.length
        : 0;

    let score = 0;
    const reasons = [];

    if (domain) {
        score += 6;
        reasons.push(`Interested in ${domain}`);
    }

    if (sharedSkillKeys.length > 0) {
        score += sharedSkillKeys.length * 8;
        score += overlapRatio * 10;
        reasons.unshift(`${sharedSkillKeys.length} shared skill${sharedSkillKeys.length === 1 ? "" : "s"}`);
    } else if (otherSkillKeys.length > 0) {
        score += Math.min(otherSkillKeys.length, 6) * 0.75;
        reasons.push(`${otherSkillKeys.length} listed skill${otherSkillKeys.length === 1 ? "" : "s"}`);
    }

    if (type === "mentor" && user.openToMentor) {
        score += 4;
        reasons.push("Open to mentoring");
    }

    score += getProfileCompletenessScore(user);
    score += Math.min(user.visitorCount || 0, 20) * 0.1;

    return {
        score,
        reasons: reasons.slice(0, 3),
        sharedSkills
    };
};

/**
 * Discover mentors or peers inside the current user's organization.
 * Relevance is based on domain fit, normalized skill overlap, mentor intent,
 * profile completeness, and a small visitor-count tie breaker.
 */
export const discoverUsers = asyncHandler(async (req, res) => {
    const { type = "peer", domain, page = 1, limit = 10 } = req.query;
    const currentUser = req.user;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) throw new ApiError(400, "Invalid page number");
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) throw new ApiError(400, "Invalid limit (1-50)");
    if (!["peer", "mentor"].includes(type)) throw new ApiError(400, "Invalid discovery type");

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
    excludedUserIds.push(currentUser._id.toString());

    const query = {
        _id: { $nin: excludedUserIds },
        orgCode: currentUser.orgCode
    };

    if (type === "mentor") {
        query.openToMentor = true;
        if (domain) query["mentorDomains.name"] = domain;
    } else if (domain) {
        query["domains.name"] = domain;
    }

    const allUsers = await User.find(query).select("-password -refreshToken");
    const currentUserSkillsMap = uniqueNormalizedSkills(getDomainSkills(currentUser.domains, domain));

    const scored = allUsers.map(user => {
        const otherSkills = type === "mentor"
            ? getDomainSkills(user.mentorDomains, domain)
            : getDomainSkills(user.domains, domain);
        const relevance = buildRelevance({
            user,
            currentUserSkillsMap,
            otherSkills,
            type,
            domain
        });

        return { user, relevance };
    });

    scored.sort((a, b) => {
        if (b.relevance.score !== a.relevance.score) {
            return b.relevance.score - a.relevance.score;
        }

        if ((b.user.visitorCount || 0) !== (a.user.visitorCount || 0)) {
            return (b.user.visitorCount || 0) - (a.user.visitorCount || 0);
        }

        return new Date(b.user.updatedAt) - new Date(a.user.updatedAt);
    });

    const total = scored.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginated = scored
        .slice((pageNum - 1) * limitNum, pageNum * limitNum)
        .map(entry => ({
            ...entry.user.toObject(),
            relevanceScore: Number(entry.relevance.score.toFixed(2)),
            relevanceReasons: entry.relevance.reasons,
            sharedSkills: entry.relevance.sharedSkills
        }));

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
