import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from "react-router-dom";

// LocalStorage Keys
const EWAY_KEY = "iris_eway_session";
const LOGIN_RESPONSE_KEY = 'iris_login_data';
const LATEST_EWB_KEY = 'latestEwbData';
const EWB_HISTORY_KEY = 'ewbHistory';

const EwbGenerateAndPrint= () => {
    const location = useLocation();
  const defaultFormData = {
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
    companyId: null,
    userGstin: "05AAAAU1183B5ZW",
    forceDuplicateCheck: true
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [authData, setAuthData] = useState({ companyId: '', token: '', userGstin: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
    const [authCredentials, setAuthCredentials] = useState({
      token: "YOUR_AUTH_TOKEN",
      companyId: "YOUR_COMPANY_ID"
    });

  const safeParse = (v, fallback = {}) => {
  try {
    return JSON.parse(v ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
};
  // ----------------- AUTOPOPULATE -----------------
 useEffect(() => {
  const sessionData = safeParse(sessionStorage.getItem(EWAY_KEY));
  console.log("sessionData",sessionData)

  const parsedToken =
    sessionData?.token ||
    sessionData?.fullResponse?.response?.token ||
    "YOUR_AUTH_TOKEN";

  // Use companyid from fullResponse.response
  const parsedCompanyId =
    sessionData?.fullResponse?.response?.companyid || "4";

  const parsedGstin =
    sessionData?.userGstin || "05AAAAU1183B5ZW";

  console.log("Parsed Token:", parsedToken);
  console.log("Parsed CompanyId:", parsedCompanyId);
   console.log("parsedGstin:",  parsedGstin);

  setAuthCredentials({
    token: parsedToken,
    companyId: String(parsedCompanyId),
  });
console.log(" authData",authData)
  setFormData((prev) => ({
    ...prev,
    companyId: Number(parsedCompanyId),
    userGstin: parsedGstin || prev.userGstin,
  }));
}, []);

useEffect(() => {
  console.log("AUTH UPDATED:", authCredentials);
}, [authCredentials]);
  // ----------------- LOCAL STORAGE SAVE -----------------
  const saveToLocalStorage = (fullResponse) => {
    const resp = fullResponse.response;
    const ewbData = {
      generatedAt: new Date().toISOString(),
      ewbNo: resp.ewbNo,
      validUpto: resp.validUpto,
      fullApiResponse: fullResponse,
      payloadUsed: formData,
      qrCode: resp.qrCode || null,
      barcode: resp.barcode || null,
    };

    localStorage.setItem(LATEST_EWB_KEY, JSON.stringify(ewbData));

    let history = JSON.parse(localStorage.getItem(EWB_HISTORY_KEY) || '[]');
    history = history.filter(h => h.ewbNo !== resp.ewbNo);
    history.unshift(ewbData);
    if (history.length > 20) history.pop();
    localStorage.setItem(EWB_HISTORY_KEY, JSON.stringify(history));
  };

  // ----------------- FORM HANDLERS -----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.itemList];
    newItems[index] = { ...newItems[index], [name]: value };
    setFormData(prev => ({ ...prev, itemList: newItems }));
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
    setFormData(prev => ({
      ...prev,
      itemList: prev.itemList.filter((_, i) => i !== index)
    }));
  };

  // ----------------- SUBMIT HANDLER -----------------
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setApiResponse(null);

  console.log("AUTH USED:", authCredentials);

  const headers = {
    "X-Auth-Token": authCredentials?.token || "",
    "companyId": authCredentials?.companyId || "",
    "product": "TOPAZ",
    "Content-Type": "application/json"
  };

  console.log("Headers:", headers);
  console.log("Payload:", formData);

  try {
    const res = await axios.post(
      "http://localhost:3001/proxy/topaz/ewb/generate",
      formData,
      { headers }
    );

    if (res.data.status === "SUCCESS" && res.data.response) {
      setApiResponse(res.data);
      saveToLocalStorage(res.data);
    } else {
      throw new Error(res.data.message || "E-Way Bill generation failed");
    }
  } catch (err) {
    setError(
      err.response?.data?.message ||
      err.message ||
      "Unknown error"
    );
  } finally {
    setLoading(false);
  }
};
  const requestHeaders = {
    'X-Auth-Token': authCredentials.token || '',
    'companyId': authCredentials.companyId || '',
    'product': 'TOPAZ',
    'Content-Type': 'application/json'
  };

  // ----------------- JSX -----------------
  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>Generate E-Way Bill</h1>

      {/* Request Preview */}
      <div style={{ margin: '30px 0', padding: '20px', background: '#f1f2f6', borderRadius: '10px' }}>
        <h2 style={{ color: '#2f3542' }}>🔍 Request Preview</h2>

        <h3 style={{ marginTop: '15px', color: '#57606f' }}>Headers</h3>
        <pre style={{ background: '#dfe4ea', padding: '15px', borderRadius: '8px', overflowX: 'auto' }}>
          {JSON.stringify(requestHeaders, null, 2)}
        </pre>

        <h3 style={{ marginTop: '15px', color: '#57606f' }}>Payload</h3>
        <pre style={{ background: '#dfe4ea', padding: '15px', borderRadius: '8px', overflowX: 'auto' }}>
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

        <h3 style={{ marginTop: '30px', color: '#34495e' }}>Item List</h3>
        {formData.itemList.map((item, idx) => (
          <div key={idx} style={{ border: '2px dashed #95a5a6', padding: '15px', margin: '15px 0', borderRadius: '8px', background: '#ecf0f1' }}>
            {Object.keys(item).map(attr => (
              <div key={attr} style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}>
                <label style={{ width: '200px' }}>{attr}:</label>
                <input
                  name={attr}
                  value={item[attr] ?? ''}
                  onChange={(e) => handleItemChange(idx, e)}
                  style={{ flex: 1, padding: '6px', borderRadius: '4px' }}
                  disabled={loading}
                />
              </div>
            ))}
            <button type="button" onClick={() => removeItem(idx)} style={{ padding: '8px 16px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px' }}>
              Remove Item
            </button>
          </div>
        ))}

        <button type="button" onClick={addItem} style={{ padding: '12px 24px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', margin: '15px 0' }}>
          + Add New Item
        </button>

        <br /><br />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '18px',
            fontSize: '20px',
            background: loading ? '#95a5a6' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generating E-Way Bill...' : 'Generate E-Way Bill'}
        </button>
      </form>

      {/* API Response */}
      {apiResponse && apiResponse.status === "SUCCESS" && (
        <div style={{ marginTop: '50px', padding: '30px', background: '#f8f9fa', border: '3px solid #27ae60', borderRadius: '12px' }}>
          <h2 style={{ textAlign: 'center', color: '#27ae60' }}>E-Way Bill Generated Successfully!</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', margin: '20px 0', fontSize: '16px' }}>
            <div><strong>EWB No:</strong> <span style={{ fontSize: '22px', color: '#e67e22', fontWeight: 'bold' }}>{apiResponse.response.ewbNo}</span></div>
            <div><strong>Valid Upto:</strong> <span style={{ color: '#c0392b' }}>{apiResponse.response.validUpto}</span></div>
            <div><strong>Generated On:</strong> {apiResponse.response.generatedOn || apiResponse.response.ewbDate}</div>
            <div><strong>Status:</strong> <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{apiResponse.response.status}</span></div>
            <div><strong>Invoice No:</strong> {apiResponse.response.docNo}</div>
            <div><strong>Total Value:</strong> ₹{apiResponse.response.totInvValue?.toLocaleString()}</div>
          </div>
          <details style={{ marginTop: '30px' }}>
            <summary style={{ fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', color: '#2980b9' }}>
              View Complete API Response (JSON)
            </summary>
            <pre style={{ background: '#2c3e50', color: '#1abc9c', padding: '20px', borderRadius: '8px', overflowX: 'auto', marginTop: '10px', fontSize: '13px' }}>
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#e74c3c', color: 'white', borderRadius: '8px', textAlign: 'center', fontSize: '18px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default EwbGenerateAndPrint;