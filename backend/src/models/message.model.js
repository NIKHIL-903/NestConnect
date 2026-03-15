import mongoose, { Schema } from 'mongoose';

const messageSchema = new Schema(
    {
        connectionId: {
            type: Schema.Types.ObjectId,
            ref: "Connection",
            required: true
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
