import React, { useState, useEffect } from "react";
import axios from "axios";

// LocalStorage Keys
const LOGIN_RESPONSE_KEY = "iris_login_data";
const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

const UpdateTransporterId = () => {
  // ---------------- AUTH DATA ----------------
  const [headers, setHeaders] = useState({
    "X-Auth-Token": "",
    companyId: "",
    product: "TOPAZ",
    "Content-Type": "application/json",
    accept: "application/json",
  });

  // ---------------- FORM DATA ----------------
  const [form, setForm] = useState({
    ewbNo: "",
    transporterId: "",
    transporterName: "",
    userGstin: "",
  });

  // ---------------- PAYLOAD EDITOR ----------------
  const [payloadText, setPayloadText] = useState("{}");
  const [payload, setPayload] = useState({});

  // ---------------- UI STATES ----------------
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------- LOAD FROM LOCALSTORAGE ----------------
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(LOGIN_RESPONSE_KEY) || "{}");
    const last = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");
    const hist = JSON.parse(localStorage.getItem(EWB_HISTORY_KEY) || "{}");

    // Auto pick data from last or history
    const gstin = last.fromGstin || hist.fromGstin || "";
    const ewbNo = last.ewbNo || hist.ewbNo || "";
    const tId =
      last.response?.transporterId || hist.response?.transporterId || "";
    const tName =
      last.response?.transporterName || hist.response?.transporterName || "";

    setHeaders((prev) => ({
      ...prev,
      "X-Auth-Token": login.token || "",
      companyId: login.companyId || "",
    }));

    const initialForm = {
      ewbNo,
      transporterId: tId,
      transporterName: tName,
      userGstin: gstin,
    };

    setForm(initialForm);
    updatePayload(initialForm);
  }, []);

  // ---------------- UPDATE PAYLOAD WHEN FORM CHANGES ----------------
  const updatePayload = (formState) => {
    const pl = {
      ewbNo: formState.ewbNo,
      transporterId: formState.transporterId,
      userGstin: formState.userGstin,
      transporterName: formState.transporterName,
      companyId: headers.companyId || null,
    };
    setPayload(pl);
    setPayloadText(JSON.stringify(pl, null, 2));
  };

  // ---------------- FORM INPUT HANDLER ----------------
  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    updatePayload(updated);
    setResponse(null);
    setError("");
  };

  // ---------------- PAYLOAD TEXTAREA HANDLER ----------------
  const handlePayloadTextChange = (e) => {
    const text = e.target.value;
    setPayloadText(text);

    try {
      const obj = JSON.parse(text);
      setPayload(obj);
      setError("");
    } catch (err) {
      setError("Invalid JSON in payload editor");
    }
    setResponse(null);
  };

  // ---------------- SUBMIT HANDLER ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await axios.post(
        "https://stage-api.irisgst.com/irisgst/topaz/api/v0.3/transporter",
        payload,
        { headers }
      );

      setResponse(res.data);

      if (res.data.status === "SUCCESS") {
        alert(`Transporter updated for EWB ${form.ewbNo}`);
      }
    } catch (err) {
      const errData = err.response?.data || { message: err.message };
      setError(errData.message);
      setResponse(errData);
    }

    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
  };

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      <h2>Update Transporter ID</h2>

      {/* FORM */}
      <form onSubmit={handleSubmit}>
        <input
          style={inputStyle}
          name="ewbNo"
          required
          placeholder="EWB Number"
          value={form.ewbNo}
          onChange={handleChange}
        />

        <input
          style={inputStyle}
          name="transporterId"
          required
          placeholder="Transporter ID"
          value={form.transporterId}
          onChange={handleChange}
        />

        <input
          style={inputStyle}
          name="transporterName"
          required
          placeholder="Transporter Name"
          value={form.transporterName}
          onChange={handleChange}
        />

        <input
          style={inputStyle}
          name="userGstin"
          required
          placeholder="User GSTIN"
          value={form.userGstin}
          onChange={handleChange}
        />

        <button style={{ padding: "10px" }} disabled={loading}>
          {loading ? "Updating..." : "Update Transporter"}
        </button>
      </form>

      {/* ERROR */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* RESPONSE */}
      {response && (
        <pre
          style={{
            background: "#e9f5ff",
            padding: "12px",
            marginTop: "20px",
            borderRadius: "5px",
          }}
        >
          {JSON.stringify(response, null, 2)}
        </pre>
      )}

      {/* PAYLOAD EDITOR */}
      <h3>Editable Payload</h3>
      <textarea
        style={{
          width: "100%",
          height: "250px",
          padding: "10px",
          fontFamily: "monospace",
          background: "#f7f7f7",
        }}
        value={payloadText}
        onChange={handlePayloadTextChange}
      />
    </div>
  );
};

export default UpdateTransporterId;
