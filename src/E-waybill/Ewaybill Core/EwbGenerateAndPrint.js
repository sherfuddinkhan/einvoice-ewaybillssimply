import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from "react-router-dom";

// LocalStorage Keys
const EWAY_KEY = "iris_eway_session";
const LOGIN_RESPONSE_KEY = 'iris_login_data';
const LATEST_EWB_KEY = 'latestEwbData';
const EWB_HISTORY_KEY = 'ewbHistory';

const EwbGenerateAndPrint = () => {
  const location = useLocation();
     const invoiceData = location.state?.invoiceData || {};
    const receivedData = location.state || {};
  const dynamicId = receivedData.id || location.state?.pid;
 console.log("invoicedata",invoiceData)
  // 1. Initial State Hooks
  const [authCredentials, setAuthCredentials] = useState({ token: "YOUR_AUTH_TOKEN", companyId: "YOUR_COMPANY_ID" });
  const [formData, setFormData] = useState({
    supplyType: "O",
    subSupplyType: "1",
    docType: "INV",
    docNo: "Topaz340290",
    invType: "B2B",
    docDate: "15/11/2025",
    transactionType: 1,
    fromGstin: "",
    fromTrdName: "",
    dispatchFromGstin: "",
    dispatchFromTradeName: "",
    fromAddr1: "",
    fromAddr2: "",
    fromPlace: "",
    fromPincode: 192233,
    fromStateCode: 36,
    actFromStateCode: "36",
    toGstin: "",
    toTrdName: "",
    toAddr1: "",
    toAddr2: "",
    toPlace: "",
    toPincode: 500025,
    toStateCode: 36,
    actToStateCode: "36",
    totInvValue: 0,
    totalValue: 0,
    cgstValue: 0,
    sgstValue: 0,
    igstValue: 0,
    cessValue: 0,
    cessNonAdvolValue: 0,
    otherValue: 0,
    transMode: 1,
    transDistance: 10,
    transDocDate: "15/11/2025",
    transDocNo: "",
    transporterId: "",
    transporterName: "",
    vehicleNo: "",
    vehicleType: "R",
    itemList: [],
    companyId: null,
    userGstin: "",
    forceDuplicateCheck: true
  });

  const [pdfMessage, setPdfMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiResponse, setApiResponse] = useState(null);


  const safeParse = (v, fallback = {}) => {
    try {
      return JSON.parse(v ?? "null") ?? fallback;
    } catch {
      return fallback;
    }
  };

  // 2. Inline Header Configuration Utility
  const getRequestHeaders = (productName = "TOPAZ") => ({
    "X-Auth-Token": authCredentials?.token || "",
    "companyId": authCredentials?.companyId || "",
    "product": productName,
    "Content-Type": "application/json"
  });

  // 3. Dynamic Structural Data Binding
  useEffect(() => {
    const sessionData = safeParse(sessionStorage.getItem(EWAY_KEY));
    
    const parsedToken = sessionData?.token || sessionData?.fullResponse?.response?.token || "YOUR_AUTH_TOKEN";
    const parsedCompanyId = sessionData?.fullResponse?.response?.companyid || "4";
    const parsedGstin = invoiceData.gstin || sessionData?.userGstin || "01AAACI9260R002";

    setAuthCredentials({
      token: parsedToken,
      companyId: String(parsedCompanyId),
    });

    // Process array elements dynamically from invoiceProductDetails
    const mappedItems = (invoiceData.invoiceProductDetails || []).map(item => {
      const taxableAmt = parseFloat(item.totalAmount) || 0;
      const gstPercentage = parseFloat(item.gstPer) || 0;
      
      // Compute standard breakdowns dynamically if arrays yield null
      const computedTotalTax = taxableAmt * (gstPercentage / 100);
      const halfTaxAmount = computedTotalTax / 2;

      return {
        productName: item.description ? item.description.substring(0, 50) : "Machine Parts",
        productDesc: item.description || "Machinery Item",
        hsnCode: item.hsncode || "730411",
        quantity: parseFloat(item.quantity) || 1,
        qtyUnit: item.uom || "NOS",
        taxableAmount: taxableAmt,
        sgstRate: gstPercentage > 0 ? gstPercentage / 2 : 0,
        cgstRate: gstPercentage > 0 ? gstPercentage / 2 : 0,
        igstRate: 0.00,
        cessRate: 0.00,
        cessNonAdvol: 0.00,
        iamt: 0.00,
        camt: parseFloat(item.cgstAmount) || halfTaxAmount,
        samt: parseFloat(item.sgstAmount) || halfTaxAmount,
        csamt: 0.00,
        txp: "T"
      };
    });

    // Sum individual array blocks to formulate clean aggregated invoice totals
    const aggregatedTaxable = mappedItems.reduce((sum, item) => sum + item.taxableAmount, 0);
    const aggregatedCgst = mappedItems.reduce((sum, item) => sum + item.camt, 0);
    const aggregatedSgst = mappedItems.reduce((sum, item) => sum + item.samt, 0);
    const aggregatedInvoiceTotal = aggregatedTaxable + aggregatedCgst + aggregatedSgst;

    // Determine fallback values for template text fields safely
    const formattedVehicleNo = invoiceData.vehicleNo === "vehicle no" ? "AP28BN4797" : (invoiceData.vehicleNo || "AP28BN4797");
    const formattedBuyerGstin = (invoiceData.buyerClients?.gstin === "." || !invoiceData.buyerClients?.gstin) ? "36AAAAU1183B1Z0" : invoiceData.buyerClients.gstin;

    setFormData((prev) => ({
      ...prev,
     docNo: dynamicId,
     docDate: invoiceData.deliveryNoteDate || "17/06/2026", 
      
      // --- SELLER (SWASTIK MACHINERY CORPORATION) ---
      fromGstin: parsedGstin,
      fromTrdName: invoiceData.company_Name || "SWASTIK MACHINERY CORPORATION",
      dispatchFromGstin: parsedGstin,
      dispatchFromTradeName: invoiceData.company_Name || "SWASTIK MACHINERY CORPORATION",
      fromAddr1: invoiceData.company_Address || "#11-171/5, Fathenagar,",
      fromAddr2: invoiceData.company_City || "Hyderabad",
      fromPlace: invoiceData.company_City || "Hyderabad",
      fromPincode: parseInt(invoiceData.company_PINCode) || 192233,
      fromStateCode: 36, // Telangana
      actFromStateCode: "36",

      // --- BUYER (buyerClients Structure mapping) ---
      toGstin: formattedBuyerGstin,
      toTrdName: invoiceData.buyerClients?.companyName || "Buyer Company",
      toAddr1: invoiceData.buyerClients?.officeAddress || "Phase -2., Cherlapally",
      toAddr2: invoiceData.buyerClients?.poBox || "Hyderabad",
      toPlace: invoiceData.buyerClients?.stateName || "Hyderabad",
      toPincode: parseInt(invoiceData.buyerClients?.poBox) || 500025,
      toStateCode: parseInt(invoiceData.buyerClients?.masterStateNames?.stateCode) || 36,
      actToStateCode: invoiceData.buyerClients?.masterStateNames?.stateCode || "36",

      // --- MATHEMATICAL VALUATIONS ---
      totalValue: aggregatedTaxable,
      cgstValue: aggregatedCgst,
      sgstValue: aggregatedSgst,
      igstValue: 0.00,
      totInvValue: aggregatedInvoiceTotal,

      // --- TRANSPORTATION ---
      transDocDate: invoiceData.deliveryNoteDate || "17/06/2026",
      transDocNo: invoiceData.despatchedDocumentNumber || "1212",
      transporterId: parsedGstin,
      transporterName: invoiceData.company_Name || "SWASTIK MACHINERY CORPORATION",
      vehicleNo: formattedVehicleNo,

      // --- BALANCED ITEM LINE ENTRIES ---
      itemList: mappedItems,

      companyId: Number(parsedCompanyId),
      userGstin: parsedGstin,
    }));
  }, []);

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
      console.log("Changing:", name, value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };
 // ----------------- ITEM HANDLERS -----------------

const handleItemChange = (index, e) => {
  const { name, value } = e.target;

  setFormData((prev) => {
    const updatedItems = [...prev.itemList];

    updatedItems[index] = {
      ...updatedItems[index],
      [name]: value,
    };

    return {
      ...prev,
      itemList: updatedItems,
    };
  });
};

const addItem = () => {
  setFormData((prev) => ({
    ...prev,
    itemList: [
      ...prev.itemList,
      {
        productName: "",
        productDesc: "",
        hsnCode: "",
        quantity: 1,
        qtyUnit: "NOS",
        taxableAmount: 0,
        sgstRate: 0,
        cgstRate: 0,
        igstRate: 0,
        cessRate: 0,
        cessNonAdvol: 0,
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0,
        txp: "T",
      },
    ],
  }));
};

const removeItem = (index) => {
  setFormData((prev) => ({
    ...prev,
    itemList: prev.itemList.filter((_, i) => i !== index),
  }));
};


  // ----------------- SUBMIT HANDLER -----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setApiResponse(null);

    const headers = getRequestHeaders("TOPAZ");

    try {
      const res = await axios.post(
        "https://einvoice.fcssoftwares.com/api/gst/ewaybill/generate",
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

  // ----------------- DOWNLOAD PDF -----------------
  const downloadPDF = async () => {
    try {
      const ewbNo = apiResponse?.response?.ewbNo;
      if (!ewbNo) {
        setPdfMessage("No invoice ID found.");
        return;
      }

      setPdfMessage("Processing PDF download...");
      const url = "https://einvoice.fcssoftwares.com/api/gst/ewaybill/print-details";
      const headers = getRequestHeaders("TOPAZ");

      const resp = await axios.post(
        url, 
        { ewbNo: [ewbNo.toString()] }, 
        { headers, responseType: "blob" } 
      );

      const blobUrl = window.URL.createObjectURL(
        new Blob([resp.data], { type: "application/pdf" })
      );

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `EInvoice_${ewbNo}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
      setPdfMessage("PDF downloaded successfully.");
    } catch (error) {
      console.error("PDF Download Error:", error);
      setPdfMessage("Failed to download PDF.");
    }
  };

 return (
  <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px" }}>
    <h1 style={{ textAlign: "center" }}>Generate E-Way Bill</h1>

    <form onSubmit={handleSubmit}>
      {/* Main Fields */}
      {Object.keys(formData)
        .filter(key => key !== "itemList")
        .map(key => (
          <div key={key} style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "5px"
              }}
            >
              {key}
            </label>

            <input
              type="text"
              name={key}
              value={formData[key] ?? ""}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px"
              }}
            />
          </div>
        ))}

      {/* Item List */}
      <h3>Items</h3>

      {formData.itemList?.map((item, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "15px",
            borderRadius: "5px"
          }}
        >
          <h4>Item {index + 1}</h4>

          {Object.keys(item).map(field => (
            <div key={field} style={{ marginBottom: "10px" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "5px"
                }}
              >
                {field}
              </label>

              <input
                type="text"
                name={field}
                value={item[field] ?? ""}
                onChange={(e) => handleItemChange(index, e)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px"
                }}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => removeItem(index)}
            style={{
              background: "#ff4d4f",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              cursor: "pointer"
            }}
          >
            Remove Item
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        style={{
          marginRight: "10px",
          padding: "10px 15px"
        }}
      >
        Add Item
      </button>

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "10px 15px"
        }}
      >
        {loading ? "Generating..." : "Generate E-Way Bill"}
      </button>
    </form>

    {apiResponse && (
      <div
        style={{
          marginTop: 20,
          padding: 15,
          background: "#f6ffed",
          border: "1px solid #b7eb8f",
          borderRadius: 6
        }}
      >
        <h4>E-Way Bill Generated Successfully</h4>

        <p>
          <strong>EWB No:</strong> {apiResponse?.response?.ewbNo}
        </p>

        <p>
          <strong>Valid Upto:</strong> {apiResponse?.response?.validUpto}
        </p>

        <button onClick={downloadPDF}>
          Download PDF
        </button>

        {pdfMessage && (
          <p style={{ marginTop: 10 }}>
            {pdfMessage}
          </p>
        )}
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