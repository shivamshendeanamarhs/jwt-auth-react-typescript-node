import catchErrors from "../utils/catchErrors";
import { createAccount, loginUser, refreshUserAccessToken, resetPassword, sendPasswordResetEmail, verifyEmail } from "../services/auth.service";
import { CREATED, OK, UNAUTHORIZED } from "../constants/http";
import { clearAuthCookies, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, setAuthCookies } from "../utils/cookies";
import { emailSchema, registerSchema, loginSchema, verificationCodeSchema, resetPasswordSchema } from "./auth.schemas";
import { verifyToken } from "../utils/jwt";
import SessionModel from "../models/session.model";
import appAssert from "../utils/appAssert";

export const registerHandler = catchErrors(
  async (req, res) => {
    //validate service (validate and parse the incoming request body accoring to registerSchema)
    const request = registerSchema.parse({
      ...req.body,
      userAgent: req.headers["user-agent"],
    });

    //Call service (call the createAccount service to handle account creation)
    const { user, accessToken, refreshToken } = await createAccount(request);

    //return response
    return setAuthCookies({ res, accessToken, refreshToken }).status(CREATED).json(user);
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

export const verifyEmailHandler = catchErrors(async (req, res) => {
  // validate and extract verification code (parse and validate the verification code from the request parameters)
  const verificationCode = verificationCodeSchema.parse(req.params.code);

  // verify email (call the verifyEmail service to validate and process the verification code)
  await verifyEmail(verificationCode);

  // return success response 
  return res.status(OK).json({ message: "Email was successfully verified" });
});

export const sendPasswordResetHandler = catchErrors(async (req, res) => {
  //validate and extract email (parse and validate the email address from the request body)
  const email = emailSchema.parse(req.body.email);

  // send password reset email (call the sendPasswordResetEmail service to send a password reset email)
  await sendPasswordResetEmail(email);

  // return success response 
  return res.status(OK).json({ message: "Password reset email sent" });
});

export const resetPasswordHandler = catchErrors(async (req, res) => {
  // validate and extract reset password request (parse and validate the request body containing the reset password details)
  const request = resetPasswordSchema.parse(req.body);

  // reset password (call the resetPassword service to update the user's password)
  await resetPassword(request);

  // clear authentication cookies and return success response
  return clearAuthCookies(res).status(OK).json({ message: "Password was reset successfully" });
});