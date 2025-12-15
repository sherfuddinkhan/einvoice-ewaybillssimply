import React, { useState, useEffect } from 'react';
import axios from 'axios';
/* ---------------------------------
   LocalStorage Keys (STANDARD)
---------------------------------- */
const STORAGE_KEY00   = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY  = "latestEwbData";
const LATEST_CEWB_KEY = "latestCewbData";
const QUERY_KEY       = "mv_requests_query";
const RESP_KEY        = "mv_requests_response";

const PrintEwaybill = () => {
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
  // Auto-populate headers and EWB numbers
  // ----------------------------
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(STORAGE_KEY00) || "{}");
    const latest = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");

    // Headers autopopulate
    setHeaders(prev => ({
      ...prev,
      "X-Auth-Token": login?.token || "",
      companyId: login?.companyId || "",
    }));

    // EWB numbers autopopulate
    if (latest?.response?.ewbNo) {
      // If vehicleDetails exists, use all ewbNos; else single
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

  // ----------------------------
  // UI
  // ----------------------------
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
          style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '10px' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Printing...' : 'Print PDF'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {response && <p style={{ color: 'green' }}>{response}</p>}
    </div>
  );
};

export default PrintEwaybill;
