import UserModel from "../models/user.model";
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

export type CreateAccountParams = {
  email: string;
  password: string;
  userAgent?: string;
};

//REGISTRATION PART
export const createAccount = async (data: CreateAccountParams) => {
  //**********verify user deosn't exist
  const existingUser = await UserModel.exists({
    email: data.email,
  });

  appAssert(!existingUser, CONFLICT, "Email already in use");

  //**********if dont exist, create user
  const user = await UserModel.create({
    email: data.email,
    password: data.password,
  });

  const userId = user._id

  //**********varification code (after creating user) to verify email
  const verificationCode = await VerificationCodeModel.create({
    userId,
    type: VerificationCodeType.EmailVerification,
    expiresAt: oneYearFromNow(),
  });

  const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`;

  //**********send verificatiotn email
  const { error } = await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });
  // ignore email errors for now
  if (error) console.error(error);

  //**********create session
  const session = await SessionModel.create({
    userId,
    userAgent: data.userAgent,
  });

  //**********sign access token and refresh token
  const refreshToken = signToken(
    {
      sessionId: session._id
    },
    refreshTokenSignOptions
  );

  const accessToken = signToken(
    {
      userId,
      sessionId: session._id
    }
  );

  //**********return user and token
  return {
    user: user.omitPassword(),      //user.omitPassword use don't show password to the user
    accessToken,
    refreshToken,
  };
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

  //**********validate password from the request
  const isValid = await user.comparePassword(password);
  appAssert(isValid, UNAUTHORIZED, "Invalid email or password");

  const userId = user._id;
  //**********create session
  const session = await SessionModel.create({
    userId,
    userAgent,
  });

  //**********payload for refreshToken
  const sessionInfo = {
    sessionId: session._id
  }

  //**********sign access token and refresh token
  const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);
  const accessToken = signToken({ ...sessionInfo, userId, });

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
export const verifyEmail = async (code: string) => {
  //**********get verification code 
  const validCode = await VerificationCodeModel.findOne({
    _id: code,
    type: VerificationCodeType.EmailVerification,
    expiresAt: { $gt: new Date() },
  });
  appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

  //**********get user by ID and update user to verified
  const updatedUser = await UserModel.findByIdAndUpdate(
    validCode.userId, { verified: true, }, { new: true }
  );
  appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to verify email");

  //**********delete verification code (after successful verification)
  await validCode.deleteOne();

  //**********return updated user
  return {
    user: updatedUser.omitPassword(),
  };
};

//SEND PASSWORD RESET EMAIL PART
export const sendPasswordResetEmail = async (email: string) => {
  //**********get user by email
  const user = await UserModel.findOne({ email });
  appAssert(user, NOT_FOUND, "User not found");

  //**********check email rate limit [check for max password reset requests (2 emails in 5min)]
  const fiveMinAgo = fiveMinutesAgo();
  const count = await VerificationCodeModel.countDocuments({
    userId: user._id,
    type: VerificationCodeType.PasswordReset,
    createdAt: { $gt: fiveMinAgo },
  });
  appAssert(count <= 1, TOO_MANY_REQUESTS, "Too many requests, please try again later");

  //**********create verification code 
  const expiresAt = oneHourFromNow();
  const verificationCode = await VerificationCodeModel.create({
    userId: user._id,
    type: VerificationCodeType.PasswordReset,
    expiresAt,
  });

  //**********send verification email
  const url = `${APP_ORIGIN}/password/reset?code=${verificationCode._id
    }&exp=${expiresAt.getTime()}`;

  const { data, error } = await sendMail({
    to: email,
    ...getPasswordResetTemplate(url),
  });
  appAssert(data?.id, INTERNAL_SERVER_ERROR, `${error?.name} - ${error?.message}`);

  //**********return seccess response
  return {
    url,
    emailId: data.id,
  };
};

//RESET PASSWORD PART
type ResetPasswordParams = {
  password: string;
  verificationCode: string;
};

export const resetPassword = async ({ verificationCode, password, }: ResetPasswordParams) => {
  //**********get the verification code
  const validCode = await VerificationCodeModel.findOne({
    _id: verificationCode,
    type: VerificationCodeType.PasswordReset,
    expiresAt: { $gt: new Date() },
  });
  appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

  //**********update user's password
  const updatedUser = await UserModel.findByIdAndUpdate(validCode.userId, {
    password: await hashValue(password),
  });
  appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to reset password");

  //**********delete the verification code
  await validCode.deleteOne();

  //delete all sessions
  await SessionModel.deleteMany({
    userId: validCode.userId
  });

  return { user: updatedUser.omitPassword() };
};
