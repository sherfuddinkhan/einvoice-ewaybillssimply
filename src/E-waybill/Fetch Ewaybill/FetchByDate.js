import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// LocalStorage Keys
const STORAGE_KEY00 = "iris_ewaybill_shared_config"; // login/auth info
const LATEST_EWB_KEY = "latestEwbData";             // last EWB info

const FetchByDate = () => {
  const navigate = useNavigate();

  // ------------------------------
  // 1️⃣ State Definitions
  // ------------------------------
  const [date, setDate] = useState("");
  const [userGstin, setUserGstin] = useState("05AAAAU1183B5ZW");
  const [headers, setHeaders] = useState({});
  const [response, setResponse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ------------------------------
  // 2️⃣ Load login/auth + latest EWB
  // ------------------------------
  useEffect(() => {
    try {
      const login = JSON.parse(localStorage.getItem(STORAGE_KEY00) || "{}");
      const latestEwb = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");

      const token = login.fullResponse?.response?.token || "";
      const companyId = login.fullResponse?.response?.companyid || "";
      const lastGstin = latestEwb?.userGstin ;
      setHeaders({
        accept: "application/json",
        product: "TOPAZ",
        companyId,
        "x-auth-token": token,
      });

      // Auto-populate date from last EWB
      const lastEwbDate = latestEwb?.response?.ewbDate?.split(" ")[0] || "";
      setDate(lastEwbDate);

      // Auto-populate GSTIN from last EWB
      setUserGstin(latestEwb?.userGstin);
    } catch (err) {
      console.error("Error loading localStorage data", err);
    }
  }, []);

  // ------------------------------
  // 3️⃣ Date formatting helper
  // ------------------------------
  const fixDateFormat = (d) => {
    if (!d) return d;
    const parts = d.split("/");
    if (parts.length !== 3) return d;
    if (parts[2].length === 2) parts[2] = "20" + parts[2];
    return parts.join("/");
  };

  // ------------------------------
  // 4️⃣ Fetch EWB list
  // ------------------------------
  const fetchEwbs = async () => {
    setLoading(true);
    setError("");
    setResponse([]);

    const finalDate = fixDateFormat(date);
    const payload = { date: finalDate, userGstin };

    try {
      const res = await axios.get(
        "http://localhost:3001/proxy/topaz/ewb/fetchByDate",
        { params: payload, headers, timeout: 30000 }
      );

      setResponse(res.data.response || []);
    } catch (err) {
      setResponse([]);
      setError(JSON.stringify(err.response?.data || err.message, null, 2));
      console.error("❌ ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // 5️⃣ Navigate to EWB action
  // ------------------------------
  const goToEwbAction = (ewbNo) => navigate(`/ewaybill/ewb-action/${ewbNo}`);

  // ------------------------------
  // 6️⃣ Render UI
  // ------------------------------
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Fetch Generated E-Way Bills by Date</h2>

      {/* Input Fields */}
      <div style={{ marginBottom: 10 }}>
        <label>Date (DD/MM/YYYY)</label><br />
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: 6, width: 200 }}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>User GSTIN</label><br />
        <input
          value={userGstin}
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
          cursor: "pointer",
          background: "#1976d2",
          color: "white",
          border: "none",
        }}
      >
        {loading ? "Fetching..." : "Fetch EWB"}
      </button>

      {/* Error */}
      {error && (
        <pre style={{ background: "#ffeeee", color: "darkred", padding: 15, borderRadius: 6 }}>
          {error}
        </pre>
      )}

      {/* Response Table */}
      {response.length > 0 ? (
        <table
          border="1"
          cellPadding="8"
          style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}
        >
          <thead style={{ background: "#1976d2", color: "white" }}>
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
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: 5,
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
        !loading && <p style={{ color: "#888", fontStyle: "italic", marginTop: 15 }}>No records found.</p>
      )}
    </div>
  );
};

export default FetchByDate;
