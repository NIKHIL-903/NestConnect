import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import Routes
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import orgRouter from "./routes/org.routes.js";
import discoverRouter from "./routes/discover.routes.js";
import connectionRouter from "./routes/connection.routes.js";
import messageRouter from "./routes/message.routes.js";

// Import Middleware
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();


// Global Middleware


app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Request logger (useful for debugging)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});


// Test Route


app.get("/", (req, res) => {
    res.send("API is running");
});


// API Routes


app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/org", orgRouter);
app.use("/api/v1/discover", discoverRouter);
app.use("/api/v1/connections", connectionRouter);
app.use("/api/v1/messages", messageRouter);


// 404 Handler


app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});


// Global Error Handler


app.use(errorHandler);

export { app };