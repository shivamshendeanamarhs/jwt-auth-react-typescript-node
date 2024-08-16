import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendPasswordResetEmail } from '../lib/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const {
    mutate: sendPasswordReset,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationFn: sendPasswordResetEmail,
  });

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-content">
        <h1 className="heading">Reset your password</h1>
        {isError && (
          <div className={`alert alert-error`}>
            <span className="alert-icon">⚠️</span>
            {error.message || "An error occurred"}
          </div>
        )}
        {isSuccess ? (
          <div className={`alert alert-success`}>
            <span className="alert-icon">✔️</span>
            Email sent! Check your inbox for further instructions.
          </div>
        ) : (
          <>
            <div className="form-control">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <button
              className="button"
              disabled={isPending || !email}
              onClick={() => sendPasswordReset(email)}
            >
              {isPending ? 'Sending...' : 'Reset Password'}
            </button>
          </>
        )}
        <p className="text-muted">
          Go back to{' '}
          <a className="link" href="/login">
            Sign in
          </a>{' '}
          or{' '}
          <a className="link" href="/register">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
