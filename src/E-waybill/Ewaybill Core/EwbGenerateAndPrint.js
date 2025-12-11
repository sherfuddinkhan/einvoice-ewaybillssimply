import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

/* ---------------------------
   LocalStorage keys & utils
--------------------------- */
const STORAGE_KEY = 'iris_ewaybill_shared_config';
const LATEST_EWB_KEY = 'latestEwbData';
const EWB_HISTORY_KEY = 'ewbHistory';

const safeParse = (v, fallback = {}) => {
  try {
    return JSON.parse(v || 'null') ?? fallback;
  } catch {
    return fallback;
  }
};

/* ---------------------------
   Styling constants
--------------------------- */
const COLORS = {
  primary: '#1A73E8',
  success: '#34A853',
  danger: '#EA4335',
  background: '#F5F5F7',
};

const containerStyle = {
  maxWidth: '1200px',
  margin: '20px auto',
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
};

const previewBox = {
  margin: '30px 0',
  padding: '20px',
  background: '#f1f2f6',
  borderRadius: '10px',
};

/* ---------------------------
   Default EWB form payload
--------------------------- */
const DEFAULT_FORM = {
  supplyType: "O",
  subSupplyType: "1",
  docType: "INV",
  docNo: "Topaz340290",
  invType: "B2B",
  docDate: "15/11/2025",
  transactionType: 1,
  fromGstin: "05AAAAU1183B5ZW",
  fromTrdName: "ABC",
  dispatchFromGstin: "05AAAAU1183B5ZW",
  dispatchFromTradeName: "PQR",
  fromAddr1: "T231",
  fromAddr2: "IIP",
  fromPlace: "Akodiya",
  fromPincode: 248001,
  fromStateCode: 5,
  toGstin: "05AAAAU1183B1Z0",
  toTrdName: "RJ-Rawat Foods",
  toAddr1: "S531, SSB Towers",
  toAddr2: "MG Road",
  toPlace: "Dehradun",
  toPincode: 248002,
  toStateCode: 5,
  totInvValue: 21000.00,
  totalValue: 20000.00,
  cgstValue: 500.00,
  sgstValue: 500.00,
  igstValue: 0.00,
  cessValue: 0.00,
  cessNonAdvolValue: 0.00,
  otherValue: 0.00,
  transMode: 1,
  transDistance: 10,
  transDocDate: "15/11/2025",
  transDocNo: "1212",
  transporterId: "05AAAAU1183B1Z0",
  transporterName: "ACVDF",
  vehicleNo: "RJ14CA9999",
  vehicleType: "R",
  actFromStateCode: "5",
  actToStateCode: "5",
  itemList: [
    {
      productName: "Sugar",
      productDesc: "Sugar",
      hsnCode: "8517",
      quantity: 10,
      qtyUnit: "KGS",
      taxableAmount: 20000.00,
      sgstRate: 2.50,
      cgstRate: 2.50,
      igstRate: 0.00,
      cessRate: 0.00,
      cessNonAdvol: 0.00,
      iamt: 0.00,
      camt: 500.00,
      samt: 500.00,
      csamt: 0.00,
      txp: "T"
    }
  ],
  companyId: "",
  userGstin: "05AAAAU1183B5ZW",
  forceDuplicateCheck: true
};

/* ---------------------------
   Main Component
--------------------------- */
const EwbGenerateAndPrint = () => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [authData, setAuthData] = useState({ companyId: '', token: '', userGstin: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  const [ewbNos, setEwbNos] = useState([]);

  /* ---------------------------
     Load auth data from localStorage
  --------------------------- */
  useEffect(() => {
    const login = safeParse(localStorage.getItem(STORAGE_KEY), {});
    const token = login?.token || login?.fullResponse?.response?.token || '';
    const companyId = login?.companyId || login?.fullResponse?.response?.companyId || '';
    const userGstin =
      login?.userGstin ||
      login?.fullResponse?.response?.userGstin ||
      login?.fullResponse?.response?.user?.gstin ||
      '';

    setAuthData({ token, companyId, userGstin });

    setFormData(prev => ({
      ...prev,
      companyId,
      userGstin,
      fromGstin: userGstin,
      dispatchFromGstin: userGstin,
      transporterId: userGstin
    }));

    // Load latest EWB from localStorage
    const latest = safeParse(localStorage.getItem(LATEST_EWB_KEY), {});
    if (latest?.ewbNo) setEwbNos([latest.ewbNo]);

    console.log("📌 Auth data loaded:", { token, companyId, userGstin });
  }, []);

  /* ---------------------------
     Save EWB to localStorage
  --------------------------- */
  const saveToLocalStorage = useCallback((fullResponse) => {
    const resp = fullResponse.response || {};
    const ewbData = {
      generatedAt: new Date().toISOString(),
      ewbNo: resp.ewbNo || resp.ewb_number || null,
      validUpto: resp.validUpto || null,
      fullApiResponse: fullResponse,
      payloadUsed: formData,
      qrCode: resp.qrCode || resp.qr_code || null,
      barcode: resp.barcode || null,
    };

    localStorage.setItem(LATEST_EWB_KEY, JSON.stringify(ewbData));

    const rawHistory = safeParse(localStorage.getItem(EWB_HISTORY_KEY), []);
    const deduped = rawHistory.filter(h => h.ewbNo !== ewbData.ewbNo);
    deduped.unshift(ewbData);
    if (deduped.length > 20) deduped.pop();
    localStorage.setItem(EWB_HISTORY_KEY, JSON.stringify(deduped));

    console.log("📌 Latest EWB saved:", ewbData);
    console.log("📌 Full EWB history:", deduped);
  }, [formData]);

  /* ---------------------------
     Handlers
  --------------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newItems = [...prev.itemList];
      newItems[index] = { ...newItems[index], [name]: value };
      return { ...prev, itemList: newItems };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      itemList: [...prev.itemList, {
        productName: "", productDesc: "", hsnCode: "", quantity: 0, qtyUnit: "KGS",
        taxableAmount: 0, sgstRate: 0, cgstRate: 0, igstRate: 0, cessRate: 0,
        cessNonAdvol: 0, iamt: 0, camt: 0, samt: 0, csamt: 0, txp: "T"
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({ ...prev, itemList: prev.itemList.filter((_, i) => i !== index) }));
  };

  /* ---------------------------
     Generate EWB
  --------------------------- */
  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setApiResponse(null);

    const headers = {
      "X-Auth-Token": authData.token,
      companyId: authData.companyId,
      product: "TOPAZ",
      "Content-Type": "application/json"
    };

    try {
      const res = await axios.post(
        'http://localhost:3001/proxy/topaz/ewb/generate',
        formData,
        { headers }
      );

      if (res.data?.status === "SUCCESS" && res.data?.response) {
        setApiResponse(res.data);
        saveToLocalStorage(res.data);
        setEwbNos([res.data.response.ewbNo]);
      } else {
        throw new Error(res.data?.message || "E-Way Bill generation failed");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown error';
      setError(msg);
      console.error("❌ EWB generation error:", msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------
     Print PDF
  --------------------------- */
  const handlePrint = async () => {
    if (!ewbNos.length || !ewbNos[0]) {
      setError('No EWB number available to print.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const headers = {
        "X-Auth-Token": authData.token,
        companyId: authData.companyId,
        product: "TOPAZ",
        "Content-Type": "application/json",
        Accept: "application/pdf"
      };

      const payload = { ewbNo: ewbNos };
      const res = await axios.post(
        'http://localhost:3001/proxy/topaz/ewb/printDetails',
        payload,
        { headers, responseType: 'blob' }
      );

      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${ewbNos[0]}-details.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Print failed');
      console.error("❌ Print error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------
     JSX Render
  --------------------------- */
  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>Generate & Print E-Way Bill</h1>

      {/* Request Preview */}
      <div style={previewBox}>
        <h2>🔍 Request Preview</h2>
        <h3>Headers</h3>
        <pre style={{ background: '#dfe4ea', padding: 15, borderRadius: 8, overflowX: 'auto' }}>
          {JSON.stringify({ token: authData.token, companyId: authData.companyId, product: 'TOPAZ' }, null, 2)}
        </pre>

        <h3>Payload</h3>
        <pre style={{ background: '#dfe4ea', padding: 15, borderRadius: 8, overflowX: 'auto' }}>
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate}>
        {Object.keys(formData).filter(k => k !== 'itemList').map(key => (
          <div key={key} style={{ margin: '10px 0', display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '220px', fontWeight: 'bold' }}>{key}:</label>
            <input
              name={key}
              value={formData[key] ?? ''}
              onChange={handleChange}
              style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              disabled={loading}
            />
          </div>
        ))}

        <h3 style={{ marginTop: 20 }}>Item List</h3>
        {formData.itemList.map((item, idx) => (
          <div key={idx} style={{ border: '2px dashed #95a5a6', padding: 15, margin: '15px 0', borderRadius: 8, background: '#ecf0f1' }}>
            {Object.keys(item).map(attr => (
              <div key={attr} style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}>
                <label style={{ width: 200 }}>{attr}:</label>
                <input
                  name={attr}
                  value={item[attr] ?? ''}
                  onChange={(e) => handleItemChange(idx, e)}
                  style={{ flex: 1, padding: 6, borderRadius: 4 }}
                  disabled={loading}
                />
              </div>
            ))}
            <button type="button" onClick={() => removeItem(idx)} style={{ padding: '8px 16px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4 }}>
              Remove Item
            </button>
          </div>
        ))}

        <button type="button" onClick={addItem} style={{ padding: '12px 24px', background: '#3498db', color: 'white', border: 'none', borderRadius: 6, margin: '15px 0' }}>
          + Add New Item
        </button>

        <br /><br />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '18px',
            fontSize: 20,
            background: loading ? '#95a5a6' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generating E-Way Bill...' : 'Generate E-Way Bill'}
        </button>
      </form>

      <button
        type="button"
        onClick={handlePrint}
        disabled={loading || !ewbNos.length}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: 18,
          marginTop: 20,
          background: '#1A73E8',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: loading || !ewbNos.length ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Processing...' : 'Print PDF'}
      </button>

      {apiResponse && apiResponse.status === "SUCCESS" && (
        <div style={{ marginTop: 50, padding: 30, background: '#f8f9fa', border: '3px solid #27ae60', borderRadius: 12 }}>
          <h2 style={{ textAlign: 'center', color: '#27ae60' }}>E-Way Bill Generated Successfully!</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 15, marginTop: 20 }}>
            <div><strong>EWB No:</strong> {apiResponse.response.ewbNo}</div>
            <div><strong>Valid Upto:</strong> {apiResponse.response.validUpto}</div>
            <div><strong>Invoice No:</strong> {apiResponse.response.docNo}</div>
            <div><strong>Total Value:</strong> ₹{apiResponse.response.totInvValue?.toLocaleString()}</div>
            <div><strong>Status:</strong> {apiResponse.response.status}</div>
          </div>

          <details style={{ padding: 15, background: '#fff', borderRadius: 8, marginTop: 15 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Full API Response</summary>
            <pre style={{ overflowX: 'auto', marginTop: 10 }}>{JSON.stringify(apiResponse, null, 2)}</pre>
          </details>
        </div>
      )}

      {error && <p style={{ marginTop: 20, color: COLORS.danger, fontWeight: 'bold' }}>{error}</p>}
    </div>
  );
};

export default EwbGenerateAndPrint;
