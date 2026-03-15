import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Message } from '../models/message.model.js';
import { Connection } from '../models/connection.model.js';

/**
 * Get chat history for a connection
 */
export const getChatHistory = asyncHandler(async (req, res) => {
    const { connectionId } = req.params;

    // Verify user is part of the connection and it's accepted
    const connection = await Connection.findOne({
        _id: connectionId,
        $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
        status: "accepted"
    });

    if (!connection) {
        throw new ApiError(403, "Not authorized to view messages for this connection or connection not accepted");
    }

    const messages = await Message.find({ connectionId })
        .sort({ createdAt: 1 })
        .populate("senderId", "name profileImage userId");

    return res.status(200).json(
        new ApiResponse(200, messages, "Chat history fetched successfully")
    );
});
