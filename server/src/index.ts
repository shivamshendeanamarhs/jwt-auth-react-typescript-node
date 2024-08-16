import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
import connectToDatabase from "./config/db";
import mongoose from "mongoose";
import { APP_ORIGIN, NODE_ENV, PORT } from "./constants/env";
import { OK, INTERNAL_SERVER_ERROR } from "./constants/http";
import authRoutes from "./routes/auth.route";
import authenticate from "./middleware/authenticate";
import userRoutes from "./routes/user.route";
import sessionRoutes from "./routes/session.route";

const app = express();

// Extract origins from APP_ORIGIN
const allowedOrigins = APP_ORIGIN.split(',');

// CORS middleware configuration
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// api status check
app.get("/", (req, res) => {
    return res.status(OK).json({
        status: "healthy",
    });
});

// to check database connection and info
app.get("/test-db", async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        res.status(OK).json({
            status: "connected",
            collections
        });
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({
            status: "error",
        });
    }
});

// auth routes
app.use("/auth", authRoutes);

// protected routes
app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);

app.use(errorHandler);

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT} in ${NODE_ENV} environment.`);
    await connectToDatabase();
});
