import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { Connection } from '../models/connection.model.js';

/**
 * Send a connection request
 */
export const sendConnectionRequest = asyncHandler(async (req, res) => {

    const { receiverUserId } = req.body;

    if (!receiverUserId) {
        throw new ApiError(400, "Receiver userId is required");
    }

    // Prevent self connection
    if (req.user.userId === receiverUserId) {
        throw new ApiError(400, "Cannot send connection request to yourself");
    }

    // Find receiver using userId
    const receiver = await User.findOne({ userId: receiverUserId });

    if (!receiver) {
        throw new ApiError(404, "Receiver not found");
    }

    // Ensure both users are in the same organization
    if (receiver.orgCode !== req.user.orgCode) {
        throw new ApiError(403, "Users must belong to the same organization to connect");
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
        $or: [
            { senderId: req.user._id, receiverId: receiver._id },
            { senderId: receiver._id, receiverId: req.user._id }
        ]
    });

    if (existingConnection) {
        throw new ApiError(409, "Connection or request already exists between these users");
    }

    // Create connection request
    const connection = await Connection.create({
        senderId: req.user._id,
        receiverId: receiver._id,
        status: "pending"
    });

    return res.status(201).json(
        new ApiResponse(201, connection, "Connection request sent successfully")
    );
});
/**
 * Get accepted connections
 */
export const getConnections = asyncHandler(async (req, res) => {
    const connections = await Connection.find({
        $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
        status: "accepted"
    }).populate("senderId", "name userId profileImage occupation").populate("receiverId", "name userId profileImage occupation");

    return res.status(200).json(
        new ApiResponse(200, connections, "Connections fetched successfully")
    );
});

/**
 * Get all pending connection requests for user
 */
export const getConnectionRequests = asyncHandler(async (req, res) => {
    const requests = await Connection.find({
        $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
        status: "pending"
    })
        .populate("senderId", "name userId profileImage occupation bio")
        .populate("receiverId", "name userId profileImage occupation bio");

    return res.status(200).json(
        new ApiResponse(200, requests, "Pending connection requests fetched successfully")
    );
});

/**
 * Accept connection request
 */
export const acceptConnection = asyncHandler(async (req, res) => {

    const senderUserId = req.params.userId.trim();

    const sender = await User.findOne({ userId: senderUserId });

    if (!sender) {
        throw new ApiError(404, "Sender not found");
    }

    const connection = await Connection.findOneAndUpdate(
        {
            senderId: sender._id,
            receiverId: req.user._id,
            status: "pending"
        },
        { status: "accepted" },
        { new: true }
    );

    if (!connection) {
        throw new ApiError(404, "Connection request not found");
    }

    return res.status(200).json(
        new ApiResponse(200, connection, "Connection request accepted")
    );
});

/**
 * Reject connection request
 */
export const rejectConnection = asyncHandler(async (req, res) => {

    const senderUserId = req.params.userId.trim();

    const sender = await User.findOne({ userId: senderUserId });

    if (!sender) {
        throw new ApiError(404, "Sender not found");
    }

    const connection = await Connection.findOneAndUpdate(
        {
            senderId: sender._id,
            receiverId: req.user._id,
            status: "pending"
        },
        { status: "rejected" },
        { new: true }
    );

    if (!connection) {
        throw new ApiError(404, "Connection request not found");
    }

    return res.status(200).json(
        new ApiResponse(200, connection, "Connection request rejected")
    );
});

/**
 * Remove connection
 */
export const removeConnection = asyncHandler(async (req, res) => {

    const userId = req.params.userId.trim();

    const otherUser = await User.findOne({ userId });

    if (!otherUser) {
        throw new ApiError(404, "User not found");
    }

    const connection = await Connection.findOneAndDelete({
        $or: [
            { senderId: req.user._id, receiverId: otherUser._id },
            { senderId: otherUser._id, receiverId: req.user._id }
        ],
        status: "accepted"
    });

    if (!connection) {
        throw new ApiError(404, "Connection not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Connection removed successfully")
    );
});
