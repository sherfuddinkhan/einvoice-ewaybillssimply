import React, { useState, useEffect } from "react";
import axios from "axios";

// LOCAL KEYS
const LOGIN_KEY = "iris_login_data";
const LATEST_EWB_KEY = "latestEwbData";
const PAYLOAD_KEY = "EWB_PREVIOUS_DATA";
const HEADER_KEY = "EWB_HEADER_DATA";

// Safe JSON load
const getJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
};

const FetchByDocNumType = () => {
  // -----------------------------------------
  // HEADER STATE
  // -----------------------------------------
  const [headers, setHeaders] = useState({
    companyId: "",
    authToken: "",
    product: "TOPAZ",
  });

  // -----------------------------------------
  // PAYLOAD STATE (FOR GET QUERY PARAMS)
  // -----------------------------------------
  const [payload, setPayload] = useState({
    userGstin: "",
    docType: "INV",
    docNumList: [""],
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // 🔥 AUTO-FILL LOGIN + PREVIOUS + LATEST EWB
  // ============================================================
  useEffect(() => {
    const login = getJson(LOGIN_KEY);
    const savedEwb = getJson(LATEST_EWB_KEY);
    const savedHeader = getJson(HEADER_KEY);
    const savedPayload = getJson(PAYLOAD_KEY);

    // ------------------ HEADERS ------------------
    const newHeaders = {
      companyId: savedHeader.companyId || login.companyId || "",
      authToken: savedHeader.authToken || login.token || "",
      product: savedHeader.product || "TOPAZ",
    };
    setHeaders(newHeaders);

    // ------------------ GSTIN ------------------
    let gstin =
      savedEwb?.fullApiResponse?.response?.fromGstin ||
      savedEwb?.fromGstin ||
      savedPayload?.userGstin ||
      login?.gstin ||
      "";

    // ------------------ DOC NUMBER ------------------
    let docNum =
      savedEwb?.fullApiResponse?.response?.transDocNo ||
      savedEwb?.transDocNo ||
      savedPayload?.docNumList?.[0] ||
      "";

    const newPayload = {
      userGstin: gstin,
      docType: savedPayload.docType || "INV",
      docNumList: [docNum],
    };

    setPayload(newPayload);
  }, []);

  // ============================================================
  // HEADER UPDATE
  // ============================================================
  const handleHeaderChange = (field, value) => {
    const updated = { ...headers, [field]: value };
    setHeaders(updated);
    localStorage.setItem(HEADER_KEY, JSON.stringify(updated));
  };

  // ============================================================
  // PAYLOAD FIELD UPDATE
  // ============================================================
  const handlePayloadField = (field, value) => {
    const updated = { ...payload, [field]: value };
    setPayload(updated);
    localStorage.setItem(PAYLOAD_KEY, JSON.stringify(updated));
  };

  // ============================================================
  // MULTIPLE DOC NUMBERS
  // ============================================================
  const handleDocNumChange = (index, value) => {
    const list = [...payload.docNumList];
    list[index] = value;

    const updated = { ...payload, docNumList: list };
    setPayload(updated);
    localStorage.setItem(PAYLOAD_KEY, JSON.stringify(updated));
  };

  const addDocNumRow = () => {
    const updated = {
      ...payload,
      docNumList: [...payload.docNumList, ""],
    };
    setPayload(updated);
    localStorage.setItem(PAYLOAD_KEY, JSON.stringify(updated));
  };

  // ============================================================
  // 🔥 SUBMIT API (GET REQUEST FOR EACH DOC NUM)
  // ============================================================
  const handleSubmit = async () => {
    setLoading(true);
    setResponse(null);
    setError("");

    try {
      const results = [];

      for (const docNum of payload.docNumList) {
        if (!docNum.trim()) continue;

        const res = await axios.get(
          "http://localhost:3001/proxy/topaz/ewb/getByDocNumAndType",
          {
            params: {
              userGstin: payload.userGstin,
              docType: payload.docType,
              docNum,
            },
            headers: {
              Accept: "application/json",
              companyId: headers.companyId,
              "X-Auth-Token": headers.authToken,
              product: headers.product,
            },
          }
        );

        results.push({
          docNum,
          data: res.data,
        });
      }

      setResponse(results);
    } catch (err) {
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================
  return (
    <div style={{ padding: 20, width: "700px" }}>
      <h2>EWB Bulk Fetch (By Doc Number - GET)</h2>

      {/* ======================= HEADERS ======================= */}
      <div style={{ background: "#f7f7f7", padding: 15, marginBottom: 20 }}>
        <h3>Headers</h3>

        <label>Company ID</label>
        <input
          value={headers.companyId}
          onChange={(e) => handleHeaderChange("companyId", e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <label>X-Auth-Token</label>
        <input
          value={headers.authToken}
          onChange={(e) => handleHeaderChange("authToken", e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <label>Product</label>
        <input
          value={headers.product}
          onChange={(e) => handleHeaderChange("product", e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      {/* ======================= PAYLOAD ======================= */}
      <div style={{ background: "#eef7ff", padding: 15 }}>
        <h3>Payload</h3>

        <label>User GSTIN:</label>
        <input
          value={payload.userGstin}
          onChange={(e) => handlePayloadField("userGstin", e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <label>Doc Type:</label>
        <select
          value={payload.docType}
          onChange={(e) => handlePayloadField("docType", e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        >
          <option value="INV">INV</option>
          <option value="BIL">BIL</option>
          <option value="BOE">BOE</option>
          <option value="CHL">CHL</option>
          <option value="OTH">OTH</option>
        </select>

        <label>Document Numbers:</label>
        {payload.docNumList.map((v, i) => (
          <input
            key={i}
            value={v}
            onChange={(e) => handleDocNumChange(i, e.target.value)}
            style={{ width: "100%", marginBottom: 6 }}
          />
        ))}

        <button onClick={addDocNumRow} style={{ marginTop: 10 }}>
          + Add More
        </button>
      </div>

      {/* ======================= SUBMIT ======================= */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ marginTop: 20, padding: 10, fontSize: 16 }}
      >
        {loading ? "Fetching..." : "Fetch EWB"}
      </button>

      {error && <p style={{ color: "red", marginTop: 20 }}>{error}</p>}

      {/* ======================= RESPONSE ======================= */}
      {response && (
        <pre
          style={{
            background: "#eee",
            marginTop: 20,
            padding: 10,
            borderRadius: 6,
            maxHeight: 350,
            overflow: "auto",
          }}
        >
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default FetchByDocNumType;