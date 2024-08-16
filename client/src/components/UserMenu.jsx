import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { logout } from "../lib/api";

const UserMenu = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: signOut } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });

  return (
    <div className="user-menu">
      <button className="avatar-button" aria-haspopup="true">
        user
      </button>
      <div className="menu-list">
        <button className="menu-item" onClick={() => navigate("/")}>Profile</button>
        <button className="menu-item" onClick={() => navigate("/settings")}>Settings</button>
        <button className="menu-item" onClick={signOut}>Logout</button>
      </div>
    </div>
  );
};

export default UserMenu;