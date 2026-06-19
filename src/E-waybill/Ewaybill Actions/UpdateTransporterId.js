import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../components/AuthContext";

const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

const UpdateTransporterId = () => {
  const { token, companyId } = useAuth();

  const [form, setForm] = useState({
    ewbNo: "",
    transporterId: "",
    transporterName: "",
    userGstin: "",
  });

  const [payloadText, setPayloadText] = useState("{}");
  const [payload, setPayload] = useState({});
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const headers = {
    "X-Auth-Token": token,
    companyId,
    product: "TOPAZ",
    "Content-Type": "application/json",
    accept: "application/json",
  };

useEffect(() => {
  if (!companyId) return;

  const last = JSON.parse(
    localStorage.getItem(LATEST_EWB_KEY) || "{}"
  );

  const hist = JSON.parse(
    localStorage.getItem(EWB_HISTORY_KEY) || "{}"
  );

  const initialForm = {
    ewbNo: last?.ewbNo || hist?.ewbNo || "",
    transporterId:
      last?.response?.transporterId ||
      hist?.response?.transporterId ||
      "",
    transporterName:
      last?.response?.transporterName ||
      hist?.response?.transporterName ||
      "",
    userGstin:
      last?.response?.fromGstin ||
      hist?.response?.fromGstin ||
      "",
  };

  setForm(initialForm);
  updatePayload(initialForm);
}, [companyId]);

  const updatePayload = (formState) => {
    const payloadObj = {
      ewbNo: formState.ewbNo,
      transporterId: formState.transporterId,
      transporterName: formState.transporterName,
      userGstin: formState.userGstin,
      companyId,
    };

    setPayload(payloadObj);
    setPayloadText(
      JSON.stringify(payloadObj, null, 2)
    );
  };

  const handleChange = (e) => {
    const updatedForm = {
      ...form,
      [e.target.name]: e.target.value,
    };

    setForm(updatedForm);
    updatePayload(updatedForm);

    setResponse(null);
    setError("");
  };

  const handlePayloadTextChange = (e) => {
    const text = e.target.value;

    setPayloadText(text);

    try {
      const parsedPayload = JSON.parse(text);

      setPayload(parsedPayload);
      setError("");
    } catch {
      setError("Invalid JSON in payload editor");
    }

    setResponse(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token || !companyId) {
      setError("Token or Company ID not available");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      console.log("Headers:", headers);
      console.log("Payload:", payload);

      const { data } = await axios.post(
        "https://einvoice.fcssoftwares.com/api/gst/ewaybill/action",
        payload,
        { headers }
      );

      setResponse(data);

      if (data?.status === "SUCCESS") {
        alert(
          `Transporter updated for EWB ${form.ewbNo}`
        );
      }
    } catch (err) {
      const errorData =
        err.response?.data ||
        { message: err.message };

      setError(
        errorData?.message || "Request failed"
      );

      setResponse(errorData);

      console.error("API Error:", errorData);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "auto",
        padding: "20px",
      }}
    >
      <h2>Update Transporter ID</h2>

      <form onSubmit={handleSubmit}>
        <input
          style={inputStyle}
          name="ewbNo"
          placeholder="EWB Number"
          value={form.ewbNo}
          onChange={handleChange}
          required
        />

        <input
          style={inputStyle}
          name="transporterId"
          placeholder="Transporter ID"
          value={form.transporterId}
          onChange={handleChange}
          required
        />

        <input
          style={inputStyle}
          name="transporterName"
          placeholder="Transporter Name"
          value={form.transporterName}
          onChange={handleChange}
          required
        />

        <input
          style={inputStyle}
          name="userGstin"
          placeholder="User GSTIN"
          value={form.userGstin}
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          style={{ padding: "10px" }}
          disabled={loading}
        >
          {loading
            ? "Updating..."
            : "Update Transporter"}
        </button>
      </form>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

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

      <h3>Editable Payload</h3>

      <textarea
        value={payloadText}
        onChange={handlePayloadTextChange}
        style={{
          width: "100%",
          height: "250px",
          padding: "10px",
          fontFamily: "monospace",
          background: "#f7f7f7",
        }}
      />
    </div>
  );
};

export default UpdateTransporterId;