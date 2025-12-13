import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LOGIN_KEY = "iris_login_data";
const LATEST_EWB_KEY = "latestEwbData";

const FetchByDate = () => {
  const navigate = useNavigate();

  const [date, setDate] = useState("");
  const [userGstin, setUserGstin] = useState("");

  const [headersUI, setHeadersUI] = useState({});
  const [response, setResponse] = useState([]);

  // ----------------------------------------
  // Load headers + latest EWB
  // ----------------------------------------
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(LOGIN_KEY) || "{}");
    const latest = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");

    setHeadersUI({
      accept: "application/json",
      product: "TOPAZ",
      companyid: login.companyId || "",
      "x-auth-token": login.token || "",
    });

    const latestDate = latest?.response?.ewbDate?.split(" ")[0] || "";
    setDate(latestDate);

    setUserGstin(latest?.response?.fromGstin || "");
  }, []);

  const fixDateFormat = (d) => {
    if (!d) return d;
    const parts = d.split("/");
    if (parts.length !== 3) return d;
    if (parts[2].length === 2) parts[2] = "20" + parts[2];
    return parts.join("/");
  };

  const fetchEwbs = async () => {
    const finalDate = fixDateFormat(date);

    const payload = {
      date: finalDate,
      userGstin,
    };

    try {
      const res = await axios.get(
        "http://localhost:3001/proxy/topaz/ewb/fetchByDate",
        { params: payload, headers: headersUI }
      );
      setResponse(res.data.response || []);
    } catch (error) {
      setResponse([]);
      console.error("❌ ERROR:", error);
    }
  };

  // ⭐ Correct path for EWB Action screen
  const goToEwbAction = (ewbNo) => {
    navigate(`/ewaybill/ewb-action/${ewbNo}`);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Fetch Generated E-Way Bills by Date</h2>

      <div>
        <label>Date (DD/MM/YYYY)</label><br />
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: 6, width: 200 }}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <label>User GSTIN</label><br />
        <input
          value={userGstin}
          onChange={(e) => setUserGstin(e.target.value)}
          style={{ padding: 6, width: 200 }}
        />
      </div>

      <button
        onClick={fetchEwbs}
        style={{
          marginTop: 15,
          padding: "8px 20px",
          cursor: "pointer",
          background: "#1976d2",
          color: "white",
          border: "none",
        }}
      >
        Fetch EWB
      </button>

      <h3 style={{ marginTop: 30 }}>EWB List</h3>

      {response.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
          }}
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
      )}
    </div>
  );
};

export default FetchByDate;
