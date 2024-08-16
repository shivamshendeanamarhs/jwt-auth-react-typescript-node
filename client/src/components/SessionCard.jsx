import React from "react";
import useDeleteSession from "../hooks/useDeleteSession";

const SessionCard = ({ session }) => {
  const { _id, createdAt, userAgent, isCurrent } = session;
  const { deleteSession, isPending } = useDeleteSession(_id);

  return (
    <div className="session-card">
      <div className="session-info">
        <div className="session-date">
          {new Date(createdAt).toLocaleString("en-US")}
          {isCurrent && " (current session)"}
        </div>
        <div className="session-agent">{userAgent}</div>
      </div>
      {!isCurrent && (
        <button
          className="delete-session-button"
          title="Delete Session"
          onClick={deleteSession}
          disabled={isPending}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default SessionCard;
