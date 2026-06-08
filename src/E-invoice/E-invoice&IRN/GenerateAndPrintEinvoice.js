import React, { useState, useEffect, useCallback, useRef } from "react";
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
const EINV_DOC_KEY = "iris_einv_doc_map";

const LAST_GENERATED_ID_KEY = "iris_last_generated_id";
const LAST_DOC_DETAILS_KEY = "iris_last_used_doc_details";
const LAST_IRN_KEY = "iris_last_used_irn";
const LAST_SIGNED_QR_JWT_KEY = "iris_last_signed_qr_jwt";
const LAST_EWB_DETAILS_KEY = "iris_last_ewb_details";

// ==================== SANITIZERS ====================
const sanitizeSubSupplyType = (type, supplyType = "O") => {
  let clean = String(type || "").trim();
  if (/^(1[0-2]|[1-9])$/.test(clean)) {
    return clean;
  }
  const mapping = {
    "SUPPLY": "1",
    "EXPORT": "3",
    "IMPORT": "2",
    "JOB WORK": "4",
    "OWN USE": "5",
    "SALES RETURN": "7",
  };
  clean = clean.toUpperCase();
  if (mapping[clean]) return mapping[clean];
  if (supplyType === "EXP") return "3";
  return "1";
};

const sanitizeUQC = (uom) => {
  const validUQCs = new Set([
    "NOS", "PCS", "KGS", "GMS", "MTR", "MTS", "LTR", "MLT", "BOX", "PAC",
    "DOZ", "PRS", "BAG", "BTL", "TIN", "CAN", "ROL", "SET", "CTN", "DRM",
    "KG", "MT", "L", "ML", "SQFT", "SQM", "M", "GM"
  ]);
  const code = String(uom || "NOS").toUpperCase().trim();
  return validUQCs.has(code) ? code : "NOS";
};

const LabeledInput = ({ label, id, value, onChange, type = "text", step }) => {
  const [focused, setFocused] = useState(false);
  return (
    <label htmlFor={id} style={{ display: "block", width: "100%" }}>
      <span style={tableStyles.labelText}>{label}</span>
      <input
        id={id}
        type={type}
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
        style={{ ...tableStyles.input, ...(focused ? tableStyles.inputFocus : {}) }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </label>
  );
};

const LabeledSelect = ({ label, id, value, options, onChange }) => (
  <label htmlFor={id} style={{ display: "block", width: "100%" }}>
    <span style={tableStyles.labelText}>{label}</span>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} style={tableStyles.select}>
      {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </label>
);

const createBasePayload = (invoiceData = {}, dynamicId, selectedCatg = "B2B") => {
  const inv = invoiceData;
  const selectedTrnTyp = inv?.transactionType || "REG";

  const sellerGstin = inv?.companyBranches?.gstin || "01AAACI9260R002";
  const sellerStateCode = sellerGstin.substring(0, 2);

  let buyerGstin = inv?.buyerClients?.gstin || "";
  if (selectedCatg === "B2B" && (!buyerGstin || buyerGstin === "URP")) {
    buyerGstin = "02AAACI9260R002";
  } else if (selectedCatg === "B2C") {
    buyerGstin = "URP";
  }
  const buyerStateCode = buyerGstin !== "URP" ? buyerGstin.substring(0, 2) : "02";

  const isInterState = sellerStateCode !== buyerStateCode;
  const productList = inv?.invoiceProductDetails?.length > 0 ? inv.invoiceProductDetails : [];

  const totTxVal = Number(productList.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0).toFixed(2));
  const totIgst = Number(productList.reduce((sum, item) => sum + Number(item.igstAmount || 0), 0).toFixed(2));
  const totCgst = Number(productList.reduce((sum, item) => sum + Number(item.cgstAmount || 0), 0).toFixed(2));
  const totSgst = Number(productList.reduce((sum, item) => sum + Number(item.sgstAmount || 0), 0).toFixed(2));
  const totalInvVal = totTxVal + totIgst + totCgst + totSgst;

   const formatDate = (dateInput) => {
  if (!dateInput) return null;

  const date = new Date(dateInput);

  // Invalid date check
  if (isNaN(date.getTime())) return null;

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
};

const formatHSNCode = (hsn) => {
  if (!hsn) return "73041190";

  return String(hsn)
    .replace(/\D/g, "")   // remove letters & symbols
    .trim()
    .slice(0, 8);         // HSN max length (4–8 digits allowed)
};

  return {
    id: String(inv?.refID || dynamicId || "1001"),
    userGstin: sellerGstin,
    pobCode: null,
    supplyType: "O",
    ntr: isInterState ? "Inter" : "Intra",
    docType: "RI",
    catg: selectedCatg || "B2B",
    dst: "O",
    trnTyp: selectedTrnTyp,
    no: inv?.refID ? `INV-${inv.refID}` : "INV-001",
    dt: formatDate(inv?.dateofIssue || new Date()),
    pos: buyerStateCode,
    rchrg: "N",
    taxSch: "GST",
    fy: inv?.tYear || "26-27",

    // ================= SELLER =================
    sgstin: sellerGstin,
    strdNm: inv?.companyBranches?.companyTallyName || "TEST Company",
    slglNm: inv?.companyBranches?.nameEng || "TEST PROD",
    sbnm: inv?.companyBranches?.companyTallyName || "Testing",
    sflno: "ABC",
    sloc: inv?.companyBranches?.poBox || "BANGALOR32",
    sdst: inv?.companyBranches?.poBox?.split(",")?.[1]?.trim() || "BENGALURU",
    sstcd: sellerStateCode,
    spin: inv?.companyBranches?.pinCode || inv?.companyBranches?.poBoxCode || "500016",
    sph: inv?.companyBranches?.mobile || "123456111111",
    sem: inv?.companyBranches?.email || "abc123@gmail.com",

    // ================= BUYER =================
    bgstin: buyerGstin,
    btrdNm: inv?.buyerClients?.companyName || "TEST ENTERPRISES",
    blglNm: inv?.buyerClients?.companyName || "TEST PRODUCT",
    bbnm: inv?.buyerClients?.companyName || "ABCD12345",
    bflno: "abc",
    bloc: inv?.buyerClients?.officeAddress || "Jijamat",
    bdst: inv?.buyerClients?.masterStateNames?.stateName || "BANGALORE",
    bstcd: buyerStateCode,
    bpin: inv?.buyerClients?.poBox || "174001",
    bph: inv?.buyerClients?.mobile || "989898111111",
    bem: inv?.buyerClients?.email || "abc123@gmail.com",

    // ================= SHIP TO =================
    togstin: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? (inv?.buyerClients?.gstin || buyerGstin) : null,
    totrdNm: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? (inv?.buyerClients?.companyName || "TEST SHIP") : null,
    tolglNm: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? (inv?.buyerClients?.companyName || "TEST SHIP") : null,
    tobnm: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? "TEST SHIP" : null,
    toloc: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? (inv?.buyerClients?.officeAddress || "MUMBAI") : null,
    tostcd: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? buyerStateCode : null,
    topin: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? (inv?.buyerClients?.poBox || "174001") : null,

    // ================= DISPATCH =================
    dgstin: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? sellerGstin : null,
    dtrdNm: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? (inv?.companyBranches?.companyTallyName || "TEST DISP") : null,
    dlglNm: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? (inv?.companyBranches?.nameEng || "TEST DISP") : null,
    dbnm: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? "TEST DISP" : null,
    dflno: null,
    dloc: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? (inv?.companyBranches?.poBox || "BANGALOR32") : null,
    ddst: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? "BENGALURU" : null,
    dstcd: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? sellerStateCode : null,
    dpin: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? (inv?.companyBranches?.pinCode || "192233") : null,

    // ================= TRANSPORT =================
    subSplyTyp: "Supply",
    transId: "01AAACI9260R002",
    transMode: "1",
    transDist: 0,
    transName: "TEST TRANSPORT",
    transDocNo: `DOC${inv?.refID || "001"}`,
    transDocDate: formatDate(inv?.dateofIssue || new Date()),
    vehNo: inv?.vehicleNo || "KA01AB1234",
    vehTyp: "R",

    // ================= TOTALS =================
    tottxval: totTxVal,
    totiamt: totIgst,
    totcamt: totCgst,
    totsamt: totSgst,
    totinvval: totalInvVal,
    totdisc: 0,
    totothchrg: 0,
    totcsamt: 0,
    totstcsamt: 0,
    rndOffAmt: 0,

    // ================= ITEMS =================
    itemList: productList.map((item, index) => ({
      num: String(index + 1).padStart(5, "0"),
      prdNm: item?.itemName || "Product Line Name",
      prdDesc: item?.itemName || "Product Line Description",
      hsnCd: formatHSNCode(item?.hsnCode || item?.hsn || "73041190"),
      qty: Number(item?.quantity || 1),
      unit: sanitizeUQC(item?.uom),
      unitPrice: Number(item?.quantityAmount || 0),
      txval: Number(item?.totalAmount || 0),
      sval: Number(item?.totalAmount || 0),
      rt: Number(item?.gstPer || 18),
      irt: isInterState ? Number(item?.gstPer || 18) : 0,
      iamt: isInterState ? Number(item?.igstAmount || 0) : 0,
      camt: !isInterState ? Number(item?.cgstAmount || 0) : 0,
      samt: !isInterState ? Number(item?.sgstAmount || 0) : 0,
      itmVal: Number(item?.totalAmount || 0) + Number(item?.igstAmount || 0),
      invItmOtherDtls: []
    })),
    invOthDocDtls: [],
    invRefPreDtls: [{ oinum: null, oidt: null, othRefNo: null }],
    invRefContDtls: [{ raref: null, radt: null, tendref: null, contref: null, extref: null, projref: null, poref: null, porefdt: null }],
    genIrn: true,
    genewb: "Y",
    signedDataReq: true
  };
};

export const GenerateAndPrintEinvoice = () => {
  const { token, setLastInvoice } = useAuth();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [template, setTemplate] = useState("STANDARD");
  const [pdfMessage, setPdfMessage] = useState("");
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [invoiceApiData, setInvoiceApiData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("B2B");
  const location = useLocation();

  const receivedData = location.state || {};
  const invoiceData = receivedData.invoiceData || {};
  const dynamicId = receivedData.id || invoiceData.pid;

  const [payload, setPayload] = useState({ itemList: [] });
  const initializedRef = useRef(false);

  const recalculateTotals = useCallback((currentPayload) => {
  if (!currentPayload?.itemList) return currentPayload;

  let totalTaxableValue = 0;
  let totalIGST = 0;
  let totalCGST = 0;
  let totalSGST = 0;

  const sellerCode = String(currentPayload.sstcd || "36");
  const buyerCode = String(currentPayload.bstcd || "36");

  const isInter = sellerCode !== buyerCode;

  const updatedItems = currentPayload.itemList.map((item) => {
    const qty = Number(item.qty) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const rate = Number(item.rt) || 18;

    const txval = Number((qty * unitPrice).toFixed(2));

    let iamt = 0, camt = 0, samt = 0;
    let irt = 0, crt = 0, srt = 0;

    if (isInter) {
      irt = rate;
      iamt = Number((txval * (rate / 100)).toFixed(2));
    } else {
      crt = rate / 2;
      srt = rate / 2;

      camt = Number((txval * (crt / 100)).toFixed(2));
      samt = Number((txval * (srt / 100)).toFixed(2));
    }

    const itmVal = Number((txval + iamt + camt + samt).toFixed(2));

    totalTaxableValue += txval;
    totalIGST += iamt;
    totalCGST += camt;
    totalSGST += samt;

    return {
      ...item,
      txval,
      sval: txval,

      rt: rate,

      irt,
      crt,
      srt,

      iamt,
      camt,
      samt,

      itmVal,
      csamt: 0,
    };
  });

  const discount = Number(currentPayload.totdisc) || 0;
  const otherCharges = Number(currentPayload.totothchrg) || 0;

  const tottxval = Number(totalTaxableValue.toFixed(2));
  const totiamt = Number(totalIGST.toFixed(2));
  const totcamt = Number(totalCGST.toFixed(2));
  const totsamt = Number(totalSGST.toFixed(2));

  const totinvval = Number(
    (tottxval + totiamt + totcamt + totsamt + otherCharges - discount).toFixed(2)
  );

  return {
    ...currentPayload,

    ntr: isInter ? "Inter" : "Intra",

    // ⚠️ POS should remain buyer state code (keep GST rule safe)
    pos: buyerCode,

    itemList: updatedItems,

    tottxval,
    totiamt,
    totcamt,
    totsamt,
    totinvval,

    totcsamt: 0,
    totstcsamt: 0,
  };
}, []);

  const setField = (field, value) => {
    setPayload((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "sgstin" && value?.length >= 2) updated.sstcd = value.substring(0, 2);
      if (field === "bgstin" && value?.length >= 2 && value !== "URP") updated.bstcd = value.substring(0, 2);
      return recalculateTotals(updated);
    });
  };

  const updateItem = (idx, field, value) => {
    setPayload((prev) => {
      if (!prev.itemList || !prev.itemList[idx]) return prev;
      const newPayload = { ...prev };
      newPayload.itemList = [...prev.itemList];
      newPayload.itemList[idx] = { ...newPayload.itemList[idx], [field]: value };
      return recalculateTotals(newPayload);
    });
  };

  const handleCategorySelectionChange = (category) => {
    setSelectedCategory(category);
    const dataToUse = invoiceApiData || invoiceData;
    if (!dataToUse) return;
    const basePayload = createBasePayload(dataToUse, dynamicId, category);
    setPayload(recalculateTotals(basePayload));
  };

  useEffect(() => {
    const dataToUse = invoiceApiData || invoiceData;
    if (!dataToUse || initializedRef.current) return;

    const basePayload = createBasePayload(dataToUse, dynamicId, selectedCategory);
    setPayload(recalculateTotals(basePayload));
    initializedRef.current = true;
  }, [invoiceApiData, invoiceData, dynamicId, selectedCategory, recalculateTotals]);

  const addItem = () => {
    setPayload((prev) => {
      const newItem = {
        num: String(prev.itemList.length + 1).padStart(5, "0"),
        hsnCd: "84713010",
        prdNm: "New Service/Product",
        qty: 1,
        unit: "NOS",
        unitPrice: 100,
        rt: 18,
        irt: prev.sstcd !== prev.bstcd ? 18 : 0,
        txval: 0,
        iamt: 0,
        camt: 0,
        samt: 0,
        itmVal: 0,
        discount: 0,
        othChrg: 0,
        csamt: 0,
        srt: 0,
        crt: 0,
        freeQty: 0,
        preTaxVal: 0,
        isServc: "N",
        orgCntry: "IN",
      };
      const updatedPayload = { ...prev, itemList: [...prev.itemList, newItem] };
      return recalculateTotals(updatedPayload);
    });
  };

  const removeItem = (idx) => {
    setPayload((prev) => {
      if (!prev.itemList || prev.itemList.length <= 1) return prev;
      const updatedPayload = { ...prev, itemList: prev.itemList.filter((_, i) => i !== idx) };
      return recalculateTotals(updatedPayload);
    });
  };

  const storeEinv = (apiResponse) => {
    if (!apiResponse?.id || !payload?.no) return;
    const entry = { docNo: payload.no?.trim(), einvId: String(apiResponse.id), createdAt: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem(EINV_DOC_KEY)) || [];
    const filtered = existing.filter((e) => e.docNo !== entry.docNo && e.einvId !== entry.einvId);
    localStorage.setItem(EINV_DOC_KEY, JSON.stringify([...filtered, entry]));
  };

  const saveResponseForAutoPopulate = (data) => {
    if (!data?.response) return;
    const responseData = data.response;
    if (responseData.id) localStorage.setItem(LAST_GENERATED_ID_KEY, String(responseData.id));

    const sharedData = JSON.parse(localStorage.getItem(STORAGE_KEY1) || "{}");
    sharedData.companyId = "24";
    sharedData.token = token;
    sharedData.irn = responseData.irn;
    sharedData.companyUniqueCode = payload.userGstin;
    sharedData.lastGeneratedResponse = responseData;
    sharedData.lastGeneratedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY1, JSON.stringify(sharedData));

    localStorage.setItem(LAST_DOC_DETAILS_KEY, JSON.stringify({ docNum: payload.no?.trim(), docDate: payload.dt?.trim(), docType: payload.docType, timestamp: new Date().toISOString() }));
    localStorage.setItem(LAST_IRN_KEY, JSON.stringify({ irn: responseData.irn, timestamp: new Date().toISOString() }));
    if (responseData.signedQrCode) localStorage.setItem(LAST_SIGNED_QR_JWT_KEY, responseData.signedQrCode);
    localStorage.setItem(LAST_EWB_DETAILS_KEY, JSON.stringify({ ewbNo: responseData.ewbNo || "", ewbDate: responseData.ewbDate || "", timestamp: new Date().toISOString() }));

    setLastInvoice?.(responseData.irn, payload.userGstin, payload.no, payload.dt, payload.docType);
  };

  const fetchInvoiceData = useCallback(async () => {
    if (!dynamicId) return;
    setLoadingInvoice(true);
    setError("");
    try {
      const res = await axios.get(`http://localhost:3001/api/invoice/${dynamicId}`);
      const encryptedData = res?.data?.data?.data;
      if (!encryptedData) throw new Error("Invoice encrypted data not found");

      let decodedString = atob(encryptedData);
      let actualInvoiceData = {};
      try {
        actualInvoiceData = JSON.parse(decodedString);
      } catch (e) {
        actualInvoiceData = { rawEncrypted: encryptedData, decodedRaw: decodedString };
      }

      setInvoiceApiData(actualInvoiceData);
      const basePayload = createBasePayload(actualInvoiceData, dynamicId, selectedCategory);
      setPayload(recalculateTotals(basePayload));
    } catch (err) {
      setError(err?.message || "Error fetching invoice data");
    } finally {
      setLoadingInvoice(false);
    }
  }, [dynamicId, selectedCategory, recalculateTotals]);

  const handleGenerate = async () => {
    if (!token) {
      alert("Login required!");
      return;
    }
    setLoading(true);
    setResponse(null);
    try {
      const finalPayload = recalculateTotals(payload);
      const res = await fetch("http://localhost:3001/proxy/irn/addInvoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": token,
          companyId: "24",
          product: "ONYX",
        },
        body: JSON.stringify(finalPayload),
      });

      const data = await res.json();
      setResponse(data);

      const generatedId = data?.response?.id || data?.response?.Id || data?.response?.irn || data?.response?.invoiceId;
      if (generatedId) {
        setPayload((prev) => ({ ...prev, lastGeneratedId: generatedId }));
      }

      if (data?.status === "SUCCESS" && data?.response?.irn) {
        saveResponseForAutoPopulate(data);
        storeEinv(data.response);
        localStorage.setItem(STORAGE_KEY2, JSON.stringify(data));
        alert(`✅ IRN Generated Successfully!\nIRN: ${data.response.irn}`);
      } else if (data?.status === "FAILURE") {
        alert(`❌ Generation Failed: ${data?.errors?.[0]?.msg || "Unknown error"}`);
      } else {
        alert("Unexpected response from server");
      }
    } catch (err) {
      setResponse({ status: "ERROR", error: err.message });
      alert("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!payload?.lastGeneratedId) return;
    try {
      setPdfMessage("Generating PDF...");
      const resp = await axios.get(`http://localhost:3001/proxy/einvoice/print`, {
        params: { template, id: payload.lastGeneratedId },
        headers: { "X-Auth-Token": token, companyId: "24", product: "ONYX" },
        responseType: "blob",
      });
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
      setPdfMessage("Failed to download PDF.");
    }
  };

  return (
    <div style={tableStyles.container}>
      <h1 style={tableStyles.header}>
        Dynamic E-Invoice Generator ({selectedCategory} Mode)
      </h1>

      {/* ==================== META CONFIGURATION ==================== */}
      <table style={tableStyles.table}>
        <thead>
          <tr>
            <th colSpan={4} style={tableStyles.th}>Document Meta Configuration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tableStyles.td}>
              <LabeledSelect 
                label="Invoice Scenario Category" 
                value={selectedCategory} 
                options={["B2B", "B2C", "EXP"]} 
                onChange={handleCategorySelectionChange} 
              />
            </td>
            <td style={tableStyles.td}>
              <LabeledSelect 
                label="Transaction Type" 
                value={payload.trnTyp || "REG"} 
                options={["REG", "BILLTO_SHIPTO", "BILLFROM_DISPATCHFROM"]} 
                onChange={(v) => setField("trnTyp", v)} 
              />
            </td>
            <td style={tableStyles.td}>
              <LabeledInput label="User GSTIN" value={payload.userGstin} onChange={(v) => setField("userGstin", v)} />
            </td>
            <td style={tableStyles.td}>
              <LabeledInput label="Document Type" value={payload.docType} onChange={(v) => setField("docType", v)} />
            </td>
          </tr>
          <tr>
            <td style={tableStyles.td}><LabeledInput label="Invoice Number" value={payload.no} onChange={(v) => setField("no", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="Invoice Date" value={payload.dt} onChange={(v) => setField("dt", v)} /></td>
            <td style={tableStyles.td}>
              <LabeledSelect label="Supply Type" value={payload.supplyType || "O"} options={["O", "E"]} onChange={(v) => setField("supplyType", v)} />
            </td>
            <td style={tableStyles.td}>
              <LabeledSelect label="Nature" value={payload.ntr || "Inter"} options={["Inter", "Intra"]} onChange={(v) => setField("ntr", v)} />
            </td>
          </tr>
          <tr>
            <td style={tableStyles.td}><LabeledInput label="Place of Supply (POS)" value={payload.pos} onChange={(v) => setField("pos", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="Financial Year" value={payload.fy} onChange={(v) => setField("fy", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="Reverse Charge" value={payload.rchrg} onChange={(v) => setField("rchrg", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="ID / Ref ID" value={payload.id} onChange={(v) => setField("id", v)} /></td>
          </tr>
        </tbody>
      </table>

      {/* Seller & Buyer Information */}
      <div style={tableStyles.twoColGrid}>
        <div style={tableStyles.col}>
          <h3>Seller Information</h3>
          <LabeledInput label="GSTIN" value={payload.sgstin} onChange={(v) => setField("sgstin", v)} />
          <LabeledInput label="Trade Name" value={payload.strdNm} onChange={(v) => setField("strdNm", v)} />
          <LabeledInput label="Legal Name" value={payload.slglNm} onChange={(v) => setField("slglNm", v)} />
          <LabeledInput label="Building Name" value={payload.sbnm} onChange={(v) => setField("sbnm", v)} />
          <LabeledInput label="Floor No" value={payload.sflno} onChange={(v) => setField("sflno", v)} />
          <LabeledInput label="Location" value={payload.sloc} onChange={(v) => setField("sloc", v)} />
          <LabeledInput label="State" value={payload.sdst} onChange={(v) => setField("sdst", v)} />
          <LabeledInput label="State Code" value={payload.sstcd} onChange={(v) => setField("sstcd", v)} />
          <LabeledInput label="Pincode" value={payload.spin} onChange={(v) => setField("spin", v)} />
          <LabeledInput label="Phone" value={payload.sph} onChange={(v) => setField("sph", v)} />
          <LabeledInput label="Email" value={payload.sem} onChange={(v) => setField("sem", v)} />
        </div>

        <div style={tableStyles.col}>
          <h3>Buyer Information</h3>
          <LabeledInput label="GSTIN" value={payload.bgstin} onChange={(v) => setField("bgstin", v)} />
          <LabeledInput label="Trade Name" value={payload.btrdNm} onChange={(v) => setField("btrdNm", v)} />
          <LabeledInput label="Legal Name" value={payload.blglNm} onChange={(v) => setField("blglNm", v)} />
          <LabeledInput label="Building Name" value={payload.bbnm} onChange={(v) => setField("bbnm", v)} />
          <LabeledInput label="Floor No" value={payload.bflno} onChange={(v) => setField("bflno", v)} />
          <LabeledInput label="Location" value={payload.bloc} onChange={(v) => setField("bloc", v)} />
          <LabeledInput label="State" value={payload.bdst} onChange={(v) => setField("bdst", v)} />
          <LabeledInput label="State Code" value={payload.bstcd} onChange={(v) => setField("bstcd", v)} />
          <LabeledInput label="Pincode" value={payload.bpin} onChange={(v) => setField("bpin", v)} />
          <LabeledInput label="Phone" value={payload.bph} onChange={(v) => setField("bph", v)} />
          <LabeledInput label="Email" value={payload.bem} onChange={(v) => setField("bem", v)} />
        </div>
      </div>

      {/* Dispatch & Ship To */}
      <div style={{ ...tableStyles.twoColGrid, marginTop: "30px" }}>
        <div style={tableStyles.col}>
          <h3>Dispatch From</h3>
          <LabeledInput label="GSTIN" value={payload.dgstin} onChange={(v) => setField("dgstin", v)} />
          <LabeledInput label="Trade Name" value={payload.dtrdNm} onChange={(v) => setField("dtrdNm", v)} />
          <LabeledInput label="Legal Name" value={payload.dlglNm} onChange={(v) => setField("dlglNm", v)} />
          <LabeledInput label="Building Name" value={payload.dbnm} onChange={(v) => setField("dbnm", v)} />
          <LabeledInput label="Location" value={payload.dloc} onChange={(v) => setField("dloc", v)} />
          <LabeledInput label="State Code" value={payload.dstcd} onChange={(v) => setField("dstcd", v)} />
          <LabeledInput label="Pincode" value={payload.dpin} onChange={(v) => setField("dpin", v)} />
        </div>

        <div style={tableStyles.col}>
          <h3>Ship To</h3>
          <LabeledInput label="GSTIN" value={payload.togstin} onChange={(v) => setField("togstin", v)} />
          <LabeledInput label="Trade Name" value={payload.totrdNm} onChange={(v) => setField("totrdNm", v)} />
          <LabeledInput label="Legal Name" value={payload.tolglNm} onChange={(v) => setField("tolglNm", v)} />
          <LabeledInput label="Building Name" value={payload.tobnm} onChange={(v) => setField("tobnm", v)} />
          <LabeledInput label="Location" value={payload.toloc} onChange={(v) => setField("toloc", v)} />
          <LabeledInput label="State Code" value={payload.tostcd} onChange={(v) => setField("tostcd", v)} />
          <LabeledInput label="Pincode" value={payload.topin} onChange={(v) => setField("topin", v)} />
        </div>
      </div>

      {/* Item management section */}
      <div style={{ marginTop: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3>Line Items Spreadsheet</h3>
          <button style={tableStyles.btnGreen} onClick={addItem}>+ Add Document Row Item</button>
        </div>

        {payload.itemList?.map((item, idx) => (
          <div key={idx} style={tableStyles.itemCard}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
              <LabeledInput label="Product SKU Name" value={item.prdNm} onChange={(v) => updateItem(idx, "prdNm", v)} />
              <LabeledInput label="HSN Tariffs Code" value={item.hsnCd} onChange={(v) => updateItem(idx, "hsnCd", v)} />
              <LabeledInput label="Item Quantity" type="number" value={item.qty} onChange={(v) => updateItem(idx, "qty", v)} />
              <LabeledInput label="Unit Buying Price" type="number" value={item.unitPrice} onChange={(v) => updateItem(idx, "unitPrice", v)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginTop: "15px" }}>
              <LabeledInput label="Tax Rate (rt %)" type="number" value={item.rt} onChange={(v) => updateItem(idx, "rt", v)} />
              <LabeledInput label="UOM Measurement" value={item.unit} onChange={(v) => updateItem(idx, "unit", v)} />
              <div style={{ paddingTop: "25px" }}><strong>Taxable Subtotal:</strong> ₹{item.txval}</div>
              <div style={{ paddingTop: "25px" }}><strong>Gross Val:</strong> ₹{item.itmVal}</div>
            </div>
            <div style={tableStyles.itemFooter}>
              <div style={{ fontSize: "13px", color: "#666" }}>Row Index Mapping Reference ID: {item.num}</div>
              <button style={tableStyles.btnRed} onClick={() => removeItem(idx)}>Remove Product Row</button>
            </div>
          </div>
        ))}
      </div>

      {/* Aggregate breakdown layout box */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "30px" }}>
        <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", width: "350px" }}>
          <div style={{ display: "flex", justifyContent: "between", marginBottom: "10px" }}><span style={{ color: "#555" }}>Taxable Total:</span><strong>₹{payload.tottxval || 0}</strong></div>
          <div style={{ display: "flex", justifyContent: "between", marginBottom: "10px" }}><span style={{ color: "#555" }}>IGST Pool Total:</span><strong>₹{payload.totiamt || 0}</strong></div>
          <div style={{ display: "flex", justifyContent: "between", marginBottom: "10px" }}><span style={{ color: "#555" }}>CGST Pool Total:</span><strong>₹{payload.totcamt || 0}</strong></div>
          <div style={{ display: "flex", justifyContent: "between", marginBottom: "15px" }}><span style={{ color: "#555" }}>SGST Pool Total:</span><strong>₹{payload.totsamt || 0}</strong></div>
          <div style={{ display: "flex", justifyContent: "between", borderTop: "1px solid #ddd", paddingTop: "15px", fontSize: "18px" }}><span style={{ color: "#222", fontWeight: "600" }}>Total Invoice Amt:</span><strong style={{ color: colors.primary }}>₹{payload.totinvval || 0}</strong></div>
        </div>
      </div>

      {/* Submission Actions Row */}
      <div style={{ textAlign: "center", marginTop: "40px", marginBottom: "40px" }}>
        <button style={tableStyles.btnGenerate(loading, token)} onClick={handleGenerate} disabled={loading || !token}>
          {loading ? "Transmitting Fields..." : "Generate E-Invoice Registry Entry"}
        </button>

        {payload?.lastGeneratedId && (
          <div style={{ marginTop: "20px" }}>
            <button style={{ ...tableStyles.btnGreen, padding: "14px 40px" }} onClick={downloadPDF}>
              Download Document Invoice PDF
            </button>
            <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>{pdfMessage}</p>
          </div>
        )}
      </div>

      {/* Logger Monitor Frame */}
      {response && (
        <div style={{ marginTop: "30px" }}>
          <h4>System Logs Analytics Monitor Window</h4>
          <div style={tableStyles.responseBox(response?.status)}>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateAndPrintEinvoice;