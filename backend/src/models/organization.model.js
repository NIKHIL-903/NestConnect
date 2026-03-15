import mongoose, { Schema } from 'mongoose';

const organizationSchema = new Schema(
    {
        orgName: {
            type: String,
            required: true,
            trim: true
        },
        orgCode: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        city: {
            type: String
        },
        description: {
            type: String
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

export const Organization = mongoose.model("Organization", organizationSchema);
