import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from "react-router-dom";
import { useAuth } from "../../components/AuthContext";
// LocalStorage Keys
const EWAY_KEY = "iris_eway_session";
const LOGIN_RESPONSE_KEY = 'iris_login_data';
const LATEST_EWB_KEY = 'latestEwbData';
const EWB_HISTORY_KEY = 'ewbHistory';
const STORAGE_KEY2 = "iris_einvoice_irn_ewabill";


const EwbGenerateAndPrint = () => {
    const { token, companyId } = useAuth();
    console.log("token",token)
    console.log("companyId",companyId )
    // Get values directly from localStorage
    const [selectedEnv, setSelectedEnv] = useState(
      localStorage.getItem("connectionType") || "DEFAULT"
    );
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
    fromPincode: null,
    fromStateCode: null,
    actFromStateCode: null,
    toGstin: "",
    toTrdName: "",
    toAddr1: "",
    toAddr2: "",
    toPlace: "",
    toPincode: null,
    toStateCode: null,
    actToStateCode: null,
    totInvValue: 0,
    totalValue: 0,
    cgstValue: 0,
    sgstValue: 0,
    igstValue: 0,
    cessValue: 0,
    cessNonAdvolValue: 0,
    otherValue: 0,
    transMode: 1, // by default mode 1
    transDistance: "",
    transDocDate: null,
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
  const [showPdf, setShowPdf] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);


    // Read latest values from localStorage
    const currentConnectionType =
      localStorage.getItem("connectionType") || "DEFAULT";
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
    "Content-Type": "application/json",
      ConnectionType: currentConnectionType,
  });

  // 3. Dynamic Structural Data Binding
  useEffect(() => {
    const sessionData = safeParse(sessionStorage.getItem(EWAY_KEY));
    
    const parsedToken = sessionData?.token || sessionData?.fullResponse?.response?.token || null;
    const parsedCompanyId = sessionData?.fullResponse?.response?.companyid || null;
    const parsedGstin = invoiceData.gstin || sessionData?.userGstin || null;

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
        productName: item.description ? item.description.substring(0, 50) : null,
        productDesc:invoiceData.invoiceProductDetails.description || null,
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
     //docNo: dynamicId,
     docNo: invoiceData.invoiceNumber || null,
     docDate: invoiceData.deliveryNoteDate || null, 
      
      // --- SELLER (SWASTIK MACHINERY CORPORATION) ---
      fromGstin: parsedGstin,
      fromTrdName: invoiceData.company_Name || null,
      dispatchFromGstin: parsedGstin,
      dispatchFromTradeName: invoiceData.company_Name || null,
      fromAddr1: invoiceData.company_Address || null,
      fromAddr2: invoiceData.company_City || null,
      fromPlace: invoiceData.company_City || null,
      fromPincode: parseInt(invoiceData.company_PINCode) || null,
      fromStateCode: parseInt(invoiceData.clients?.masterStateNames?.stateCode) || null,
      actFromStateCode:invoiceData.clients?.masterStateNames?.stateCode || null,
   
      // --- BUYER (buyerClients Structure mapping) ---
      toGstin: formattedBuyerGstin,
      toTrdName: invoiceData.buyerClients?.companyName || null,
      toAddr1: invoiceData.buyerClients?.officeAddress || null,
      toAddr2: invoiceData.buyerClients?.poBox || null,
      toPlace: invoiceData.buyerClients?.stateName || null,
      toPincode: parseInt(invoiceData.buyerClients?.poBox) || null,
      toStateCode: parseInt(invoiceData.buyerClients?.masterStateNames?.stateCode) || null,
      actToStateCode: invoiceData.buyerClients?.masterStateNames?.stateCode || null,

   
      // --- MATHEMATICAL VALUATIONS ---
      totalValue: aggregatedTaxable,
      cgstValue: aggregatedCgst,
      sgstValue: aggregatedSgst,
      igstValue: 0.00,
      totInvValue: aggregatedInvoiceTotal,

      // --- TRANSPORTATION ---
      transDocDate: invoiceData.deliveryNoteDate || null,
      transDocNo: invoiceData.transporterDocNo || null,
      transporterId: invoiceData.transporterID || null,
      transDistance: invoiceData.distance || null,
      transporterName: invoiceData.transporterName || null,
      vehicleNo: formattedVehicleNo,

      // --- BALANCED ITEM LINE ENTRIES ---
      itemList: mappedItems,
      
      companyId: "null",
      //companyId: Number(parsedCompanyId),
      userGstin: parsedGstin,
    }));
  }, []);
/// for  Naming convention of items//
const formatItemLabel = (field) => {
  switch (field) {
    case "productName":
      return "Product Name";
    case "productDesc":
      return "Product Description";
    case "hsnCode":
      return "HSN Code";
    case "quantity":
      return "Quantity";
    case "qtyUnit":
      return "Quantity Unit";
    case "taxableAmount":
      return "Taxable Amount";
    case "sgstRate":
      return "SGST Rate (%)";
    case "cgstRate":
      return "CGST Rate (%)";
    case "igstRate":
      return "IGST Rate (%)";
    case "cessRate":
      return "CESS Rate (%)";
    case "cessNonAdvol":
      return "CESS Non Advol";
    case "iamt":
      return "IGST Amount";
    case "camt":
      return "CGST Amount";
    case "samt":
      return "SGST Amount";
    case "csamt":
      return "CESS Amount";
    case "txp":
      return "Tax Type";
    default:
      return field;
  }
};

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
      // Automatically save generated IRN details to DB
  const saved = await handleSaveToDB(res.data);
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

const handleSaveToDB = async (generatedResponse = apiResponse) => {
  if (!generatedResponse) {
    alert("No data available to save.");
    return false;
  }

  const apiData = generatedResponse.response || generatedResponse;

  // Prefer DB key from invoice if available
  const invoiceData = JSON.parse(
    localStorage.getItem("selectedInvoice") || "{}"
  );

  const dynamicId =
    invoiceData?.keyID ||
    receivedData?.id ||
    location.state?.pid;

  if (!dynamicId) {
    alert("Invoice ID not found.");
    return false;
  }

  const putPayload = {
    id: Number(dynamicId),

    eWayBillNumber: String(apiData.ewbNo || ""),

    docNo: String(apiData.docNo || ""),

    docDate: apiData.docDate || "",

    ewbDate: apiData.ewbDate || "",

    vehicleNo: apiData.vehicleNo || "",

    ewayQrCode: apiData.qrCode || "",

    barcode: apiData.barcode || ""
  };

  console.log("PUT Payload:", putPayload);

  try {
    setLoading(true);

    const res = await fetch(
      "https://einvoice.fcssoftwares.com/api/OrderList/UpdateEWBetailsToInvoice",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "ConnectionType": currentConnectionType || "Online",
          ...(token && {
            Authorization: `Bearer ${token}`
          })
        },
        body: JSON.stringify(putPayload)
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to update DB");
    }

    const data = await res.json();

    console.log("Database updated successfully:", data);

    alert(
      `✅ E-Way Bill Generated Successfully!\n\n🎉 Invoice updated in DB successfully!`
    );

    return true;
  } catch (error) {
    console.error("Database Save Error:", error);

    alert(
      `⚠ E-Way Bill generated successfully, but DB update failed.\n\n${error.message}`
    );

    return false;
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
     link.download = `EWayBill_${ewbNo}.pdf`;;

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
  
const formatLabel = (text) => {
  return text
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

return (
  <>
    <form onSubmit={handleSubmit}>
      {/* Main Fields Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "16px",
          marginBottom: "30px",
        }}
      >
        {/* Auto Generated Fields */}
        {Object.keys(formData)
          .filter(
            (key) =>
              ![
                "itemList",
                "invType",
                "transMode",
                "vehicleType",
              ].includes(key)
          )
          .map((key) => (
            <div
              key={key}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <label
                style={{
                  fontWeight: "bold",
                  marginBottom: "6px",
                  fontSize: "14px",
                  color: "#333",
                  textTransform: "capitalize",
                }}
              >
                {formatLabel(key)}
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
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}

        {/* Invoice Type */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            style={{
              fontWeight: "bold",
              marginBottom: "6px",
              fontSize: "14px",
              color: "#333",
            }}
          >
            Invoice Type
          </label>

          <select
            name="invType"
            value={formData.invType || ""}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          >
            <option value="">Select Invoice Type</option>
            <option value="B2B">B2B</option>
            <option value="B2C">B2C</option>
            <option value="SEZWP">SEZWP</option>
            <option value="SEZWOP">SEZWOP</option>
            <option value="EXPWP">EXPWP</option>
            <option value="EXPWOP">EXPWOP</option>
          </select>
        </div>

        {/* Transport Mode */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            style={{
              fontWeight: "bold",
              marginBottom: "6px",
              fontSize: "14px",
              color: "#333",
            }}
          >
            Transport Mode
          </label>

          <select
            name="transMode"
            value={formData.transMode || ""}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          >
            <option value="1">1-Road</option>
            <option value="2">2-Rail</option>
            <option value="3">3-Air</option>
            <option value="4">4-Ship</option>
          </select>
        </div>

        {/* Vehicle Type */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            style={{
              fontWeight: "bold",
              marginBottom: "6px",
              fontSize: "14px",
              color: "#333",
            }}
          >
            Vehicle Type
          </label>

          <select
            name="vehicleType"
            value={formData.vehicleType || ""}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          >
            <option value="">Select Vehicle Type</option>
            <option value="R">Regular</option>
            <option value="O">ODC</option>
          </select>
        </div>
      </div>

      <hr
        style={{
          border: "0",
          borderTop: "1px solid #eee",
          margin: "30px 0",
        }}
      />

      {/* Item List */}
      <h3 style={{ marginBottom: "15px" }}>Items</h3>

    {formData.itemList?.map((item, index) => (
  <div
    key={index}
    style={{
      border: "1px solid #ddd",
      padding: "20px",
      marginBottom: "20px",
      borderRadius: "6px",
      background: "#fdfdfd",
    }}
  >
    <h4 style={{ marginTop: 0, marginBottom: "15px" }}>
      Item {index + 1}
    </h4>

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "12px",
      }}
    >
      {Object.keys(item).map((field) => (
        <div
          key={field}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <label
            style={{
              fontWeight: "bold",
              marginBottom: "5px",
              fontSize: "13px",
              color: "#555",
            }}
          >
            {formatItemLabel(field)}
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
              boxSizing: "border-box",
            }}
          />
        </div>
      ))}
    </div>
  </div>
))}

      {/* Submit Button */}
      <div style={{ marginTop: "20px" }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1890ff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate E-Way Bill"}
        </button>
      </div>
      {/* Download PDF Button - Show only after successful generation */}
{apiResponse?.status === "SUCCESS" &&
  apiResponse?.response?.ewbNo && (
    <div style={{ marginTop: "15px" }}>
      <button
        type="button"
        onClick={downloadPDF}
        style={{
          padding: "10px 20px",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Download E-Way Bill PDF
      </button>
    </div>
)}
    </form>
  </>
);
};

export default EwbGenerateAndPrint;