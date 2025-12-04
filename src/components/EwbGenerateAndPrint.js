// EwbGenerateAndPrint.jsx
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
  } catch (e) {
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
   PrintDetails Component
--------------------------- */
export const PrintDetails = ({ apiResponse }) => {
  const [ewbNos, setEwbNos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [responseMsg, setResponseMsg] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [pdfMessage, setPdfMessage] = useState('');

  const login = safeParse(localStorage.getItem(STORAGE_KEY), {});
  const token = login?.token || login?.fullResponse?.response?.token || '';
  const  companyId= login?.companyid || login?.fullResponse?.response?.companyid || '';
  console.log(" companyId ",  companyId )
  const headers = {
    "X-Auth-Token": token,
    companyId,
    product: "TOPAZ",
    "Content-Type": "application/json",
    Accept: "application/pdf",
  };

  useEffect(() => {
    const latest = safeParse(localStorage.getItem(LATEST_EWB_KEY), {});
    if (latest?.ewbNo) setEwbNos([latest.ewbNo]);
  }, []);

  const payloadPreview = { ewbNo: ewbNos };




    const  handleDownloadPDF = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponseMsg('');

    if (!ewbNos.length || !ewbNos[0]) {
      setError('No EWB number available to print.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        'http://localhost:3001/proxy/topaz/ewb/printDetails',
        payloadPreview,
        { headers, responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download',`EWB-${apiResponse.response.ewbNo}.pdf`  );
      document.body.appendChild(link);
      link.click();
      link.remove();

      setResponseMsg('PDF downloaded successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Print failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: 20 }}>
      <h2>Print EWB Details</h2>
      <pre>{JSON.stringify(headers, null, 2)}</pre>
      <pre>{JSON.stringify(payloadPreview, null, 2)}</pre>

      <form>
        <input
          placeholder="EWB Nos (comma-separated)"
          value={ewbNos.join(',')}
          onChange={(e) => setEwbNos(e.target.value.split(',').map(n => n.trim()))}
          required
          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
      </form>

      {apiResponse && apiResponse.status === "SUCCESS" && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            style={{
              padding: '12px 24px',
              background: pdfLoading ? '#95a5a6' : '#2980b9',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: pdfLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {pdfLoading ? 'Downloading PDF...' : 'Download PDF'}
          </button>

          {pdfError && <p style={{ color: COLORS.danger, marginTop: 10 }}>{pdfError}</p>}
          {pdfMessage && <p style={{ color: COLORS.success, marginTop: 10 }}>{pdfMessage}</p>}
        </div>
      )}
    </div>
  );
};

/* ---------------------------
   Main Component: EwbGenerateAndPrint
--------------------------- */
const EwbGenerateAndPrint = () => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [authData, setAuthData] = useState({ companyId: '', token: '', userGstin: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiResponse, setApiResponse] = useState(null);

  useEffect(() => {
    const login = safeParse(localStorage.getItem(STORAGE_KEY), {});
    const token = login?.token || login?.fullResponse?.response?.token || '';
    const companyId = login?.companyId || login?.fullResponse?.response?.companyId || '';
    const userGstin = login?.userGstin || login?.fullResponse?.response?.userGstin || login?.fullResponse?.response?.user?.gstin || '';

    setAuthData({ token, companyId, userGstin });

    setFormData(prev => ({
      ...prev,
      companyId,
      userGstin,
      fromGstin: userGstin,
      dispatchFromGstin: userGstin,
      transporterId: userGstin
    }));
  }, []);

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
  }, [formData]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setApiResponse(null);

const login = safeParse(localStorage.getItem(STORAGE_KEY), {});
const token = login?.token || login?.fullResponse?.response?.token || '';
const companyid =
  login?.companyid ||                        // lowercase top-level
  login?.fullResponse?.response?.companyid || // lowercase nested
  '';                                         // fallback
           

  const headers = {
  "X-Auth-Token": token,
  companyId: companyid,    // must be non-empty
  product: "TOPAZ",
  "Content-Type": "application/json",
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
      } else {
        throw new Error(res.data?.message || "E-Way Bill generation failed");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>Generate E-Way Bill</h1>

      {/* Request Preview */}
      <div style={previewBox}>
        <h2>🔍 Request Preview</h2>
        <h3 style={{ marginTop: 15 }}>Headers</h3>
        <pre style={{ background: '#dfe4ea', padding: 15, borderRadius: 8, overflowX: 'auto' }}>
          {JSON.stringify(authData, null, 2)}
        </pre>

        <h3 style={{ marginTop: 15 }}>Payload</h3>
        <pre style={{ background: '#dfe4ea', padding: 15, borderRadius: 8, overflowX: 'auto' }}>
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {Object.keys(formData)
          .filter(key => key !== 'itemList')
          .map(key => (
            <div key={key} style={{ margin: '10px 0', display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '220px', fontWeight: 'bold' }}>{key}:</label>
              <input
                name={key}
                value={formData[key] ?? ''}
                onChange={handleChange}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                disabled={loading}
              />
            </div>
          ))}

        <h3 style={{ marginTop: 30, color: '#34495e' }}>Item List</h3>
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

      {/* API Response */}
      {apiResponse && apiResponse.status === "SUCCESS" && (
        <>
          <div style={{ marginTop: 50, padding: 30, background: '#f8f9fa', border: '3px solid #27ae60', borderRadius: 12 }}>
            <h2 style={{ textAlign: 'center', color: '#27ae60' }}>E-Way Bill Generated Successfully!</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 15, margin: '20px 0', fontSize: 16 }}>
              <div><strong>EWB No:</strong> <span style={{ fontSize: 22, color: '#e67e22', fontWeight: 'bold' }}>{apiResponse.response.ewbNo}</span></div>
              <div><strong>Valid Upto:</strong> <span style={{ color: '#c0392b' }}>{apiResponse.response.validUpto}</span></div>
              <div><strong>Generated On:</strong> {apiResponse.response.generatedOn || apiResponse.response.ewbDate}</div>
              <div><strong>Status:</strong> <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{apiResponse.response.status}</span></div>
              <div><strong>Invoice No:</strong> {apiResponse.response.docNo}</div>
              <div><strong>Total Value:</strong> ₹{apiResponse.response.totInvValue?.toLocaleString()}</div>
            </div>
            <details style={{ padding: 15, background: '#fff', borderRadius: 8 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Full API Response (Click to Expand)</summary>
              <pre style={{ overflowX: 'auto', marginTop: 10 }}>{JSON.stringify(apiResponse, null, 2)}</pre>
            </details>
          </div>

          {/* Print / Download */}
          <PrintDetails apiResponse={apiResponse} />
        </>
      )}

      {error && <p style={{ marginTop: 20, color: COLORS.danger, fontWeight: 'bold' }}>{error}</p>}
    </div>
  );
};

export default EwbGenerateAndPrint;