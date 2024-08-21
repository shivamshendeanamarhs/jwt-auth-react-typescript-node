import UserModel, { UserDocument } from "../models/user.model";
import VerificationCodeModel from "../models/verificaitonCode.model";
import VerificationCodeType from "../constants/VerificationCodeType";
import { fiveMinutesAgo, oneHourFromNow, oneYearFromNow, ONE_DAY_MS, thirtyDaysFromNow } from "../utils/date";
import SessionModel from "../models/session.model";
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND, TOO_MANY_REQUESTS, UNAUTHORIZED } from "../constants/http";
import appAssert from "../utils/appAssert";
import { verifyToken, RefreshTokenPayload, refreshTokenSignOptions, signToken } from "../utils/jwt";
import { getPasswordResetTemplate, getVerifyEmailTemplate } from "../utils/emailTamplates";
import { APP_ORIGIN } from "../constants/env";
import { sendMail } from "../utils/sendMail";
import { hashValue } from "../utils/bcrypt";
import nodemailer from "nodemailer";
import mongoose from "mongoose";

export type CreateAccountParams = {
  email: string;
  password: string;
  userAgent?: string;
};

//REGISTRATION PART
export const createAccount = async (data: CreateAccountParams) => {
  //**********Verify user doesn't exist
  const existingUser = await UserModel.exists({ email: data.email });
  appAssert(!existingUser, CONFLICT, "Email already in use");

  //**********Create user
  const user = await UserModel.create({
    email: data.email,
    password: data.password,
  });

  const userId = user._id;

  //Generate a random code
  const code = generateRandomCode();

  console.log("Generated Verification Code:", code);

  //**********Create verification code document to verify email
  const verificationCode = await VerificationCodeModel.create({
    userId,
    type: VerificationCodeType.EmailVerification,
    code, // Ensure the code is included
    expiresAt: oneYearFromNow(),
  });

  const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`;

  //**********Send verification email
  const { error } = await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });

  // Ignore email errors for now
  if (error) console.error(error);

  //**********Create session
  const session = await SessionModel.create({
    userId,
    userAgent: data.userAgent,
  });

  //**********Sign access token and refresh token
  const refreshToken = signToken({ sessionId: session._id }, refreshTokenSignOptions);
  const accessToken = signToken({ userId, sessionId: session._id });

  //**********return user and token
  return {
    user: user.omitPassword(), // Exclude password from the user object
    accessToken,
    refreshToken,
  };
};

const generateRandomCode = (length = 6) => {
  return Math.random().toString(36).substr(2, length).toUpperCase();
};



//LOGIN PART
type LoginParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export const loginUser = async ({ email, password, userAgent }: LoginParams) => {
  //**********get the user by email
  const user = await UserModel.findOne({ email });
  appAssert(user, UNAUTHORIZED, "Invalid email or password");

  // **********validate password from the request
  const isValid = await user.comparePassword(password);
  appAssert(isValid, UNAUTHORIZED, "Invalid email or password");

  const userId = user._id;
  //**********create session
  const session = await SessionModel.create({
    userId,
    userAgent,
  });

  const refreshToken = signToken({ sessionId: session._id }, refreshTokenSignOptions);
  const accessToken = signToken({ sessionId: session._id, userId });

  //**********return token
  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};


//REFRESH USER PART 
export const refreshUserAccessToken = async (refreshToken: string) => {
  //**********verify and decode refresh token 
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  appAssert(payload, UNAUTHORIZED, "Invalid refresh token")

  //**********check session validity 
  const session = await SessionModel.findById(payload.sessionId);
  const now = Date.now();
  appAssert(session && session.expiresAt.getTime() > now, UNAUTHORIZED, "Session expired");

  //**********refresh session if needed (extend session expiry if it's about to expire within the next 24 hours)
  const sessionNeedsRefresh = session.expiresAt.getTime() - now <= ONE_DAY_MS;
  if (sessionNeedsRefresh) {
    session.expiresAt = thirtyDaysFromNow();
    await session.save();
  }

  //**********sign new refresh token if session was refreshed 
  const newRefreshToken = sessionNeedsRefresh ? signToken(
    { sessionId: session._id, }, refreshTokenSignOptions) : undefined;

  //**********sign new access token 
  const accessToken = signToken({
    userId: session.userId,
    sessionId: session._id,
  });

  //**********return new tokens (return the new access token and optionally the new refresh token)
  return {
    accessToken,
    newRefreshToken,
  };
};

//VERIFY EMAIL PART
export const sendEmailVerificationOTP = async (email: string) => {
  // Get user by email
  const user = await UserModel.findOne({ email });
  appAssert(user, NOT_FOUND, "User not found");

  // Generate a 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Save OTP to the database with expiration
  const expiresAt = oneHourFromNow(); // Set expiration time for OTP
  await VerificationCodeModel.create({
    userId: user._id,
    code: otp,
    type: VerificationCodeType.EmailVerification,
    expiresAt,
  });

  // Send OTP via Nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other email service you prefer
    auth: {
      user: 'shivamshende300@gmail.com',
      pass: 'hdmb nhom nfij egvv',
    },
  });

  const mailOptions = {
    from: '"Shivam Shende" <shivamshende300@gmail.com>',
    to: email,
    subject: "Your Email Verification OTP",
    text: `Your OTP for email verification is ${otp}. It is valid for 1 hour.`,
  };

  await transporter.sendMail(mailOptions);
};


export const verifyEmailWithOTP = async (email: string, otp: string) => {
  // Get the verification code from the database
  const validCode = await VerificationCodeModel.findOne({
    code: otp,
    type: VerificationCodeType.EmailVerification,
    expiresAt: { $gt: new Date() },
  });
  appAssert(validCode, NOT_FOUND, "Invalid or expired OTP");

  // Get user by email and update to verified
  const user = await UserModel.findOneAndUpdate(
    { email, _id: validCode.userId },
    { verified: true },
    { new: true }
  );
  appAssert(user, INTERNAL_SERVER_ERROR, "Failed to verify email");

  // Delete the verification code after successful verification
  await validCode.deleteOne();

  return { user: user.omitPassword() };
};

//RESET PASSWORD OTP EMAIL PART
export const sendPasswordResetOTP = async (email: string) => {
  // Get user by email
  const user = await UserModel.findOne({ email });
  appAssert(user, NOT_FOUND, "User not found");

  // Generate a 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Save OTP to the database with expiration
  const expiresAt = oneHourFromNow(); // Set expiration time for OTP
  await VerificationCodeModel.create({
    userId: user._id,
    code: otp,
    type: VerificationCodeType.PasswordReset,
    expiresAt,
  });

  // Send OTP via Nodemailer part
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other email service you prefer
    auth: {
      user: 'shivamshende300@gmail.com',
      pass: 'hdmb nhom nfij egvv',
    },
  });

  const mailOptions = {
    from: '"Shivam Shende" <shivamshende300@gmail.com>',
    to: email,
    subject: "Your Password Reset OTP",
    text: `Your OTP for password reset is ${otp}. It is valid for 1 hour.`,
  };

  await transporter.sendMail(mailOptions);
};

type ResetPasswordParams = {
  email: string;
  otp: string;
  password: string;
}

//RESET PASSWORD THROUGH OTP PART
export const resetPasswordWithOTP = async ({ email, otp, password }: ResetPasswordParams) => {
  // Log the OTP received and the user's email
  console.log("Received OTP:", otp, "for email:", email);

  // Get the verification code from the database
  const validCode = await VerificationCodeModel.findOne({
    code: otp,  // Search for the OTP in the `code` field
    type: VerificationCodeType.PasswordReset,
    expiresAt: { $gt: new Date() },
  });

  // Log the found OTP record or the error
  if (!validCode) {
    console.log("Could not find the OTP:", otp);
  } else {
    console.log("OTP matched:", validCode.code);
  }

  // Ensure the OTP exists and is valid
  appAssert(validCode, NOT_FOUND, "Invalid or expired OTP");

  // Validate the user associated with the OTP
  const user = await UserModel.findOne({ email });
  appAssert(user, UNAUTHORIZED, "User not found");

  // Log the user and verification code association
  console.log("User ID:", user._id, "Verification code user ID:", validCode.userId);

  // Ensure that user._id is treated as mongoose.Types.ObjectId
  const userId = user._id as mongoose.Types.ObjectId;

  if (!userId.equals(validCode.userId)) {
    throw new Error("Unauthorized access");
  }

  // Check if the userId matches the one associated with the OTP
  appAssert(userId.equals(validCode.userId), UNAUTHORIZED, "Unauthorized access");

  // Update user's password
  user.password = await hashValue(password);
  await user.save();

  // Delete the verification code after successful password reset
  await validCode.deleteOne();

  // Delete all sessions associated with the user
  await SessionModel.deleteMany({ userId });

  return { user: user.omitPassword() };
};
