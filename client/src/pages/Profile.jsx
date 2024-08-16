import React from 'react';
import useAuth from '../hooks/useAuth';

const Profile = () => {
  const { user } = useAuth();
  const { email, verified, createdAt } = user;

  return (
    <div className="profile-container">
      <h1 className="heading">My Account</h1>
      {!verified && (
        <div className="alert">
          <span className="alert-icon">⚠️</span>
          Please verify your email
        </div>
      )}
      <p className="text">
        Email:{" "}
        <span className="text-muted">{email}</span>
      </p>
      <p className="text">
        Created on{" "}
        <span className="text-date">
          {new Date(createdAt).toLocaleDateString("en-US")}
        </span>
      </p>
    </div>
  );
};

export default Profile;
