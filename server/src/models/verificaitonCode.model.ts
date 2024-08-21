import mongoose from "mongoose";
import VerificationCodeType from "../constants/VerificationCodeType";

export interface VerificationCodeDocument extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    code: string;  // Add this line
    type: VerificationCodeType;
    expiresAt: Date;
    createdAt: Date;
}

const verificationCodeSchema = new mongoose.Schema<VerificationCodeDocument>({
    userId: {
        ref: "User",
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    code: { type: String, required: true },  // Add this line
    type: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
});

const VerificationCodeModel = mongoose.model<VerificationCodeDocument>(
    "VerificationCode",
    verificationCodeSchema,
    "verification_codes"
);
export default VerificationCodeModel;
