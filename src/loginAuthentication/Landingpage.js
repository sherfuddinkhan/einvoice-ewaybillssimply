import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext"; // 1. Import your auth hook

const LandingPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // 2. Destructure the login function

  const [formData, setFormData] = useState({
    userName: "swastikmachineryhyd@gmail.com",
    password: "SMC@123",
    userType: "Admin",
    loginRef: "56860"
  });

  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setApiResponse(null);

    try {
      const res = await axios.post(
        "https://einvoice.fcssoftwares.com/api/Auth/login",
        formData,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      setApiResponse(res.data);

      // Save complete response to localStorage if needed elsewhere
      localStorage.setItem("authResponse", JSON.stringify(res.data));

      // Redirect on successful login
      if (
        res.data?.status === "SUCCESS" ||
        res.data?.success === true ||
        res.status === 200
      ) {
        // 3. Update global context so RequireAuth knows you are logged in!
        // Pass your expected context object format (token, etc.)
        login({
          token: res.data?.token || res.data?.data?.token, 
          companyId: res.data?.companyId || res.data?.data?.companyId,
          userGstin: res.data?.userGstin || res.data?.data?.userGstin
        });

        // 4. Navigate now that global state is updated
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const errorData = err.response?.data;
      setApiResponse(errorData || null);
      setError(
        errorData?.message ||
          err.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f2f5"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)"
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "25px" }}>
          E-Invoice Portal Login
        </h2>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "15px" }}>
            <label>User Name</label>
            <input
              type="email"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              placeholder="Enter User Name"
              required
              style={styles.input}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter Password"
              required
              style={styles.input}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>User Type</label>
            <select
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>Login Reference</label>
            <input
              type="text"
              name="loginRef"
              value={formData.loginRef}
              onChange={handleChange}
              placeholder="Enter Login Ref"
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: "15px", color: "red", textAlign: "center" }}>
            {error}
          </div>
        )}

        {apiResponse && (
          <div
            style={{
              marginTop: "20px",
              background: "#fafafa",
              padding: "10px",
              borderRadius: "6px"
            }}
          >
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  input: {
    width: "100%",
    padding: "10px",
    marginTop: "5px",
    border: "1px solid #d9d9d9",
    borderRadius: "4px",
    boxSizing: "border-box"
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#1677ff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px"
  }
};

export default LandingPage;