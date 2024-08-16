import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import UserMenu from "./UserMenu";

const AppContainer = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="center">
        <div className="spinner" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="app-container">
        <UserMenu />
        <Outlet />
      </div>
    );
  }

  return (
    <Navigate
      to="/login"
      replace
      state={{
        redirectUrl: window.location.pathname,
      }}
    />
  );
};

export default AppContainer;
