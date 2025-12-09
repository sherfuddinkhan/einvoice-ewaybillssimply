import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LOGIN_KEY = 'iris_login_data';
const LATEST_EWB_KEY = 'latestEwbData';

const PrintSummary = () => {
  // ----------------------------
  // State
  // ----------------------------
  const [ewbNos, setEwbNos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [responseMsg, setResponseMsg] = useState('');
  const [headers, setHeaders] = useState({
    "X-Auth-Token": "",
    companyId: "",
    product: "TOPAZ",
    "Content-Type": "application/json",
    Accept: "application/pdf"
  });

  // ----------------------------
  // Autopopulate headers and EWB numbers
  // ----------------------------
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(LOGIN_KEY) || "{}");
    const latest = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");

    // Headers autopopulate
    setHeaders(prev => ({
      ...prev,
      "X-Auth-Token": login?.token || "",
      companyId: login?.companyId || "",
    }));

    // EWB numbers autopopulate
    if (latest?.response?.ewbNo) {
      // If vehicleDetails exists, map them all; else single EWB
      const ewbList = latest?.response?.vehicleDetails?.map(v => v.ewbNo) || [latest.response.ewbNo];
      setEwbNos(ewbList);
    }
  }, []);

  // ----------------------------
  // Payload for API
  // ----------------------------
  const payloadPreview = { ewbNo: ewbNos };

  // ----------------------------
  // Submit handler
  // ----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponseMsg('');

    if (!ewbNos.length || !ewbNos[0]) {
      setError('No EWB numbers available to print.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        'http://localhost:3001/proxy/topaz/ewb/printSummary',
        payloadPreview,
        {
          headers,
          responseType: 'blob'
        }
      );

      // Download PDF
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ewb-summary.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();

      setResponseMsg('PDF downloaded successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to print summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: 'auto', padding: 20 }}>
      <h2>Print EWB Summary</h2>

      {/* Headers Preview */}
      <h3>Headers Preview</h3>
      <pre>{JSON.stringify(headers, null, 2)}</pre>

      {/* Payload Preview */}
      <h3>Payload Preview</h3>
      <pre>{JSON.stringify(payloadPreview, null, 2)}</pre>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <label>EWB Numbers (comma-separated):</label>
        <input
          type="text"
          value={ewbNos.join(',')}
          onChange={(e) => setEwbNos(e.target.value.split(',').map(n => n.trim()))}
          required
          style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '10px' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Printing...' : 'Print PDF'}
        </button>
      </form>

      {/* Error / Response */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {responseMsg && <p style={{ color: 'green' }}>{responseMsg}</p>}
    </div>
  );
};

export default PrintSummary;
