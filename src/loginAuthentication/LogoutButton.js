import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext"; 

const LogoutButton = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  const handleLogout = () => {
    // Reset auth context


    // Remove all stored data
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to landing page
  window.location.replace("/");
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
};

export default LogoutButton;