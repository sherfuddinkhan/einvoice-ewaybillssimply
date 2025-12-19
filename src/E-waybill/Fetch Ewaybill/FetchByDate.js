import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// ------------------------------
// LocalStorage Keys
// ------------------------------
const STORAGE_KEY00 = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";

const FetchByDate = () => {
  const navigate = useNavigate();

  // ------------------------------
  // State
  // ------------------------------
  const [date, setDate] = useState("");
  const [userGstin, setUserGstin] = useState("05AAAAU1183B5ZW");
  const [headers, setHeaders] = useState({});
  const [response, setResponse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ------------------------------
  // Load auth + latest EWB
  // ------------------------------
  useEffect(() => {
    try {
      const login = JSON.parse(localStorage.getItem(STORAGE_KEY00) || "{}");
      const latestEwb = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");

      const token = login?.fullResponse?.response?.token || "";
      const companyId = login?.fullResponse?.response?.companyid || "";

      setHeaders({
        accept: "application/json",
        product: "TOPAZ",
        companyId,
        "x-auth-token": token,
      });

      // Always fallback to empty string
      const lastDate =
        latestEwb?.response?.ewbDate?.split(" ")[0] || "";
      setDate(lastDate);

      const lastGstin = latestEwb?.fromGstin || "";
      setUserGstin(lastGstin);
    } catch (err) {
      console.error("LocalStorage parse error:", err);
    }
  }, []);

  // ------------------------------
  // Fix date format
  // ------------------------------
  const fixDateFormat = (d) => {
    if (!d) return "";
    const parts = d.split("/");
    if (parts.length !== 3) return d;
    if (parts[2].length === 2) parts[2] = `20${parts[2]}`;
    return parts.join("/");
  };

  // ------------------------------
  // Fetch EWB list
  // ------------------------------
  const fetchEwbs = async () => {
    setLoading(true);
    setError("");
    setResponse([]);

    const payload = {
      date: fixDateFormat(date),
      userGstin,
    };

    try {
      const res = await axios.get(
        "http://localhost:3001/proxy/topaz/ewb/fetchByDate",
        {
          params: payload,
          headers,
          timeout: 30000,
        }
      );

      setResponse(res?.data?.response || []);
    } catch (err) {
      setError(
        JSON.stringify(err?.response?.data || err.message, null, 2)
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // Navigation
  // ------------------------------
  const goToEwbAction = (ewbNo) => {
    navigate(`/ewaybill/ewb-action/${ewbNo}`);
  };

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Fetch Generated E-Way Bills by Date</h2>

      <div style={{ marginBottom: 10 }}>
        <label>Date (DD/MM/YYYY)</label><br />
        <input
          value={date || ""}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: 6, width: 200 }}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>User GSTIN</label><br />
        <input
          value={userGstin || ""}
          onChange={(e) => setUserGstin(e.target.value)}
          style={{ padding: 6, width: 200 }}
        />
      </div>

      <button
        onClick={fetchEwbs}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: "8px 20px",
          background: "#1976d2",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Fetching..." : "Fetch EWB"}
      </button>

      {error && (
        <pre style={{
          background: "#ffeeee",
          color: "darkred",
          padding: 15,
          borderRadius: 6,
          marginTop: 15,
        }}>
          {error}
        </pre>
      )}

      {response.length > 0 ? (
        <table
          border="1"
          cellPadding="8"
          style={{
            width: "100%",
            marginTop: 20,
            borderCollapse: "collapse",
          }}
        >
          <thead style={{ background: "#1976d2", color: "#fff" }}>
            <tr>
              <th>EWB No</th>
              <th>Document No</th>
              <th>Document Date</th>
              <th>EWB Date</th>
              <th>Valid Upto</th>
              <th>Status</th>
              <th>Place</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {response.map((row, idx) => (
              <tr key={idx}>
                <td>{row.ewbNo}</td>
                <td>{row.docNo}</td>
                <td>{row.docDate}</td>
                <td>{row.ewbDate}</td>
                <td>{row.validUpto}</td>
                <td>{row.status}</td>
                <td>{row.delPlace}</td>
                <td>
                  <button
                    onClick={() => goToEwbAction(row.ewbNo)}
                    style={{
                      padding: "5px 12px",
                      background: "#8e24aa",
                      color: "#fff",
                      border: "none",
                      borderRadius: 5,
                      cursor: "pointer",
                    }}
                  >
                    View / Action
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && (
          <p style={{ marginTop: 15, color: "#888", fontStyle: "italic" }}>
            No records found.
          </p>
        )
      )}
    </div>
  );
};

export default FetchByDate;
