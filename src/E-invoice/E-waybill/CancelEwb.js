import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthContext";
import { useLocation } from "react-router-dom";
/* ----------------------------
   LocalStorage Key
---------------------------- */
const STORAGE_KEY2 = "iris_einvoice_irn_ewabill";
const LAST_EWB_DETAILS_KEY = "iris_last_ewb_details";
const STORAGE_KEY = "iris_einvoice_response";  
const STORAGE_KEY1 = "iris_einvoice_shared_config";

const savedConfig1 = JSON.parse(localStorage.getItem(STORAGE_KEY1) || '{}');
const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY2) || '{}');
/* ----------------------------
   Cancel Reasons
---------------------------- */
const CANCEL_REASONS = {
  "1": "Duplicate",
  "2": "Data Entry Mistake",
  "3": "Order Cancelled",
  "4": "Others",
};

const CancelEwb = (invoiceData = {}) => {
  const { token, companyId, userGstin} = useAuth();


  /* ----------------------------
     Headers
  ---------------------------- */

  const [headers, setHeaders] = useState({
    accept: "application/json",
    "content-type": "application/json",
    companyid: "",
    "x-auth-token": "",
    product: "ONYX",
  });

  /* ----------------------------
     Body
  ---------------------------- */

  const [body, setBody] = useState({
    ewbNo: "",
    cnlRsn: "3",
    cnlRem: "Order cancelled by buyer",
    userGstin: "",
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  /* ----------------------------
     Auto Populate
  ---------------------------- */

  useEffect(() => {
    const irnEwbData = JSON.parse(
      localStorage.getItem(STORAGE_KEY2) || "{}"
    );

   const initialGstin = savedConfig1?.companyUniqueCode
    || savedConfig?.companyUniqueCode
    || savedConfig?.userGstin
    || "";
console.log("initialGstin",initialGstin)
   
    // Populate headers from AuthContext
    setHeaders((prev) => ({
      ...prev,
      companyid: companyId || "",
      "x-auth-token": token || "",
    }));

    // Populate body
    setBody((prev) => ({
      ...prev,
      ewbNo: irnEwbData?.response?.EwbNo || "",
      userGstin: initialGstin|| "",
    }));
  }, [token, companyId, userGstin]);

  /* ----------------------------
     Helpers
  ---------------------------- */

  const updateHeader = (key, value) => {
    setHeaders((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateBody = (key, value) => {
    setBody((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const isReady =
    !!headers.companyid &&
    !!headers["x-auth-token"] &&
    !!body.ewbNo &&
    !!body.userGstin &&
    !!body.cnlRsn;

  /* ----------------------------
     Cancel API
  ---------------------------- */

  const cancelEwb = async () => {
    if (!isReady) {
      alert("Missing required fields");
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(
        "https://einvoice.fcssoftwares.com/api/gst/einvoice/cancel-ewb",
        {
          method: "PUT",
          headers,
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      setResponse({
        status: res.status,
        body: data,
        time: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      });

      if (res.ok && data.status === "SUCCESS") {
        alert("E-Way Bill Cancelled Successfully");
      }
    } catch (err) {
      setResponse({
        status: "NETWORK_ERROR",
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        background: "#ffebee",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#c62828" }}>Cancel E-Way Bill</h1>

      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "16px",
          maxWidth: "900px",
          margin: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* Headers */}

        <h2>Request Headers</h2>

        <div style={{ marginBottom: "15px" }}>
          <strong>companyid</strong>
          <input
            value={headers.companyid}
            onChange={(e) => updateHeader("companyid", e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <strong>x-auth-token</strong>
          <input
            value={headers["x-auth-token"]}
            onChange={(e) =>
              updateHeader("x-auth-token", e.target.value)
            }
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        {/* Payload */}

        <h2>Request Payload</h2>

        <pre
          style={{
            background: "#263238",
            color: "#ff5252",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          {JSON.stringify(body, null, 2)}
        </pre>

        {/* Form */}

        <input
          placeholder="EWB Number"
          value={body.ewbNo}
          onChange={(e) => updateBody("ewbNo", e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
          }}
        />

        <select
          value={body.cnlRsn}
          onChange={(e) => updateBody("cnlRsn", e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
          }}
        >
          {Object.entries(CANCEL_REASONS).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>

        <input
          placeholder="Cancellation Remark"
          value={body.cnlRem}
          onChange={(e) => updateBody("cnlRem", e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
          }}
        />

        <input
          placeholder="User GSTIN"
          value={body.userGstin}
          onChange={(e) => updateBody("userGstin", e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
          }}
        />

        <button
          onClick={cancelEwb}
          disabled={!isReady || loading}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "16px",
            background: loading ? "#999" : "#d32f2f",
            color: "#fff",
            fontSize: "18px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {loading ? "Cancelling..." : "Cancel E-Way Bill"}
        </button>
      </div>

      {response && (
        <div style={{ marginTop: "30px" }}>
          <h2>Response ({response.time})</h2>

          <pre
            style={{
              background: "#1e1e1e",
              color: "#ff5252",
              padding: "20px",
              borderRadius: "10px",
            }}
          >
            {JSON.stringify(response.body || response.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CancelEwb;