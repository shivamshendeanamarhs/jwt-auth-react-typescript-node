import React from 'react';
import useSessions from '../hooks/useSessions';
import SessionCard from '../components/SessionCard';

const Settings = () => {
  const { sessions, isPending, isSuccess, isError } = useSessions();

  return (
    <div className="settings-container">
      <h1 className="heading">My Sessions</h1>
      {isPending && <div className="spinner">Loading...</div>}
      {isError && <p className="error-text">Failed to get sessions.</p>}
      {isSuccess && (
        <div className="session-list">
          {sessions.map((session) => (
            <SessionCard key={session._id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Settings;
