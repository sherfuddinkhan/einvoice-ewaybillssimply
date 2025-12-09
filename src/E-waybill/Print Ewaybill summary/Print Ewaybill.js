import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LOGIN_KEY = 'iris_login_data';
const LATEST_EWB_KEY = 'latestEwbData';

const PrintDetails = () => {
  // ----------------------------
  // State
  // ----------------------------
  const [ewbNos, setEwbNos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState(null);
  const [headers, setHeaders] = useState({
    "X-Auth-Token": "",
    companyId: "",
    product: "TOPAZ",
    "Content-Type": "application/json",
    Accept: "application/pdf",
  });

  // ----------------------------
  // Auto-populate from localStorage
  // ----------------------------
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(LOGIN_KEY) || "{}");
    const latest = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");

    // Headers autopopulation
    setHeaders((prev) => ({
      ...prev,
      "X-Auth-Token": login?.token || "",
      companyId: login?.companyId || "",
    }));

    // EWB number autopopulation
    if (latest?.response?.ewbNo) {
      setEwbNos([latest.response.ewbNo]);
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
    setResponse(null);

    if (!ewbNos.length || !ewbNos[0]) {
      setError('No EWB number available to print.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        'http://localhost:3001/proxy/topaz/ewb/printDetails',
        payloadPreview,
        { headers, responseType: 'blob' } // for PDF download
      );

      // Download PDF
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ewb-details.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setResponse('PDF downloaded successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Print failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: 20 }}>
      <h2>Print EWB Details</h2>

      <h3>Headers Preview</h3>
      <pre>{JSON.stringify(headers, null, 2)}</pre>

      <h3>Payload Preview</h3>
      <pre>{JSON.stringify(payloadPreview, null, 2)}</pre>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="EWB Nos (comma-separated)"
          value={ewbNos.join(',')}
          onChange={(e) =>
            setEwbNos(e.target.value.split(',').map((n) => n.trim()))
          }
          required
        />
        <button type="submit" disabled={loading} style={{ marginTop: 10 }}>
          {loading ? 'Printing...' : 'Print PDF'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {response && <p style={{ color: 'green' }}>{response}</p>}
    </div>
  );
};

export default PrintDetails;
