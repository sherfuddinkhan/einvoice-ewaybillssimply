import React, { useState, useEffect,useCallback  } from "react";
import axios from "axios";
import { useAuth } from "../../components/AuthContext";
import { useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { jsPDF } from "jspdf";

const colors = {
  primary: "#1A73E8",
  success: "#34A853",
  danger: "#EA4335",
  background: "#F8F9FA",
};

const tableStyles = {
  container: { padding: "20px", background: colors.background, minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif" },
  header: { textAlign: "center", color: colors.primary, fontSize: "28px", marginBottom: "30px", fontWeight: 500 },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: "30px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderRadius: "8px", overflow: "hidden" },
  th: { background: "#E3F2FD", color: colors.primary, textAlign: "left", padding: "16px", fontWeight: 600, fontSize: "16px" },
  td: { padding: "14px 16px", borderBottom: "1px solid #eee", verticalAlign: "top" },
  labelText: { fontWeight: "600", color: "#333", fontSize: "14px", display: "block", marginBottom: "8px" },
  input: { width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", boxSizing: "border-box" },
  inputFocus: { borderColor: colors.primary, boxShadow: "0 0 0 3px rgba(26,115,232,0.2)", outline: "none" },
  select: { width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" },
  btnGreen: { padding: "12px 24px", background: colors.success, color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" },
  btnRed: { padding: "8px 16px", background: colors.danger, color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" },
  btnGenerate: (loading, token) => ({
    padding: "20px 100px",
    fontSize: "22px",
    fontWeight: "bold",
    background: loading || !token ? "#999" : colors.primary,
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: loading || !token ? "not-allowed" : "pointer",
    boxShadow: "0 10px 30px rgba(26,115,232,0.4)",
  }),
  itemCard: { background: "#f8fbff", border: "1px solid #d0e4ff", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" },
  twoColGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" },
  col: { display: "flex", flexDirection: "column", gap: "16px" },
  itemFooter: { marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px dashed #bbb" },
  responseBox: (status) => ({
    background: "#1e1e1e",
    color: status === "SUCCESS" ? "#A8FFBF" : "#FFB4A9",
    padding: "24px",
    borderRadius: "10px",
    fontFamily: "monospace",
    fontSize: "13px",
    overflow: "auto",
    border: `1px solid ${status === "SUCCESS" ? colors.success : colors.danger}`,
  }),
};

// Storage Keys
const STORAGE_KEY = "iris_einvoice_response";
const STORAGE_KEY1 = "iris_einvoice_shared_config";
const STORAGE_KEY2 = "iris_einvoice_irn_ewabill";
const EINV_DOC_KEY = "iris_einv_doc_map"; // New Storage Key added here!

const LAST_GENERATED_ID_KEY = "iris_last_generated_id";
const LAST_DOC_DETAILS_KEY = "iris_last_used_doc_details";
const LAST_IRN_KEY = "iris_last_used_irn";
const LAST_SIGNED_QR_JWT_KEY = "iris_last_signed_qr_jwt";
const LAST_EWB_DETAILS_KEY = "iris_last_ewb_details";

// Accessible Components
const LabeledInput = ({ label, id, value, onChange, type = "text", step }) => {
  const [focused, setFocused] = useState(false);
  return (
    <label htmlFor={id}>
      <span style={tableStyles.labelText}>{label}</span>
      <input
        id={id}
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
        style={{ ...tableStyles.input, ...(focused ? tableStyles.inputFocus : {}) }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </label>
  );
};

const LabeledSelect = ({ label, id, value, options, onChange }) => (
  <label htmlFor={id}>
    <span style={tableStyles.labelText}>{label}</span>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} style={tableStyles.select}>
      {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </label>
);

const createBasePayload = (invoiceData, dynamicId) => {
  /* =======================================================
      1. SETUP CONSTANTS & LOGIC
  ======================================================= */
  const sellerStateCode = "01";
  
  // Logic to ensure Buyer GSTIN and State Code are synced
  const buyerGstin = (invoiceData?.gstin?.length === 15) 
    ? invoiceData.gstin 
    : "02AAACI9260R002";

  const buyerStateCode = buyerGstin.substring(0, 2);
  const isInterState = sellerStateCode !== buyerStateCode;

  /* =======================================================
      2. HANDLE PRODUCT LIST
  ======================================================= */
  const productList = invoiceData?.invoiceProductDetails?.length > 0
    ? invoiceData.invoiceProductDetails
    : [{
        hsnCode: "73041190",
        itemName: "SEAMLESS STEEL TUBE 10X2 -U71889903",
        quantity: 1,
        totalAmount: 3322.45, // Taxable Value
        igstAmount: 930.28,
        cgstAmount: 0,
        sgstAmount: 0,
        gstPer: 28,
        igstPer: 28,
        cgstPer: 0,
        sgstPer: 0,
        uom: "NOS",
        discount: 0
      }];

  /* =======================================================
      3. TOTALS CALCULATION
  ======================================================= */
  const totTxVal = Number(productList.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0).toFixed(2));
  const totIgst = Number(productList.reduce((sum, item) => sum + Number(item.igstAmount || 0), 0).toFixed(2));
  const totCgst = Number(productList.reduce((sum, item) => sum + Number(item.cgstAmount || 0), 0).toFixed(2));
  const totSgst = Number(productList.reduce((sum, item) => sum + Number(item.sgstAmount || 0), 0).toFixed(2));
  
  const otherCharges = 20; // Based on your provided JSON
  const totalDiscount = 10; // Based on your provided JSON
  
  // Total Invoice Value = Taxable + Taxes + Other Charges - Discount
  const totalInvVal = Number((totTxVal + totIgst + totCgst + totSgst + otherCharges - totalDiscount).toFixed(2));

  /* =======================================================
      4. RETURN FORMATTED PAYLOAD
  ======================================================= */
/**
 * REWRITE: GST/E-Way Bill Payload Generator
 * logic: Handles dynamic trnTyp and resets address blocks to null when not required.
 */

// 1. Logic Helpers (Place these before the return)
const selectedTrnTyp = invoiceData?.transactionType || "REG"; // Options: REG, BOS, BFP, COMB
const showDispatch = ["BFP", "COMB"].includes(selectedTrnTyp);
const showShipTo = ["BOS", "COMB"].includes(selectedTrnTyp);

return {
  /* ======================================================
      BASIC DETAILS
  ====================================================== */
  id: String(dynamicId || "1001"),
  userGstin: "01AAACI9260R002",
  pobCode: null,
  supplyType: "O",
  ntr: isInterState ? "Inter" : "Intra",
  docType: "RI",
  catg: "B2B",
  dst: "O",
  trnTyp: selectedTrnTyp,
  no: invoiceData?.purchaseOrder || "AG/03-09/4565",
  dt: "28-03-2021",
  refinum: null,
  refidt: null,
  pos: buyerStateCode,
  diffprcnt: null,
  etin: null,
  rchrg: "N",

  /* ======================================================
      SELLER DETAILS
  ====================================================== */
  sgstin: "01AAACI9260R002",
  strdNm: "TEST Company",
  slglNm: "TEST PROD",
  sbnm: "Testing",
  sflno: "ABC",
  sloc: "BANGALOR32",
  sdst: "BENGALURU",
  sstcd: sellerStateCode,
  spin: "192233",
  sph: "9876543210",
  sem: "abc123@gmail.com",

  /* ======================================================
      BUYER DETAILS
  ====================================================== */
  bgstin: buyerGstin,
  btrdNm: "TEST ENTERPRISES",
  blglNm: "TEST PRODUCT",
  bbnm: "ABCD12345",
  bflno: "abc",
  bloc: "Jijamat",
  bdst: "BANGALORE",
  bstcd: buyerStateCode,
  bpin: "174001",
  bph: "9898981111",
  bem: "abc123@gmail.com",

  /* ======================================================
      DISPATCH DETAILS (Conditional)
  ====================================================== */
  dgstin: showDispatch ? "29ABCDE1234F1Z5" : null,
  dtrdNm: showDispatch ? "ABC Traders" : null,
  dlglNm: showDispatch ? "ABC Traders Private Limited" : null,
  dbnm: showDispatch ? "ABC Tower" : null,
  dflno: showDispatch ? "2nd Floor" : null,
  dloc: showDispatch ? "MG Road" : null,
  ddst: showDispatch ? "Bengaluru Urban" : null,
  dstcd: showDispatch ? "29" : null,
  dpin: showDispatch ? "560001" : null,
  dph: showDispatch ? "9876543210" : null,
  dem: showDispatch ? "dispatch@abctraders.com" : null,

  /* ======================================================
      SHIP TO DETAILS (Conditional)
  ====================================================== */
  togstin: showShipTo ? "27XYZDE5678K1Z2" : null,
  totrdNm: showShipTo ? "XYZ Enterprises" : null,
  tolglNm: showShipTo ? "XYZ Enterprises LLP" : null,
  tobnm: showShipTo ? "XYZ Business Park" : null,
  toflno: showShipTo ? "5th Floor" : null,
  toloc: showShipTo ? "Andheri East" : null,
  todst: showShipTo ? "Mumbai" : null,
  tostcd: showShipTo ? "27" : null,
  topin: showShipTo ? "400069" : null,
  toph: showShipTo ? "9123456780" : null,
  toem: showShipTo ? "warehouse@xyzenterprises.com" : null,

  /* ======================================================
      EXPORT & TOTALS
  ====================================================== */
  sbnum: null,
  sbdt: null,
  port: null,
  expduty: 0,
  cntcd: "IN",
  forCur: "INR",
  invForCur: 0,
  taxSch: "GST",
  totinvval: totalInvVal,
  totdisc: totalDiscount,
  totfrt: 0,
  totins: 0,
  totpkg: 0,
  totothchrg: otherCharges,
  tottxval: totTxVal,
  totiamt: totIgst,
  totcamt: totCgst,
  totsamt: totSgst,
  totcsamt: 0,
  totstcsamt: 0,
  rndOffAmt: 0,

  /* ======================================================
      PAYMENT DETAILS (Cleaned)
  ====================================================== */
  payNm: "ABC Industries Pvt Ltd",
  acctdet: "50200012345678", 
  mode: "NEFT",
  ifsc: "HDFC0001234",
  paidAmt: Number(totalInvVal),
  balAmt: 0,
  payDueDt: "28-03-2021",

   /* ======================================================
      TRANSPORT DETAILS (Fixed Schema Case & Types)
  ====================================================== */
  subSplyTyp: "1", // Changed to lowercase and integer 1
  subSplyDes: "Supply", // Changed to lowercase
  transMode: String(invoiceData?.transportMode || "1"),
  vehTyp: invoiceData?.vehicleType || "R",
  transDist: Number(invoiceData?.transportDistance || 100),
  transName: invoiceData?.transporterName || "FastTrack Logistics",
  transDocNo: invoiceData?.transportDocNo || "DOC001",
  transDocDate: "28-03-2021",
  vehNo: invoiceData?.vehicleNo || "KA01AB1234",


  /* ======================================================
      SYSTEM FLAGS
  ====================================================== */
  fy: "2025-26",
  tcsrt: 0,
  tcsamt: 0,
  pretcs: 0,
  genIrn: true,
  genewb: "Y",
  signedDataReq: true,

  /* ======================================================
      ITEM LIST
  ====================================================== */
  itemList: productList.map((item, index) => {
    const txVal = Number(item.totalAmount || 0);
    // Note: If 28% triggers a warning for 2026 dates, change to 18
    const itemRate = Number(item.gstPer || 18); 

    return {
      num: String(index + 1).padStart(5, "0"),
      hsnCd: item.hsnCode || "73041190",
      prdNm: item.itemName || "SEAMLESS STEEL TUBE",
      qty: Number(item.quantity || 1),
      unit: item.uom || "NOS",
      unitPrice: Number(item.totalAmount),
      assAmt: txVal,
      txval: txVal,
      rt: itemRate,
      irt: isInterState ? itemRate : 0,
      crt: !isInterState ? (itemRate / 2) : 0,
      srt: !isInterState ? (itemRate / 2) : 0,
      iamt: isInterState ? Number(item.igstAmount || 0) : 0,
      camt: !isInterState ? Number(item.cgstAmount || 0) : 0,
      samt: !isInterState ? Number(item.sgstAmount || 0) : 0,
      itmVal: Number(
        (txVal + (isInterState 
          ? Number(item.igstAmount || 0) 
          : Number(item.cgstAmount || 0) + Number(item.sgstAmount || 0)
        )).toFixed(2)
      ),
      isServc: "N",
      orgCntry: "IN"
    };
  }),

  invOthDocDtls: [{ url: "www.google.com", docs: "Tax Invoice", infoDtls: "System Generated" }],
  invRefPreDtls: [{ oinum: null, oidt: null, othRefNo: null }],
  invRefContDtls: [{ raref: null, radt: null, tendref: null, contref: null, extref: null, projref: null, poref: null, porefdt: null }]
};
};
const GenerateAndPrintEinvoice = () => {
  const { token, setLastInvoice } = useAuth();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [template, setTemplate] = useState("STANDARD");
  const [pdfMessage, setPdfMessage] = useState("");
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [invoiceApiData, setInvoiceApiData] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [pdfData, setPdfData] = useState(null);
 const location = useLocation();


// =========================
// GET DATA FROM PREVIOUS PAGE
// =========================

const receivedData = location.state || {};

console.log("Received Data:", receivedData);

// =========================
// EXTRACT VALUES
// =========================

const invoiceData = receivedData.invoiceData || {};

const dynamicId = receivedData.id || invoiceData.pid;

console.log("Dynamic ID:", dynamicId);


console.log(
  "Invoice Product Details:",
  invoiceData?.invoiceProductDetails
);

  console.log("Received Data1:",location.state.invoiceData.invoiceProductDetails);

  // --- Core Calculation Logic to ensure consistency ---
  const recalculateTotals = (currentPayload, idx, fieldChanged, value) => {
    const items = [...currentPayload.itemList];

    // Step 1: Update the specific item field if a change occurred
    if (idx !== undefined && fieldChanged) {
      items[idx] = { ...items[idx], [fieldChanged]: value };
    }
    let totalTaxableValue = 0;
    let totalIGST = 0;

    // Step 2: Recalculate Item-Level Tax & Total for ALL items
    const updatedItems = items.map(item => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.unitPrice) || 0;
      const rate = (Number(item.irt) || 0) / 100;

      // Taxable Value (Quantity * Price), rounded to 2 decimals
      const txval = Number((qty * price).toFixed(2));

      // IGST Amount (T-Value * Rate), rounded to 2 decimals
      const iamt = Number((txval * rate).toFixed(2));

      // Item Value (T-Value + IGST)
      const itmVal = Number((txval + iamt).toFixed(2));
      // Aggregate for invoice totals
      totalTaxableValue += txval;
      totalIGST += iamt;

      // Return the updated item object
      return {
        ...item,
        txval: txval,
        sval: txval,
        iamt: iamt,
        itmVal: itmVal,
      };
    });

    // Step 3: Calculate Invoice-Level Totals
    const disc = Number(currentPayload.totdisc) || 0;
    const othchrg = Number(currentPayload.totothchrg) || 0;

    const totTxval = Number(totalTaxableValue.toFixed(2));
    const totIamt = Number(totalIGST.toFixed(2));
    // Calculate Total Invoice Value: T-Value + IGST + Other Charges - Discount
    const preRoundTotal = totTxval + totIamt + othchrg - disc;
    const totInvVal = Number(preRoundTotal.toFixed(2));

    // Step 4: Update the payload state with new calculated values
    return {
      ...currentPayload,
      itemList: updatedItems,
      tottxval: totTxval,
      totiamt: totIamt,
      totinvval: totInvVal,
      // Ensure other non-IGST tax totals are zeroed out if not used
      totcamt: 0,
      totsamt: 0,
      totcsamt: 0,
      totstcsamt: 0,
    };
  };
  // --- End Core Calculation Logic ---

    const [payload, setPayload] = useState(() => {
  const basePayload = createBasePayload(invoiceData, dynamicId);
  return recalculateTotals(basePayload);
});

 
  const setField = (field, value) => setPayload((prev) => ({ ...prev, [field]: value }));
  const updateItem = (idx, field, value) => {
    // Calls recalculateTotals with the updated field, which returns the new payload
    setPayload((prev) => recalculateTotals(prev, idx, field, value));
  };
  const addItem = () => {
    setPayload((prev) => {
      // Complete default item structure for new items
      const newItem = {
        "num": String(prev.itemList.length + 1).padStart(5, "0"),
        "hsnCd": "84713010", // Example HSN for new item
        "prdNm": "New Service/Product",
        "qty": 1,
        "unit": "NOS",
        "unitPrice": 100,
        "irt": 18, // Default to 18%
        "rt": 18,

        // Calculated fields (must be initialized to 0)
        "txval": 0, "sval": 0, "iamt": 0, "itmVal": 0,

        // Other default/placeholder fields
        "disc": 0, "othchrg": 0, "camt": 0, "csamt": 0, "srt": 0, "crt": 0, "stcsamt": 0,
        "cesNonAdval": 0, "stCesNonAdvl": 0, "freeQty": 0, "preTaxVal": 0, "isServc": null,
        "barcde": null, "prdSlNo": null, "txp": null, "bchnm": null, "bchExpDt": null,
        "bchWrDt": null, "ordLineRef": null, "orgCntry": null,
        // Generic item fields
        "itmgen1": null, "itmgen2": null, "itmgen3": null, "itmgen4": null, "itmgen5": null,
        "itmgen6": null, "itmgen7": null, "itmgen8": null, "itmgen9": null, "itmgen10": null,
        "invItmOtherDtls": []
      };

      const updatedPayload = { ...prev, itemList: [...prev.itemList, newItem] };
      // Recalculate all totals based on the new list (no specific field change needed)
      return recalculateTotals(updatedPayload);
    });
  };
  const removeItem = (idx) => {
    setPayload((prev) => {
      const items = prev.itemList.filter((_, i) => i !== idx);
      const updatedPayload = { ...prev, itemList: items };
      // Recalculate all totals based on the filtered list
      return recalculateTotals(updatedPayload);
    });
  };
  // ---

  // New function to store document number and einvId
  const storeEinv = (apiResponse) => {
    // Note: 'payload' is accessible here via closure, which is okay for this component scope.
    // However, if we were aiming for a fully pure function, payload should be passed in.
    if (!apiResponse?.id || !payload?.no) return;
    const entry = {
      docNo: payload.no?.trim(), // Document Number
      einvId: String(apiResponse.id), // Einv ID
      createdAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem(EINV_DOC_KEY)) || [];
    // Remove duplicates based on docNo or einvId
    const filtered = existing.filter(e => e.docNo !== entry.docNo && e.einvId !== entry.einvId);
    localStorage.setItem(EINV_DOC_KEY, JSON.stringify([...filtered, entry]));
  };

  const saveResponseForAutoPopulate = (data) => {
    if (!data?.response) return;
    const responseData = data.response;
    if (responseData.id) {
      try {
        localStorage.setItem(LAST_GENERATED_ID_KEY, String(responseData.id));
        setPayload(prev => ({ ...prev, lastGeneratedId: String(responseData.id) }));
      } catch (e) {
        console.warn('Could not save generated id to localStorage', e);
      }
    }
    const sharedData = JSON.parse(localStorage.getItem(STORAGE_KEY1) || '{}');
    sharedData.companyId = '24';
    sharedData.token = token;
    sharedData.irn = responseData.irn;
    sharedData.companyUniqueCode = payload.userGstin;
    sharedData.lastGeneratedResponse = responseData;
    sharedData.lastGeneratedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY1, JSON.stringify(sharedData));

    localStorage.setItem(LAST_DOC_DETAILS_KEY, JSON.stringify({
      docNum: payload.no.trim(),
      docDate: payload.dt.trim(),
      docType: payload.docType,
      timestamp: new Date().toISOString()
    }));

    localStorage.setItem(LAST_IRN_KEY, JSON.stringify({ irn: responseData.irn, timestamp: new Date().toISOString() }));
    if (responseData.signedQrCode) {
      localStorage.setItem(LAST_SIGNED_QR_JWT_KEY, responseData.signedQrCode);
    }
    localStorage.setItem(LAST_EWB_DETAILS_KEY, JSON.stringify({
      ewbNo: responseData.ewbNo || '',
      ewbDate: responseData.ewbDate || '',
      timestamp: new Date().toISOString()
    }));
    setLastInvoice?.(responseData.irn, payload.userGstin, payload.no, payload.dt, payload.docType);
  };
  //////////////////////
 
  /* ====================================================
     FETCH INVOICE
  ==================================================== */

 const fetchInvoiceData = useCallback(async () => {
  try {
    setLoadingInvoice(true);
    const res = await axios.get(`http://localhost:3001/api/invoice/${dynamicId}`);

    // res.data is the axios response
    // res.data.data is the { success, data } from your Express server
    const actualInvoiceData = res.data.data; 
    // This gives you a clean, non-reactive snapshot of the data
console.log("Actual Fetched Data Snapshot:", JSON.parse(JSON.stringify(actualInvoiceData)));
    setInvoiceApiData(actualInvoiceData);

    // Use createBasePayload to transform the raw API data into the 
    // E-Invoice schema before recalculating
    const formattedPayload = createBasePayload(actualInvoiceData, dynamicId);
    
    setPayload(recalculateTotals(formattedPayload));

  } catch (err) {
    setError(err.message || "Error fetching invoice");
  } finally {
    setLoadingInvoice(false);
  }
}, [dynamicId]);

useEffect(() => {
  if (dynamicId) {
    fetchInvoiceData();
  }
}, [dynamicId, fetchInvoiceData]);

  ////////////////////



  const handleGenerate = async () => {
  if (!token) {
    alert("Login required!");
    return;
  }

  setLoading(true);
  setResponse(null);

  try {
    // ✅ IMPORTANT: compute updated payload BEFORE API call
    const updatedPayload = recalculateTotals(payload);

    // optional UI sync
    setPayload(updatedPayload);

    const res = await fetch("http://localhost:3001/proxy/irn/addInvoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token,
        companyId: "24",
        product: "ONYX",
      },
      body: JSON.stringify(updatedPayload),
    });

    const data = await res.json();

    // ✅ STORE RESPONSE FOR UI
    setResponse(data);
    setPdfData(data?.response || null);

    console.log("API RESPONSE:", data);

    // =========================
    // SUCCESS FLOW
    // =========================
    if (data?.status === "SUCCESS" && data?.response?.irn) {
      saveResponseForAutoPopulate(data);
      storeEinv(data.response);

      localStorage.setItem(STORAGE_KEY2, JSON.stringify(data));

      alert(
        `IRN Generated Successfully!\nIRN: ${data.response.irn}\nAck No: ${data.response.ackNo}`
      );
    }

    // =========================
    // FAILURE FLOW
    // =========================
    else if (data?.status === "FAILURE") {
      const errorMsg = data?.errors?.[0]?.msg || "Unknown error";
      alert(`Generation Failed: ${errorMsg}`);
    }

  } catch (err) {
    console.error("Generate Error:", err);

    setResponse({
      status: "ERROR",
      error: err.message,
    });

    alert("Network error: " + err.message);
  } finally {
    setLoading(false);
  }
};
 
const downloadPDF = async () => {
    console.log("CLICKED");
  console.log("payload:", payload);
  console.log("lastGeneratedId:", payload?.lastGeneratedId);
  if (!payload?.lastGeneratedId) return;

  try {
    setPdfMessage("Generating PDF...");

    const resp = await axios.get(
      `http://localhost:3001/proxy/einvoice/print`,
      {
        params: {
          template: template,
          id: payload.lastGeneratedId,
        },
        headers: {
          "X-Auth-Token": token,
          companyId: "24",
          product: "ONYX",
        },
        responseType: "blob",
      }
    );

    const blob = new Blob([resp.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `EInvoice_${payload.lastGeneratedId}.pdf`;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

    setPdfMessage("PDF downloaded successfully.");
  } catch (error) {
    console.error("PDF Download Error:", error);
    setPdfMessage("Failed to download PDF.");
  }
};



const ApiResponseView = ({ apiResponse }) => {
  if (!apiResponse) return null;

  const data = apiResponse?.response || apiResponse;

  // =========================
  // DECODE JWTs
  // =========================

  const decodedSignedInvoice = data?.signedInvoice
    ? jwtDecode(data.signedInvoice)
    : null;

  const decodedSignedQrCode = data?.signedQrCode
    ? jwtDecode(data.signedQrCode)
    : null;

  // =========================
  // DOWNLOAD PDF
  // =========================
  const downloadInvoicePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("E-INVOICE / E-WAY BILL", 60, 10);

    // ================= BASIC API DATA =================
    doc.setFontSize(10);

    doc.text(`Status: ${apiResponse?.status || "-"}`, 10, 20);
    doc.text(`Message: ${apiResponse?.message || "-"}`, 10, 26);

    doc.text(`IRN: ${data?.irn || "-"}`, 10, 32);
    doc.text(`Ack No: ${data?.ackNo || "-"}`, 10, 38);
    doc.text(`Ack Date: ${data?.ackDt || "-"}`, 10, 44);

    // ================= EWB DATA =================
    doc.text(`EWB No: ${data?.EwbNo || "-"}`, 10, 50);
    doc.text(`EWB Date: ${data?.EwbDt || "-"}`, 10, 56);
    doc.text(`Valid Till: ${data?.EwbValidTill || "-"}`, 10, 62);

    // ================= DECODED JWT (optional display) =================
    if (decodedSignedInvoice) {
      doc.text(
        `Invoice Decoded IRN: ${decodedSignedInvoice?.Irn || "-"}`,
        10,
        70
      );
    }

    if (decodedSignedQrCode) {
      doc.text(
        `QR Decoded Ack: ${decodedSignedQrCode?.AckNo || "-"}`,
        10,
        76
      );
    }

    // ================= QR IMAGE =================
    if (data?.qrCode) {
      doc.addImage(
        `data:image/png;base64,${data.qrCode}`,
        "PNG",
        140,
        20,
        50,
        50
      );
    }

    doc.save(`EInvoice_${data?.ackNo || "download"}.pdf`);
  };
}



const fieldDescriptions = {
  // --- HEADER & INVOICE DETAILS ---
  userGstin: "GST Identification Number of User",
  no: "Unique Invoice Number (Max 16 chars)",
  dt: "Invoice Date (DD-MM-YYYY)",
  supplyType: "Type Of Supply (O-Outward, I-Inward)",
  ntr: "Nature Of Transaction (Inter/Intra)",
  docType: "Document Type (RI-Invoice, CR-Credit, DB-Debit)",
  catg: "Invoice Category (B2B, B2C, SEZ, DE)",
  trnTyp: "Transaction Type (Regular, Bill-To Ship-To, etc.)",
  pos: "Place Of Supply State Code (2-digit code)",
  rchrg: "Reverse Charge Applicable (Y/N)",
  taxSch: "Tax Scheme (e.g., GST)",
  expduty: "Export Duty Amount",

  // --- SELLER DETAILS ---
  sgstin: "Seller GSTIN",
  slglNm: "Seller Legal Name",
  strdNm: "Seller Trade Name",
  sbnm: "Seller Building Name",
  sflno: "Seller Floor Number",
  sloc: "Seller Location",
  sdst: "Seller District",
  sstcd: "Seller State Code",
  spin: "Seller PIN Code",
  sph: "Seller Phone Number",
  sem: "Seller Email Address",

  // --- BUYER DETAILS ---
  bgstin: "Buyer GSTIN",
  blglNm: "Buyer Legal Name",
  btrdNm: "Buyer Trade Name",
  bbnm: "Buyer Building Name",
  bflno: "Buyer Floor Number",
  bloc: "Buyer Location",
  bdst: "Buyer District",
  bstcd: "Buyer State Code",
  bpin: "Buyer PIN Code",
  bph: "Buyer Phone Number",
  bem: "Buyer Email Address",

  // --- DISPATCH DETAILS (FROM) ---
  dgstin: "Dispatch GSTIN",
  dtrdNm: "Dispatch Trade Name",
  dlglNm: "Dispatch Legal Name",
  dbnm: "Dispatch Building Name",
  dflno: "Dispatch Floor Number",
  dloc: "Dispatch Location",
  ddst: "Dispatch District",
  dstcd: "Dispatch State Code",
  dpin: "Dispatch PIN Code",
  dph: "Dispatch Phone Number",
  dem: "Dispatch Email Address",

  // --- SHIP TO DETAILS (TO) ---
  togstin: "Ship-to GSTIN",
  totrdNm: "Ship-to Trade Name",
  tolglNm: "Ship-to Legal Name",
  tobnm: "Ship-to Building Name",
  toflno: "Ship-to Floor Number",
  toloc: "Ship-to Location",
  todst: "Ship-to District",
  tostcd: "Ship-to State Code",
  topin: "Ship-to PIN Code",
  toph: "Ship-to Phone Number",
  toem: "Ship-to Email Address",

  // --- TRANSPORT DETAILS ---
  //subSplyTyp: "Sub Supply Type Code",
  transMode: "Transportation Mode (Road/Rail/Air/Ship)",
  vehTyp: "Vehicle Type (Regular/ODC)",
  transDist: "Transport Distance (KM)",
  transName: "Transporter Name",
  vehNo: "Vehicle Registration Number",

  // --- OTHER FLAGS / COMPLIANCE ---
  clmrfnd: "Claim Refund Flag (Y/N)",
  rfndelg: "Refund Eligibility",
  boef: "Bill of Entry Flag",
  fy: "Financial Year (YYYY-YY)",
  refnum: "Internal Reference Number",
  pdt: "Preceding Document Date",
  ivst: "Invoice Status",
  cptycde: "Counterparty Code",
  pobewb: "Place of Business E-Way Bill",
  pobret: "Place of Business Return",
  tcsrt: "TCS Rate Percentage",
  tcsamt: "TCS Amount",
  pretcs: "Pre-TCS Amount",
  genewb: "Generate E-Way Bill (Y/N)",

  // --- EXPORT DETAILS ---
  sbnum: "Shipping Bill Number",
  sbdt: "Shipping Bill Date",
  port: "Port Code",
  cntcd: "Country Code",
  forCur: "Foreign Currency",
  invForCur: "Invoice Value in Foreign Currency",

  // --- ITEM DETAILS ---
  prdNm: "Product Description",
  hsnCd: "HSN Code",
  qty: "Quantity",
  unit: "Unit of Measurement (e.g., KGS, PCS)",
  unitPrice: "Price Per Unit",
  irt: "IGST Rate (%)",
  crt: "CGST Rate (%)", // Added: Critical for Intra-state
  srt: "SGST Rate (%)", // Added: Critical for Intra-state
  txval: "Taxable Value of Item",
  iamt: "IGST Amount",
  camt: "CGST Amount",
  samt: "SGST Amount",
  itmVal: "Total Item Value",
};
const Row = ({ children }) => (
  <div style={{ display: "flex", gap: "15px", marginBottom: "12px", flexWrap: "wrap" }}>
    {children}
  </div>
);

const Cell = ({ children }) => (
  <div style={{ flex: 1, minWidth: "250px" }}>
    {children}
  </div>
);

const Section = ({ title, color, children }) => (
  <div style={{ marginTop: "25px" }}>
    <div style={{
      background: color,
      color: "white",
      padding: "14px",
      fontWeight: "bold",
      borderRadius: "6px"
    }}>
      {title}
    </div>

    <div style={{ padding: "15px", background: "#fff" }}>
      {children}
    </div>
  </div>
);
return (
  <div style={tableStyles.container}>
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

      {/* ========================================================= */}
      {/* HEADER */}
      {/* ========================================================= */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        flexWrap: "wrap",
        gap: "15px",
      }}>
        <h1 style={tableStyles.header}>Generate & Print E-Invoice</h1>
       {/* BUTTONS */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>

        <button
          onClick={downloadPDF}
          style={{
            background: "#ff9800",
            color: "#fff",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px"
          }}
        >
          Download PDF (with QR)
        </button>

      </div>
      
      </div>

      {/* ========================================================= */}
      {/* INVOICE HEADER */}
      {/* ========================================================= */}
      <table style={tableStyles.table}>
        <thead>
          <tr>
            <th colSpan={3} style={{ background: colors.primary, color: "#fff", padding: 18 }}>
              Invoice Header Details
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td style={tableStyles.td}><LabeledInput label="User GSTIN" value={payload.userGstin} onChange={(v) => setField("userGstin", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="Invoice No" value={payload.no} onChange={(v) => setField("no", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="Invoice Date" value={payload.dt} onChange={(v) => setField("dt", v)} /></td>
          </tr>
          <tr>
            <td style={tableStyles.td}><LabeledSelect label="Supply Type" value={payload.supplyType} options={["O", "I"]} onChange={(v) => setField("supplyType", v)} /></td>
            <td style={tableStyles.td}><LabeledSelect label="Nature" value={payload.ntr} options={["Inter", "Intra"]} onChange={(v) => setField("ntr", v)} /></td>
            <td style={tableStyles.td}><LabeledSelect label="Doc Type" value={payload.docType} options={["RI", "CR", "DB"]} onChange={(v) => setField("docType", v)} /></td>
          </tr>

          <tr>
            <td style={tableStyles.td}><LabeledSelect label="Category" value={payload.catg} options={["B2B", "B2C", "EXP"]} onChange={(v) => setField("catg", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="POS" value={payload.pos} onChange={(v) => setField("pos", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="Tax Scheme" value={payload.taxSch} onChange={(v) => setField("taxSch", v)} /></td>
          </tr>
        </tbody>
      </table>

      {/* ========================================================= */}
      {/* SELLER */}
      {/* ========================================================= */}
      <Section title="Seller Details" color="#4CAF50">
        <Row>
          <Cell><LabeledInput label="GSTIN" value={payload.sgstin} onChange={(v) => setField("sgstin", v)} /></Cell>
          <Cell><LabeledInput label="Trade Name" value={payload.strdNm} onChange={(v) => setField("strdNm", v)} /></Cell>
          <Cell><LabeledInput label="Legal Name" value={payload.slglNm} onChange={(v) => setField("slglNm", v)} /></Cell>
        </Row>

        <Row>
          <Cell><LabeledInput label="Location" value={payload.sloc} onChange={(v) => setField("sloc", v)} /></Cell>
          <Cell><LabeledInput label="District" value={payload.sdst} onChange={(v) => setField("sdst", v)} /></Cell>
          <Cell><LabeledInput label="State Code" value={payload.sstcd} onChange={(v) => setField("sstcd", v)} /></Cell>
        </Row>
         <Row>
          <Cell><LabeledInput label="Location" value={payload.spin} onChange={(v) => setField("spin", v)} /></Cell>
          <Cell><LabeledInput label="District" value={payload.sph} onChange={(v) => setField("sph", v)} /></Cell>
          <Cell><LabeledInput label="State Code" value={payload.sem} onChange={(v) => setField("sem", v)} /></Cell>
        </Row>
      </Section>
 

      {/* ========================================================= */}
      {/* BUYER */}
      {/* ========================================================= */}
      <Section title="Buyer Details" color="#FF9800">

  {/* BASIC DETAILS */}
  <Row>
    <Cell>
      <LabeledInput
        label="GSTIN"
        value={payload.bgstin}
        onChange={(v) => setField("bgstin", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Trade Name"
        value={payload.btrdNm}
        onChange={(v) => setField("btrdNm", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Legal Name"
        value={payload.blglNm}
        onChange={(v) => setField("blglNm", v)}
      />
    </Cell>
  </Row>

  {/* ADDRESS LINE 1 */}
  <Row>
    <Cell>
      <LabeledInput
        label="Building Name / BBNM"
        value={payload.bbnm}
        onChange={(v) => setField("bbnm", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Floor / Block"
        value={payload.bflno}
        onChange={(v) => setField("bflno", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Location"
        value={payload.bloc}
        onChange={(v) => setField("bloc", v)}
      />
    </Cell>
  </Row>

  {/* ADDRESS LINE 2 */}
  <Row>
    <Cell>
      <LabeledInput
        label="District"
        value={payload.bdst}
        onChange={(v) => setField("bdst", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="State Code"
        value={payload.bstcd}
        onChange={(v) => setField("bstcd", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="PIN Code (BPIN)"
        value={payload.bpin}
        onChange={(v) => setField("bpin", v)}
      />
    </Cell>
  </Row>

  {/* CONTACT DETAILS */}
  <Row>
    <Cell>
      <LabeledInput
        label="Phone"
        value={payload.bph}
        onChange={(v) => setField("bph", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Email"
        value={payload.bem}
        onChange={(v) => setField("bem", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Country (Optional)"
        value={payload.bcountry || ""}
        onChange={(v) => setField("bcountry", v)}
      />
    </Cell>
  </Row>

</Section>

      {/* ========================================================= */}
      {/* TRANSPORT */}
      /* ========================================================= */
/* TRANSPORT DETAILS */
/* ========================================================= */
<Section title="Transport Details" color="#9C27B0">

  {/* ROW 1 */}
 

  {/* ROW 2 */}
  <Row>
    <Cell>
      <LabeledSelect
        label="Vehicle Type"
        value={payload.vehTyp}
        options={[
          "R", // Regular
          "O", // ODC
        ]}
        onChange={(v) =>
          setField("vehTyp", v)
        }
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Transport Distance (KM)"
        value={payload.transDist}
        onChange={(v) =>
          setField("transDist", v)
        }
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Transporter Name"
        value={payload.transName}
        onChange={(v) =>
          setField("transName", v)
        }
      />
    </Cell>
  </Row>

  {/* ROW 3 */}
  <Row>
    <Cell>
      <LabeledInput
        label="Vehicle Number"
        value={payload.vehNo}
        onChange={(v) =>
          setField("vehNo", v)
        }
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Transport Document Number"
        value={payload.transDocNo}
        onChange={(v) =>
          setField("transDocNo", v)
        }
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Transport Document Date"
        value={payload.transDocDate}
        onChange={(v) =>
          setField("transDocDate", v)
        }
      />
    </Cell>
  </Row>

  {/* ROW 4 */}
  <Row>
    <Cell>
      <LabeledInput
        label="KD Reference Invoice Number"
        value={payload.kdrefinum || ""}
        onChange={(v) =>
          setField("kdrefinum", v)
        }
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="KD Reference Invoice Date"
        value={payload.kdrefidt || ""}
        onChange={(v) =>
          setField("kdrefidt", v)
        }
      />
    </Cell>

    <Cell />
  </Row>

</Section>
      /* ========================================================= */
/* DISPATCH DETAILS */
/* ========================================================= */
<Section title="Dispatch Details (From)" color="#795548">

  <Row>
    <Cell>
      <LabeledInput
        label="Dispatch GSTIN"
        value={payload.dgstin}
        onChange={(v) => setField("dgstin", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Dispatch Trade Name"
        value={payload.dtrdNm}
        onChange={(v) => setField("dtrdNm", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Dispatch Legal Name"
        value={payload.dlglNm}
        onChange={(v) => setField("dlglNm", v)}
      />
    </Cell>
  </Row>

  <Row>
    <Cell>
      <LabeledInput
        label="Building Name"
        value={payload.dbnm}
        onChange={(v) => setField("dbnm", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Floor Number"
        value={payload.dflno}
        onChange={(v) => setField("dflno", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Location"
        value={payload.dloc}
        onChange={(v) => setField("dloc", v)}
      />
    </Cell>
  </Row>

  <Row>
    <Cell>
      <LabeledInput
        label="District"
        value={payload.ddst}
        onChange={(v) => setField("ddst", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="State Code"
        value={payload.dstcd}
        onChange={(v) => setField("dstcd", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="PIN Code"
        value={payload.dpin}
        onChange={(v) => setField("dpin", v)}
      />
    </Cell>
  </Row>

  <Row>
    <Cell>
      <LabeledInput
        label="Phone Number"
        value={payload.dph}
        onChange={(v) => setField("dph", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Email Address"
        value={payload.dem}
        onChange={(v) => setField("dem", v)}
      />
    </Cell>

    <Cell />
  </Row>

</Section>

{/* ========================================================= */}
{/* SHIP TO DETAILS */}
{/* ========================================================= */}
<Section title="Ship To Details" color="#3F51B5">

  <Row>
    <Cell>
      <LabeledInput
        label="Ship-To GSTIN"
        value={payload.togstin}
        onChange={(v) => setField("togstin", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Trade Name"
        value={payload.totrdNm}
        onChange={(v) => setField("totrdNm", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Legal Name"
        value={payload.tolglNm}
        onChange={(v) => setField("tolglNm", v)}
      />
    </Cell>
  </Row>

  <Row>
    <Cell>
      <LabeledInput
        label="Building Name"
        value={payload.tobnm}
        onChange={(v) => setField("tobnm", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Floor Number"
        value={payload.toflno}
        onChange={(v) => setField("toflno", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Location"
        value={payload.toloc}
        onChange={(v) => setField("toloc", v)}
      />
    </Cell>
  </Row>

  <Row>
    <Cell>
      <LabeledInput
        label="District"
        value={payload.todst}
        onChange={(v) => setField("todst", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="State Code"
        value={payload.tostcd}
        onChange={(v) => setField("tostcd", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="PIN Code"
        value={payload.topin}
        onChange={(v) => setField("topin", v)}
      />
    </Cell>
  </Row>

  <Row>
    <Cell>
      <LabeledInput
        label="Phone Number"
        value={payload.toph}
        onChange={(v) => setField("toph", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Email Address"
        value={payload.toem}
        onChange={(v) => setField("toem", v)}
      />
    </Cell>

    <Cell />
  </Row>

</Section>

{/* ========================================================= */}
{/* EXPORT DETAILS */}
{/* ========================================================= */}
<Section title="Export Details" color="#607D8B">

  <Row>
    <Cell>
      <LabeledInput
        label="Shipping Bill Number"
        value={payload.sbnum}
        onChange={(v) => setField("sbnum", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Shipping Bill Date"
        value={payload.sbdt}
        onChange={(v) => setField("sbdt", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Port"
        value={payload.port}
        onChange={(v) => setField("port", v)}
      />
    </Cell>
  </Row>

  <Row>
    <Cell>
      <LabeledInput
        label="Export Duty"
        value={payload.expduty}
        onChange={(v) => setField("expduty", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Country Code"
        value={payload.cntcd}
        onChange={(v) => setField("cntcd", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Foreign Currency"
        value={payload.forCur}
        onChange={(v) => setField("forCur", v)}
      />
    </Cell>
  </Row>

</Section>

{/* ========================================================= */}
{/* PAYMENT DETAILS */}
{/* ========================================================= */}
<Section title="Payment Details" color="#009688">

  <Row>
    <Cell>
      <LabeledInput
        label="Payee Name"
        value={payload.payNm}
        onChange={(v) => setField("payNm", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Account Details"
        value={payload.acctdet}
        onChange={(v) => setField("acctdet", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="IFSC"
        value={payload.ifsc}
        onChange={(v) => setField("ifsc", v)}
      />
    </Cell>
  </Row>

  <Row>
    <Cell>
      <LabeledInput
        label="Payment Mode"
        value={payload.mode}
        onChange={(v) => setField("mode", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Paid Amount"
        value={payload.paidAmt}
        onChange={(v) => setField("paidAmt", v)}
      />
    </Cell>

    <Cell>
      <LabeledInput
        label="Balance Amount"
        value={payload.balAmt}
        onChange={(v) => setField("balAmt", v)}
      />
    </Cell>
  </Row>

</Section>

{/* ========================================================= */}
{/* EXTRA TRANSPORT DETAILS */}
{/* ========================================================= */}
<Row>
  <Cell>
    <LabeledInput
      label="Transporter Name"
      value={payload.transName}
      onChange={(v) => setField("transName", v)}
    />
  </Cell>

  <Cell>
    <LabeledInput
      label="Vehicle Type"
      value={payload.vehTyp}
      onChange={(v) => setField("vehTyp", v)}
    />
  </Cell>

  
</Row>

<Row>
  <Cell>
    <LabeledInput
      label="Transport Doc No"
      value={payload.transDocNo}
      onChange={(v) => setField("transDocNo", v)}
    />
  </Cell>

  <Cell>
    <LabeledInput
      label="Transport Doc Date"
      value={payload.transDocDate}
      onChange={(v) => setField("transDocDate", v)}
    />
  </Cell>

  <Cell />
</Row>

{/* ========================================================= */}
{/* INVOICE REMARKS */}
{/* ========================================================= */}
<Section title="Invoice Remarks" color="#E91E63">

  <Row>
    <Cell>
      <LabeledInput
        label="Invoice Remarks"
        value={payload.invRmk}
        onChange={(v) => setField("invRmk", v)}
      />
    </Cell>
  </Row>

</Section>
      
      {/* ========================================================= */}
      {/* ITEMS */}
      {/* ========================================================= */}
      <div style={{ marginTop: 30 }}>
        <h2>Item Details</h2>

        {payload.itemList.map((item, idx) => (
          <div key={idx} style={tableStyles.itemCard}>
            <b>Item {idx + 1}</b>

            <Row>
              <Cell>
                <LabeledInput label="Product" value={item.prdNm} onChange={(v) => updateItem(idx, "prdNm", v)} />
              </Cell>
              <Cell>
                <LabeledInput label="HSN" value={item.hsnCd} onChange={(v) => updateItem(idx, "hsnCd", v)} />
              </Cell>
              <Cell>
                <LabeledInput label="Qty" value={item.qty} onChange={(v) => updateItem(idx, "qty", v)} />
              </Cell>
            </Row>

            <Row>
              <Cell>
                <LabeledInput label="Unit Price" value={item.unitPrice} onChange={(v) => updateItem(idx, "unitPrice", v)} />
              </Cell>
              <Cell>
                <LabeledInput label="Taxable" value={item.txval} onChange={(v) => updateItem(idx, "txval", v)} />
              </Cell>
              <Cell>
                <LabeledInput label="IGST" value={item.iamt} onChange={(v) => updateItem(idx, "iamt", v)} />
              </Cell>
            </Row>
          </div>
        ))}

        <button style={tableStyles.btnGreen} onClick={addItem}>+ Add Item</button>
      </div>

      {/* ========================================================= */}
      {/* TOTALS */}
      {/* ========================================================= */}
      <Section title="Totals" color="#2196F3">
        <Row>
          <Cell>Total Taxable: {payload.tottxval}</Cell>
          <Cell>Total IGST: {payload.totiamt}</Cell>
          <Cell>Total Invoice: {payload.totinvval}</Cell>
        </Row>
      </Section>

      {/* ========================================================= */}
      {/* GENERATE */}
      {/* ========================================================= */}
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <button style={tableStyles.btnGreen} onClick={handleGenerate}>
          Generate E-Invoice
        </button>
      </div>

      {/* ========================================================= */}
      {/* API RESPONSE VIEW */}
      {/* ========================================================= */}
       <ApiResponseView apiResponse={apiResponse}  pdfData={pdfData} />
     

    </div>

    
  </div>
);
};

export default GenerateAndPrintEinvoice;

