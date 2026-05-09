import dotenv from "dotenv";
import connectDB from "./config/db.js";  //function to connect to DB
import { app } from "./app.js";  // importing express app instance
import { createServer } from "http"; //for socket.IO
import { Server } from "socket.io";
import { initChatSocket } from "./sockets/chat.socket.js";

dotenv.config(); // for loading env variables

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
                origin: process.env.CORS_ORIGIN || "*", // trusting all 
                credentials: true // browser is allowed to send sensitive data like sessioon cookies   
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

