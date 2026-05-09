import jwt from 'jsonwebtoken';

// for creating tokens
const generateAccessToken = (userId) => {
    return jwt.sign(
        { _id: userId },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};


const generateRefreshToken = (userId) => {
    return jwt.sign(
        { _id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export { generateAccessToken, generateRefreshToken };
