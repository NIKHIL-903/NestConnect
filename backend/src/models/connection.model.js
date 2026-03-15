import mongoose, { Schema } from 'mongoose';

const connectionSchema = new Schema(
    {
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiverId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
            required: true
        }
    },
    { timestamps: true }
);

// Prevent duplicate connections between same pair of users
connectionSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

export const Connection = mongoose.model("Connection", connectionSchema);
