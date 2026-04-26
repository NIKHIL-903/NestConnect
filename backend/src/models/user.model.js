import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const domainSchema = new Schema({  // this is a 
    name: { type: String, required: true }, // domain name 
    skills: [{ type: String }] // array of strings
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
        visitorCount: {
            type: Number,
            default: 0
        },
        refreshToken: {
            type: String
        }
    },
    { timestamps: true }
);

// hashing the password before saving , this keyword refers to current data
userSchema.pre("save", async function (next) {  // mongoose presave middleware
    if (!this.isModified("password")) return next(); // to prevent rehashing already hashed password
    this.password = await bcrypt.hash(this.password, 10);
    next(); // pass to next middleware 
});

// for async functions next() is not needed

// Add method to compare password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
