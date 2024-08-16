import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../lib/api";

const ResetPasswordForm = ({ code }) => {
  const [password, setPassword] = useState("");
  const {
    mutate: resetUserPassword,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationFn: resetPassword,
  });

  return (
    <>
      <h1 className="heading">Change your password</h1>
      <div className="reset-password-form-container">
        {isError && (
          <div className="error-message">
            {error.message || "An error occurred"}
          </div>
        )}
        {isSuccess ? (
          <div>
            <div className="alert success">
              <span className="alert-icon">✔</span>
              Password updated successfully!
            </div>
            <a href="/login" className="link">Sign in</a>
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                resetUserPassword({ password, verificationCode: code })
              }
              autoFocus
              className="input"
            />
            <button
              className="button"
              disabled={password.length < 6}
              onClick={() =>
                resetUserPassword({
                  password,
                  verificationCode: code,
                })
              }
            >
              {isPending ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ResetPasswordForm;
