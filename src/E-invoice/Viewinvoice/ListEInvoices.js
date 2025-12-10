import React, { useState, useEffect } from "react";

const STORAGE_KEY = "iris_einvoice_shared_config";

// Convert YYYY-MM-DD → DD/MM/YYYY
const formatDate = (value) => {
  if (!value) return "";
  const [yyyy, mm, dd] = value.split("-");
  return `${dd}/${mm}/${yyyy}`;
};

const ListEInvoices = () => {
  const [headers, setHeaders] = useState({
    Accept: "application/json",
    companyId: "",
    "X-Auth-Token": "",
    product: "ONYX",
    "Content-Type": "application/json",
  });

  const [payload, setPayload] = useState({
    companyUniqueCode: "",
    docNo: [""],
    fromDt: "",
    toDt: "",
    btrdNm: "",
    catg: ["B2B"],
    docType: ["RI"],
    invStatus: ["UPLOADED", "IRN_GENERATED"],
    irnStatus: ["ACT", "CNL"],
    totinvval: { gt: "0" },
    itemCount: { gt: "0" },
    hasError: false,
    hasWarning: true,
    page: 0,
    size: 50,
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  // Load saved values
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);

      setHeaders((prev) => ({
        ...prev,
        companyId: data.companyId || prev.companyId,
        "X-Auth-Token": data.token || prev["X-Auth-Token"],
      }));

      setPayload((prev) => ({
        ...prev,
        companyUniqueCode: data.companyUniqueCode || prev.companyUniqueCode,
        fromDt: data.fromDt || prev.fromDt,
        toDt: data.toDt || prev.toDt,
        btrdNm: data.btrdNm || prev.btrdNm,
      }));
    } catch (error) {
      console.warn("Invalid saved config:", error);
    }
  }, []);

  // Save state to localStorage
  const saveConfig = () => {
    const toSave = {
      companyId: headers.companyId,
      token: headers["X-Auth-Token"],
      companyUniqueCode: payload.companyUniqueCode,
      fromDt: payload.fromDt,
      toDt: payload.toDt,
      btrdNm: payload.btrdNm,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  };

  const fetchInvoices = async () => {
    if (!headers.companyId || !headers["X-Auth-Token"] || !payload.companyUniqueCode) {
      alert("companyId, X-Auth-Token and Company Unique Code are required!");
      return;
    }

    // FIX: Convert date format if coming from input type="date"
    const fixedPayload = {
      ...payload,
      fromDt: payload.fromDt.includes("-") ? formatDate(payload.fromDt) : payload.fromDt,
      toDt: payload.toDt.includes("-") ? formatDate(payload.toDt) : payload.toDt,
    };

    console.log("Final Payload Sent:", fixedPayload);

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("http://localhost:3001/proxy/onyx/einvoice/view", {
        method: "POST",
        headers,
        body: JSON.stringify(fixedPayload),
      });

      const json = await res.json();

      setResponse({
        body: json,
        time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      });

      if (res.ok && json.status === "SUCCESS") saveConfig();
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Segoe UI, Arial",
        background: "#f3e5f5",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#8e24aa" }}>List E-Invoices</h1>

      {/* Headers */}
      <h3 style={{ marginTop: "25px" }}>Request Headers</h3>
      {Object.keys(headers).map((key) => (
        <div key={key} style={{ marginBottom: "10px" }}>
          <label>
            <strong>{key}: </strong>
          </label>
          <input
            type="text"
            value={headers[key]}
            onChange={(e) =>
              setHeaders((prev) => ({ ...prev, [key]: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />
        </div>
      ))}

      {/* Payload */}
      <h3 style={{ marginTop: "25px" }}>Request Payload</h3>
      <textarea
        value={JSON.stringify(payload, null, 2)}
        onChange={(e) => {
          try {
            setPayload(JSON.parse(e.target.value));
          } catch {
            console.log("Invalid JSON typing...");
          }
        }}
        rows={18}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          fontFamily: "monospace",
          border: "1px solid #ccc",
        }}
      />

      <button
        onClick={fetchInvoices}
        disabled={loading}
        style={{
          marginTop: "20px",
          padding: "12px 35px",
          background: "#8e24aa",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        {loading ? "Fetching..." : "Fetch E-Invoices"}
      </button>

      {/* Response */}
      {response && (
        <div style={{ marginTop: "30px" }}>
          <h3>Response ({response.time} IST)</h3>
          <pre
            style={{
              background: "black",
              color: "#0f0",
              padding: "20px",
              borderRadius: "8px",
              maxHeight: "500px",
              overflow: "auto",
            }}
          >
            {JSON.stringify(response.body || response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ListEInvoices;
