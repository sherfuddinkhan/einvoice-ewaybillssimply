import React, { useState } from "react";
import axios from "axios";

const STORAGE_KEY00   = "iris_ewaybill_shared_config";

const EwaybillChangePassword = () => {
  const loginData = JSON.parse(localStorage.getItem(STORAGE_KEY00) || "{}");

  const [formData, setFormData] = useState({
    email: loginData.email || "eway@gmail.com",
    curentpassword: "Abcd@123456789",
    newpassword: "",
    confirmpassword: "",
    changePasswordFromLogin: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responseData, setResponseData] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ONLY CHECK – passwords should match
    if (formData.newpassword !== formData.confirmpassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setResponseData(null);

    try {
      const response = await axios.post(
        "http://localhost:3001/proxy/EWchange-password",
        formData,
        {
          headers: {
            Authorization: loginData.token,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      setResponseData(response.data);
      alert("Password changed successfully!");

    } catch (err) {
      const errorResponse = err.response?.data || { error: err.message };
      setResponseData(errorResponse);
      setError(errorResponse.error || "Error changing password");
    }

    setLoading(false);
  };

  const liveRequestInfo = {
    payload: formData,
    headers: {
      Authorization: loginData.token,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  return (
    <div style={{ maxWidth: "420px", margin: "auto", padding: "20px" }}>
      <h2>Change Password</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{ margin: "10px 0", width: "100%", padding: "10px" }}
        />

        <input
          type="password"
          name="curentpassword"
          placeholder="Current Password"
          value={formData.curentpassword}
          onChange={handleChange}
          required
          style={{ margin: "10px 0", width: "100%", padding: "10px" }}
        />

        <input
          type="password"
          name="newpassword"
          placeholder="New Password"
          value={formData.newpassword}
          onChange={handleChange}
          required
          style={{ margin: "10px 0", width: "100%", padding: "10px" }}
        />

        <input
          type="password"
          name="confirmpassword"
          placeholder="Confirm New Password"
          value={formData.confirmpassword}
          onChange={handleChange}
          required
          style={{ margin: "10px 0", width: "100%", padding: "10px" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>

      <div style={{ marginTop: "20px", border: "1px solid #ddd", padding: "10px" }}>
        <h3>Request Preview</h3>
        <strong>Payload:</strong>
        <pre>{JSON.stringify(liveRequestInfo.payload, null, 2)}</pre>

        <strong>Headers:</strong>
        <pre>{JSON.stringify(liveRequestInfo.headers, null, 2)}</pre>
      </div>

      {responseData && (
        <div style={{ marginTop: "20px", border: "1px solid #ddd", padding: "10px" }}>
          <h3>API Response</h3>
          <pre>{JSON.stringify(responseData, null, 2)}</pre>
        </div>
      )}

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
};

export default EwaybillChangePassword;
