import jwt from 'jsonwebtoken';

/**
 * Creates a JWT access token for a user
 * @param {string} userId - The user's ID
 * @returns {string} The signed JWT access token
 */
const generateAccessToken = (userId) => {
    return jwt.sign(
        { _id: userId },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

/**
 * Creates a JWT refresh token for a user
 * @param {string} userId - The user's ID
 * @returns {string} The signed JWT refresh token
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { _id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export { generateAccessToken, generateRefreshToken };
