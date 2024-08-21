import catchErrors from "../utils/catchErrors";
import { createAccount, loginUser, refreshUserAccessToken, resetPasswordWithOTP, sendEmailVerificationOTP, sendPasswordResetOTP, verifyEmailWithOTP } from "../services/auth.service";
import { CREATED, OK, UNAUTHORIZED } from "../constants/http";
import { clearAuthCookies, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, setAuthCookies } from "../utils/cookies";
import { emailSchema, registerSchema, loginSchema, verificationCodeSchema, resetPasswordSchema, resetPasswordWithOTPSchema, verifyEmailWithOTPSchema } from "./auth.schemas";
import { verifyToken } from "../utils/jwt";
import SessionModel from "../models/session.model";
import appAssert from "../utils/appAssert";

export const registerHandler = catchErrors(
  async (req, res) => {
    // Validate and parse the incoming request body according to registerSchema
    const request = registerSchema.parse({
      ...req.body,
      userAgent: req.headers["user-agent"],
    });

    // Call the createAccount service to handle account creation
    const { user, accessToken, refreshToken } = await createAccount(request);

    // Send email verification OTP
    await sendEmailVerificationOTP(user.email);

    // Return the response with success message
    return setAuthCookies({ res, accessToken, refreshToken })
      .status(CREATED)
      .json({
        message: "User registered successfully. Verification OTP sent to your email.",
      });
  }
);

export const loginHandler = catchErrors(
  async (req, res) => {
    // validate service (validate and parse the incoming request body according to loginSchema)
    const request = loginSchema.parse({
      ...req.body,
      userAgent: req.headers["user-agent"],
    });

    // Call service (call the loginUser service to handle user login)
    const { accessToken, refreshToken } = await loginUser(request);

    // return response
    return setAuthCookies({ res, accessToken, refreshToken }).status(OK).json({
      message: "Login successful"
    });
  }
);

export const logoutHandler = catchErrors(async (req, res) => {
  // extract and verify token (get the accessToken from cookies and verify it)
  const accessToken = req.cookies.accessToken as string | undefined;
  const { payload } = verifyToken(accessToken || "");

  // remove session from db
  if (payload) {
    await SessionModel.findByIdAndDelete(payload.sessionId);
  }

  // clear cookies
  return clearAuthCookies(res).status(OK).json({
    message: "Logout successful"
  });
});

export const refreshHandler = catchErrors(async (req, res) => {
  // extract and validate refresh token (get the refreshToken from cookies and ensure it's present)
  const refreshToken = req.cookies.refreshToken as string | undefined;
  appAssert(refreshToken, UNAUTHORIZED, "Missing refresh token");

  // refresh tokens (call the refreshUserAccessToken service to get a new access token and potentially a new refresh token)
  const { accessToken, newRefreshToken } = await refreshUserAccessToken(
    refreshToken
  );

  // update refresh token if a new one is provided (set the new refresh token in cookies, if available)
  if (newRefreshToken) {
    res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());
  }

  // return response with new access token 
  return res.status(OK).cookie("accessToken", accessToken, getAccessTokenCookieOptions()).json({
    message: "Access token refreshed",
  });
});

export const sendEmailVerificationOTPHandler = catchErrors(async (req, res) => {
  // Validate and extract email
  const email = emailSchema.parse(req.body.email);

  // Send email verification OTP
  await sendEmailVerificationOTP(email);

  // Return success response
  return res.status(OK).json({ message: "Email verification OTP sent to your email" });
});

export const verifyEmailWithOTPHandler = catchErrors(async (req, res) => {
  // Validate and extract verification OTP request
  const { email, otp } = verifyEmailWithOTPSchema.parse(req.body);

  // Verify the OTP
  await verifyEmailWithOTP(email, otp);

  // Return success response
  return res.status(OK).json({ message: "Email was successfully verified." });
});

//reset password via otp
//send email
export const sendPasswordResetOTPHandler = catchErrors(async (req, res) => {
  // Validate and extract email
  const email = emailSchema.parse(req.body.email);

  // Send password reset OTP
  await sendPasswordResetOTP(email);

  // Return success response
  return res.status(OK).json({ message: "Password reset OTP sent to your email" });
});

//resest password with otp
export const resetPasswordWithOTPHandler = catchErrors(async (req, res) => {
  // Validate and extract reset password request
  // const request = resetPasswordSchema.parse(req.body);
  const request = resetPasswordWithOTPSchema.parse(req.body);

  // Reset password
  await resetPasswordWithOTP(request);

  // Clear authentication cookies and return success response
  return clearAuthCookies(res).status(OK).json({ message: "Password was reset successfully" });
});
