import { Router } from "express";
import {
    loginHandler,
    logoutHandler,
    refreshHandler,
    registerHandler,
    resetPasswordWithOTPHandler,
    sendEmailVerificationOTPHandler,
    sendPasswordResetOTPHandler,
    verifyEmailWithOTPHandler,
} from "../controllers/auth.controller";

const authRoutes = Router();

authRoutes.post("/register", registerHandler);
authRoutes.post("/login", loginHandler);
authRoutes.get("/refresh", refreshHandler);
authRoutes.get("/logout", logoutHandler);
authRoutes.post("/email/send-otp", sendEmailVerificationOTPHandler);
authRoutes.post("/email/verify", verifyEmailWithOTPHandler);
authRoutes.post("/password/forgot", sendPasswordResetOTPHandler);
authRoutes.post("/password/reset", resetPasswordWithOTPHandler);

export default authRoutes;