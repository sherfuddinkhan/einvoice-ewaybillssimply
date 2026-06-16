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
  const [authCredentials, setAuthCredentials] = useState({token: "YOUR_AUTH_TOKEN",companyId: "YOUR_COMPANY_ID"});

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
  <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
    
    <h1 style={{ textAlign: 'center' }}>Generate E-Way Bill</h1>

    {/* ONLY FORM (NO PREVIEW SECTION) */}
    <form onSubmit={handleSubmit}>

      {/* Example: still allow inputs OR you can hide everything */}
      {Object.keys(formData)
        .filter(key => key !== "itemList")
        .map(key => (
          <div key={key} style={{ margin: "10px 0" }}>
            <label>{key}</label>
            <input
              name={key}
              value={formData[key] ?? ""}
              onChange={handleChange}
              style={{ width: "100%", padding: 8 }}
              disabled={loading}
            />
          </div>
        ))}

      <button type="submit" disabled={loading}>
        {loading ? "Generating..." : "Generate E-Way Bill"}
      </button>
    </form>

    {/* RESPONSE ONLY */}
    {apiResponse && (
      <div style={{ marginTop: 30 }}>
        <h3>Success Response</h3>
        <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
      </div>
    )}

    {error && (
      <div style={{ color: "red", marginTop: 20 }}>
        {error}
      </div>
    )}
  </div>
);
};

export default EwbGenerateAndPrint;