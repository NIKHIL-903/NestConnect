import { Message } from '../models/message.model.js';
import { Connection } from '../models/connection.model.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const initChatSocket = (io) => {

    // Authenticate socket on connection
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error("Unauthorized: No token"));

            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            const user = await User.findById(decoded._id).select("-password -refreshToken");
            if (!user) return next(new Error("Unauthorized: Invalid token"));

            socket.user = user; // ✅ attach verified user to socket
            next();
        } catch (err) {
            next(new Error("Unauthorized: Token verification failed"));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id} (${socket.user.userId})`);

        socket.on('join_room', async (connectionId) => {
            if (!connectionId) return;

            // Verify user is part of this connection
            const connection = await Connection.findOne({
                _id: connectionId,
                $or: [{ senderId: socket.user._id }, { receiverId: socket.user._id }],
                status: "accepted"
            });

            if (!connection) {
                socket.emit('error', { message: "Not authorized to join this room" });
                return;
            }

            socket.join(connectionId);
            console.log(`User joined connection room: ${connectionId}`);
        });

        socket.on('typing', (data) => {
            const { connectionId } = data;
            // ✅ senderId derived from verified socket user
            socket.to(connectionId).emit('user_typing', { senderId: socket.user._id });
        });

        socket.on('send_message', async (data) => {
            const { connectionId, content } = data; // ✅ no senderId from client

            try {
                // Verify user belongs to this connection
                const connection = await Connection.findOne({
                    _id: connectionId,
                    $or: [{ senderId: socket.user._id }, { receiverId: socket.user._id }],
                    status: "accepted"
                });

                if (!connection) {
                    socket.emit('message_error', { error: "Not authorized to send message in this connection" });
                    return;
                }

                const newMessage = await Message.create({
                    connectionId,
                    senderId: socket.user._id, // ✅ always from verified user
                    content
                });

                const populatedMessage = await newMessage.populate("senderId", "name profileImage userId");
                io.to(connectionId).emit('receive_message', populatedMessage);

            } catch (error) {
                console.error("Error sending message:", error);
                socket.emit('message_error', { error: "Failed to send message" });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};