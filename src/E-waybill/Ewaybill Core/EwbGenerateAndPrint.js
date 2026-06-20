import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from "react-router-dom";
import { useAuth } from "../../components/AuthContext";
// LocalStorage Keys
const EWAY_KEY = "iris_eway_session";
const LOGIN_RESPONSE_KEY = 'iris_login_data';
const LATEST_EWB_KEY = 'latestEwbData';
const EWB_HISTORY_KEY = 'ewbHistory';

const EwbGenerateAndPrint = () => {
    const { token, companyId } = useAuth();
    console.log("token",token)
    console.log("companyId",companyId )
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
    //actFromStateCode: "36",
    toGstin: "",
    toTrdName: "",
    toAddr1: "",
    toAddr2: "",
    toPlace: "",
    toPincode: 500025,
    toStateCode: 36,
    //actToStateCode: "36",
    totInvValue: 0,
    totalValue: 0,
    cgstValue: 0,
    sgstValue: 0,
    igstValue: 0,
    cessValue: 0,
    cessNonAdvolValue: 0,
    otherValue: 0,
    transMode: 1,
    transDistance:  350,
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
        productDesc:invoiceData.invoiceProductDetails.description || "Machinery Item",
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
      fromStateCode: parseInt(invoiceData.clients?.masterStateNames?.stateCode) || 36,
      actFromStateCode:invoiceData.clients?.masterStateNames?.stateCode || "36",
   
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
  setError("");
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
      setApiResponse(res.data); // Store failure response also
      setError(res.data.message || "E-Way Bill generation failed");
    }
  } catch (err) {
    const errorData = err.response?.data || {
      message: err.message || "Unknown error"
    };

    setApiResponse(errorData); // Save entire error response
    setError(errorData.message);
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
  <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px", fontFamily: "sans-serif" }}>
    <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Generate E-Way Bill</h1>

    <form onSubmit={handleSubmit}>
      {/* Main Fields Layout - CSS Grid for Side-by-Side Alignment */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", 
          gap: "16px",
          marginBottom: "30px"
        }}
      >
        {Object.keys(formData)
          .filter(key => key !== "itemList")
          .map(key => (
            <div key={key} style={{ display: "flex", flexDirection: "column" }}>
              <label
                style={{
                  fontWeight: "bold",
                  marginBottom: "6px",
                  fontSize: "14px",
                  color: "#333"
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
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box"
                }}
              />
            </div>
          ))}
      </div>

      <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "30px 0" }} />

      {/* Item List Header */}
      <h3 style={{ marginBottom: "15px" }}>Items</h3>

      {formData.itemList?.map((item, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #ddd",
            padding: "20px",
            marginBottom: "20px",
            borderRadius: "6px",
            background: "#fdfdfd"
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: "15px" }}>Item {index + 1}</h4>

          {/* Item Fields Layout - Side-by-Side Sub Grid */}
          <div 
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", 
              gap: "12px",
              marginBottom: "15px"
            }}
          >
            {Object.keys(item).map(field => (
              <div key={field} style={{ display: "flex", flexDirection: "column" }}>
                <label
                  style={{
                    fontWeight: "bold",
                    marginBottom: "5px",
                    fontSize: "13px",
                    color: "#555"
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
                    borderRadius: "4px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Form Action Buttons */}
      <div style={{ marginTop: "20px" }}>
        <button
          type="button"
          onClick={addItem}
          style={{
            marginRight: "12px",
            padding: "10px 20px",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Add Item
        </button>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1890ff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Generating..." : "Generate E-Way Bill"}
        </button>
      </div>
    </form>

    {/* API Success Response Layout */}
{apiResponse && (
  <>
    {apiResponse.status === "SUCCESS" ? (
      <>
        <p>
          <strong>EWB No:</strong>{" "}
          {apiResponse?.response?.ewbNo}
        </p>

        <p style={{ marginBottom: 15 }}>
          <strong>Valid Upto:</strong>{" "}
          {apiResponse?.response?.validUpto}
        </p>

        <button
          onClick={downloadPDF}
          style={{
            padding: "8px 15px",
            backgroundColor: "#52c41a",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Download PDF
        </button>

        {pdfMessage && (
          <p style={{ marginTop: 10, color: "#555" }}>
            {pdfMessage}
          </p>
        )}
      </>
    ) : (
      <>
        <h4 style={{ color: "#cf1322" }}>
          E-Way Bill Generation Failed
        </h4>

        <pre
          style={{
            background: "#fff1f0",
            border: "1px solid #ffa39e",
            padding: "15px",
            borderRadius: "4px",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: "#cf1322"
          }}
        >
          {JSON.stringify(apiResponse, null, 2)}
        </pre>
      </>
    )}
  </>
)}
    {/* API Error Layout */}
    {error && (
      <div style={{ color: "#ff4d4f", marginTop: 20, fontWeight: "bold" }}>
        {error}
      </div>
    )}
  </div>
);
};

export default EwbGenerateAndPrint;