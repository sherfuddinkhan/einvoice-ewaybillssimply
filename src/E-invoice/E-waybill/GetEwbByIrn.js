// GetEwbByIrn.js - Auto IRN + Auto GSTIN + Clean UI
import React, { useState, useEffect } from 'react';
import { useAuth } from "../../components/AuthContext";
/* ---------- LocalStorage Keys ---------- */
const STORAGE_KEY = 'iris_einvoice_shared_config';
const LAST_IRN_KEY = 'iris_last_used_irn';
const LAST_EWB_KEY = 'iris_last_ewb_details';
const STORAGE_KEY2 = "iris_einvoice_irn_ewabill";
console.log("STORAGE_KEY",STORAGE_KEY)
console.log("LAST_IRN_KEY",LAST_IRN_KEY)
console.log("LAST_EWB_KEY",LAST_EWB_KEY)
console.log("STORAGE_KEY2",STORAGE_KEY2)
  const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY2) || '{}');
const GetEwbByIrn = () => {
    const { token, companyId, userGstin } = useAuth();
/* ---------- Component State ---------- */
const [config, setConfig] = useState({
  proxyBase: "https://einvoice.fcssoftwares.com",
  endpoint: "/api/gst/einvoice/ewb-by-irn",
  headers: {
    Accept: "application/json",
    companyId: "",
    "X-Auth-Token": "",
    product: "ONYX",
  },
  params: {
    irn: "",
    userGstin: "",
    updateFlag: true,
  },
});

const [response, setResponse] = useState(null);
const [loading, setLoading] = useState(false);

/* ------------------------------------------------------------
   AUTO-POPULATE: IRN + Auth Details
------------------------------------------------------------ */
useEffect(() => {
  let irnValue = "";
  let userGstin="";

  const lastIrn = localStorage.getItem(LAST_IRN_KEY);
  const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY2) || '{}');

  if (lastIrn) {
    try {
      irnValue = JSON.parse(lastIrn)?.irn || "";
    } catch {}
  }

  setConfig((prev) => ({
    ...prev,
    headers: {
      ...prev.headers,
      companyId: companyId || "",
      "X-Auth-Token": token || "",
    },
    params: {
      ...prev.params,
      irn: irnValue,
      userGstin:  savedConfig ?.userGstin || "",
    },
  }));
}, [token, companyId, userGstin]);

/* ------------------------------------------------------------
   FETCH E-WAY BILL BY IRN
------------------------------------------------------------ */
const fetchEWB = async () => {
  if (!config.params.irn.trim()) {
    alert("Please enter IRN");
    return;
  }

  setLoading(true);
  setResponse(null);

  const queryString = new URLSearchParams({
    irn: config.params.irn,
    userGstin: config.params.userGstin,
    updateFlag: config.params.updateFlag.toString(),
  }).toString();

  const fullUrl = `${config.proxyBase}${config.endpoint}?${queryString}`;

  try {
    const res = await fetch(fullUrl, {
      method: "GET",
      headers: {
        ...config.headers,
        companyId,
        "X-Auth-Token": token,
      },
    });

    const data = await res.json();

    const result = {
      url: fullUrl,
      status: res.status,
      body: data,
      time: new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
    };

    setResponse(result);

    /* Save to localStorage */
    if (res.ok && data.status === "SUCCESS") {
      localStorage.setItem(
        LAST_EWB_KEY,
        JSON.stringify({
          irn: config.params.irn,
          EwbNo: data.response?.EwbNo,
          EwbDt: data.response?.EwbDt,
          EwbValidTill: data.response?.EwbValidTill,
        })
      );

      alert("E-Way Bill fetched and saved!");
    }
  } catch (err) {
    setResponse({
      error: err.message,
    });
  } finally {
    setLoading(false);
  }
};

/* ---------- Auth Status ---------- */
const isReady = !!(companyId && token && config.params.irn);

  /* ------------------------------------------------------------
      UI Rendering
     ------------------------------------------------------------ */
  return (
    <div
      style={{
        padding: '30px',
        background: '#e3f2fd',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        minHeight: '100vh',
      }}
    >
      <h1
        style={{
          color: '#1976d2',
          marginBottom: '10px',
          fontSize: '36px',
        }}
      >
        Get E-Way Bill by IRN
      </h1>
      <p style={{ color: '#555', marginBottom: '25px' }}>
        IRN & GSTIN auto-filled from previous actions
      </p>

      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        {/* HEADERS */}
        <h2 style={{ color: '#0d47a1' }}>Request Headers</h2>
        <pre
          style={{
            background: '#e3f2fd',
            padding: '15px',
            borderRadius: '10px',
            border: '2px solid #64b5f6',
            fontFamily: 'monospace',
            fontSize: '14px',
          }}
        >
          {JSON.stringify(config.headers, null, 2)}
        </pre>

        {/* FULL REQUEST URL */}
        <h2 style={{ color: '#0d47a1', marginTop: '30px' }}>Request URL</h2>
        <div
          style={{
            background: '#263238',
            color: '#40c4ff',
            padding: '15px',
            borderRadius: '10px',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}
        >
          {config.proxyBase}
          {config.endpoint}?irn={config.params.irn}&userGstin=
          {config.params.userGstin}&updateFlag=true
        </div>

        {/* INPUT: IRN */}
        <div style={{ marginTop: '30px' }}>
          <strong>IRN:</strong>
          <input
            value={config.params.irn}
            onChange={e =>
              setConfig(prev => ({
                ...prev,
                params: { ...prev.params, irn: e.target.value },
              }))
            }
            style={{
              width: '100%',
              padding: '15px',
              marginTop: '8px',
              borderRadius: '10px',
              border: '2px solid #1976d2',
              background: '#e3f2fd',
              fontSize: '18px',
              fontFamily: 'monospace',
            }}
          />
        </div>

        {/* INPUT: GSTIN */}
        <div style={{ marginTop: '25px' }}>
          <strong>User GSTIN:</strong>
          <input
            value={config.params.userGstin}
            readOnly
            style={{
              width: '100%',
              padding: '15px',
              marginTop: '8px',
              borderRadius: '10px',
              background: '#eceff1',
              border: '2px solid #90caf9',
              fontSize: '18px',
              fontFamily: 'monospace',
            }}
          />
        </div>

        {/* UPDATE FLAG */}
        <div style={{ marginTop: '25px' }}>
          <strong>Update Flag:</strong>
          <div style={{ padding: '10px', fontWeight: 'bold' }}>true</div>
        </div>

        <button
          onClick={fetchEWB}
          disabled={!isReady || loading}
          style={{
            width: '100%',
            padding: '22px',
            marginTop: '35px',
            background: !isReady ? '#999' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            fontSize: '26px',
            fontWeight: 'bold',
            cursor: !isReady ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Fetching...' : 'FETCH EWB BY IRN'}
        </button>
      </div>

      {/* RESPONSE */}
      {response && (
        <div style={{ marginTop: '50px' }}>
          <h2 style={{ color: '#0d47a1' }}>
            RESPONSE ({response.time} IST)
          </h2>

          <pre
            style={{
              background: '#1e1e1e',
              color: '#76ff03',
              padding: '25px',
              borderRadius: '14px',
              fontSize: '16px',
              border: '2px solid #76ff03',
            }}
          >
            {JSON.stringify(response.body || response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GetEwbByIrn;
