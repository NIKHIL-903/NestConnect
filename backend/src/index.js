import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { app } from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { initChatSocket } from "./sockets/chat.socket.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

async function startServer() {
    try {
        // Connect to MongoDB
        await connectDB();

        // Create HTTP server using Express app
        const httpServer = createServer(app);

        // Initialize Socket.IO
        const io = new Server(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN || "*",
                credentials: true
            }
        });

        // Initialize chat sockets
        initChatSocket(io);

        // Start server
        httpServer.listen(PORT, () => {
            console.log(`Server running at port ${PORT}`);
        });

    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
}

// Start the application
startServer();

// Graceful shutdown
// const shutdown = () => {
//     console.log("Shutting down server...");

//     if (httpServer) {
//         httpServer.close(() => {
//             console.log("Server closed");
//             process.exit(0);
//         });
//     } else {
//         process.exit(0);
//     }
// };

// process.on("SIGINT", shutdown);   // Ctrl+C
// process.on("SIGTERM", shutdown);  // Nodemon restart