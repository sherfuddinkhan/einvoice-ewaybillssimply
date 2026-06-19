import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../components/AuthContext";

const STORAGE_KEY = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";

const readStorage = (key, fallback = {}) => {
  try {
    return JSON.parse(
      localStorage.getItem(key) || JSON.stringify(fallback)
    );
  } catch {
    return fallback;
  }
};

const FetchByDocNumType = () => {
  const { token, companyId } = useAuth();

  const [headers, setHeaders] = useState({
    companyId: "",
    token: "",
    product: "TOPAZ",
  });

  const [payload, setPayload] = useState({
    userGstin: "",
    docType: "INV",
    docNumList: [""],
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const login = readStorage(STORAGE_KEY);
    const lastEwb = readStorage(LATEST_EWB_KEY);

    const storedCompanyId =
      login?.fullResponse?.response?.companyid || "";

    const storedToken =
      login?.fullResponse?.response?.token || "";

    const userGstin =
      lastEwb?.userGstin ||
      lastEwb?.fromGstin ||
      "";

    const docNum =
      lastEwb?.fullApiResponse?.response?.transDocNo ||
      lastEwb?.response?.transDocNo ||
      lastEwb?.transDocNo ||
      "";

    setHeaders({
      companyId: companyId || storedCompanyId,
      token: token || storedToken,
      product: "TOPAZ",
    });

    setPayload({
      userGstin,
      docType: "INV",
      docNumList: [docNum],
    });
  }, [token, companyId]);

  const updateHeader = (key, value) => {
    setHeaders((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updatePayload = (key, value) => {
    setPayload((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateDocNum = (index, value) => {
    const updated = [...payload.docNumList];
    updated[index] = value;

    setPayload((prev) => ({
      ...prev,
      docNumList: updated,
    }));
  };

  const addDocRow = () => {
    setPayload((prev) => ({
      ...prev,
      docNumList: [...prev.docNumList, ""],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const results = [];

      for (const docNum of payload.docNumList) {
        if (!docNum?.trim()) continue;

        console.log("Request:", {
          companyId: headers.companyId,
          token: headers.token,
          userGstin: payload.userGstin,
          docType: payload.docType,
          docNum,
        });

        const res = await axios.get(
          "http://localhost:3001/proxy/topaz/ewb/getByDocNumAndType",
          {
            params: {
              userGstin: payload.userGstin,
              docType: payload.docType,
              docNum,
            },
            headers: {
              accept: "application/json",
              product: "TOPAZ",
              companyId: headers.companyId,
              "X-Auth-Token": headers.token,
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
      console.error(err);

      const msg =
        err.response?.data || err.message;

      setError(
        typeof msg === "string"
          ? msg
          : JSON.stringify(msg, null, 2)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 720 }}>
      <h2>EWB Bulk Fetch (By Doc Number)</h2>

      <div style={{ background: "#f7f7f7", padding: 15, marginBottom: 20 }}>
        <h3>Headers</h3>

        <label>Company ID</label>
        <input
          value={headers.companyId}
          onChange={(e) =>
            updateHeader("companyId", e.target.value)
          }
          style={{ width: "100%", marginBottom: 10 }}
        />

        <label>X-Auth-Token</label>
        <input
          value={headers.token}
          onChange={(e) =>
            updateHeader("token", e.target.value)
          }
          style={{ width: "100%", marginBottom: 10 }}
        />

        <label>Product</label>
        <input
          value={headers.product}
          onChange={(e) =>
            updateHeader("product", e.target.value)
          }
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ background: "#eef7ff", padding: 15 }}>
        <h3>Payload</h3>

        <label>User GSTIN</label>
        <input
          value={payload.userGstin}
          onChange={(e) =>
            updatePayload("userGstin", e.target.value)
          }
          style={{ width: "100%", marginBottom: 10 }}
        />

        <label>Document Type</label>
        <select
          value={payload.docType}
          onChange={(e) =>
            updatePayload("docType", e.target.value)
          }
          style={{ width: "100%", marginBottom: 10 }}
        >
          <option value="INV">INV</option>
          <option value="BIL">BIL</option>
          <option value="BOE">BOE</option>
          <option value="CHL">CHL</option>
          <option value="OTH">OTH</option>
        </select>

        <label>Document Numbers</label>

        {payload.docNumList.map((value, index) => (
          <input
            key={index}
            value={value}
            onChange={(e) =>
              updateDocNum(index, e.target.value)
            }
            style={{ width: "100%", marginBottom: 6 }}
          />
        ))}

        <button onClick={addDocRow}>
          + Add More
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          marginTop: 20,
          padding: 10,
          fontSize: 16,
        }}
      >
        {loading ? "Fetching..." : "Fetch EWB"}
      </button>

      {error && (
        <pre style={{ color: "red", marginTop: 20 }}>
          {error}
        </pre>
      )}

      {response && (
        <pre
          style={{
            background: "#eee",
            marginTop: 20,
            padding: 10,
            borderRadius: 6,
            maxHeight: 400,
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