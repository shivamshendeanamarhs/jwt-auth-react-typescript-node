import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { verifyEmail } from '../lib/api';

const VerifyEmail = () => {
  const { code } = useParams();
  const { isPending, isSuccess, isError } = useQuery({
    queryKey: ['emailVerification', code],
    queryFn: () => verifyEmail(code),
  });

  return (
    <div className="verify-email-container">
      <div className="verify-email-content">
        {isPending ? (
          <div className="spinner">Loading...</div>
        ) : (
          <div>
            <div
              className={`alert ${isSuccess ? 'alert-success' : 'alert-error'}`}
            >
              <span className="alert-icon">🔔</span>
              {isSuccess ? 'Email Verified!' : 'Invalid Link'}
            </div>
            {isError && (
              <p className="text-muted">
                The link is either invalid or expired.{' '}
                <a className="link" href="/password/forgot">
                  Get a new link
                </a>
              </p>
            )}
            <a className="link" href="/" replace>
              Back to home
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
