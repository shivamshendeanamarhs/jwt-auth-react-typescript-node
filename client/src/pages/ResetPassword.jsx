import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ResetPasswordForm from '../components/ResetPasswordForm';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const exp = Number(searchParams.get("exp"));
  const now = Date.now();
  const linkIsValid = code && exp && exp > now;

  return (
    <div className="reset-password-container">
      <div className="reset-password-content">
        {linkIsValid ? (
          <ResetPasswordForm code={code} />
        ) : (
          <>
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              Invalid Link
            </div>
            <p className="text-muted">
              The link is either invalid or expired.
            </p>
            <a className="link" href="/password/forgot">
              Request a new password reset link
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
