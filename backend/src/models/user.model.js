import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const domainSchema = new Schema({
    name: { type: String, required: true },
    skills: [{ type: String }]
}, { _id: false });

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        userId: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        orgCode: {
            type: String,
            required: true
        },
        doorNo: {
            type: String,
            required: true
        },
        floor: {
            type: String,
            required: true
        },
        block: {
            type: String,
            required: true
        },
        bio: {
            type: String,
            required: true
        },
        achievements: {
            type: String
        },
        occupation: {
            type: String,
            required: true
        },
        domains: [domainSchema],
        openToMentor: {
            type: Boolean,
            default: false
        },
        mentorDomains: [domainSchema],
        profileImage: {
            type: String // Cloudinary URL
        },
        refreshToken: {
            type: String
        }
    },
    { timestamps: true }
);

// Hash password before saving using bcrypt
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Add method to compare password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
