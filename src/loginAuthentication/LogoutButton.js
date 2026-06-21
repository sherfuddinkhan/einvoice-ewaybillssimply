import React from "react";
import { Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";

const LogoutButton = () => {
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/");
  };

  return (
    <div style={styles.container}>
      <Button
        type="primary"
        icon={<LogoutOutlined />}
        size="large"
        onClick={handleLogout}
        style={styles.button}
      >
        Logout
      </Button>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  button: {
    height: "55px",
    width: "180px",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
};

export default LogoutButton;