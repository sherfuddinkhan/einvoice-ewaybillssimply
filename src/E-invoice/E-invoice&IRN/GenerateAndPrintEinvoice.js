import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../components/AuthContext";
import { useLocation } from "react-router-dom";


const colors = {
  primary: "#1A73E8",
  success: "#34A853",
  danger: "#EA4335",
  background: "#F8F9FA",
};

const tableStyles = {
  container: { 
    padding: "20px", 
    background: colors.background, 
    minHeight: "100vh", 
    fontFamily: "'Segoe UI', Roboto, sans-serif" 
  },
  header: { 
    textAlign: "center", 
    color: colors.primary, 
    fontSize: "28px", 
    marginBottom: "30px", 
    fontWeight: 500 
  },
  table: { 
    width: "100%", 
    borderCollapse: "collapse", 
    marginBottom: "30px", 
    background: "#fff", 
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)", 
    borderRadius: "8px", 
    overflow: "hidden" 
  },
  th: { 
    background: "#E3F2FD", 
    color: colors.primary, 
    textAlign: "left", 
    padding: "16px", 
    fontWeight: 600, 
    fontSize: "16px" 
  },
  td: { 
    padding: "14px 16px", 
    borderBottom: "1px solid #eee", 
    verticalAlign: "top" 
  },
  labelText: { 
    fontWeight: "600", 
    color: "#333", 
    fontSize: "14px", 
    display: "block", 
    marginBottom: "8px" 
  },
  input: { 
    width: "100%", 
    padding: "12px", 
    borderRadius: "6px", 
    border: "1px solid #ccc", 
    fontSize: "14px", 
    boxSizing: "border-box" 
  },
  inputFocus: { 
    borderColor: colors.primary, 
    boxShadow: "0 0 0 3px rgba(26,115,232,0.2)", 
    outline: "none" 
  },
  select: { 
    width: "100%", 
    padding: "12px", 
    borderRadius: "6px", 
    border: "1px solid #ccc", 
    fontSize: "14px" 
  },
  btnGreen: { 
    padding: "12px 24px", 
    background: colors.success, 
    color: "white", 
    border: "none", 
    borderRadius: "6px", 
    cursor: "pointer", 
    fontWeight: "bold", 
    fontSize: "15px" 
  },
  btnRed: { 
    padding: "8px 16px", 
    background: colors.danger, 
    color: "white", 
    border: "none", 
    borderRadius: "4px", 
    cursor: "pointer", 
    fontSize: "13px" 
  },
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
    display: "block",
    margin: "30px auto",
  }),
  itemCard: { 
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#ced4da",
    padding: "20px", 
    borderRadius: "8px", 
    marginBottom: "15px", 
    background: "#fff" 
  },
  twoColGrid: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: "40px" 
  },
  col: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "16px" 
  },
  itemFooter: { 
    marginTop: "20px", 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingTop: "16px", 
    borderTop: "1px dashed #bbb" 
  },
  responseBox: (status) => ({
    background: "#1e1e1e",
    color: status === "SUCCESS" ? "#A8FFBF" : "#FFB4A9",
    padding: "24px",
    borderRadius: "10px",
    fontFamily: "monospace",
    fontSize: "13px",
    overflow: "auto",
    border: `1px solid ${status === "SUCCESS" ? colors.success : colors.danger}`,
    marginTop: "30px"
  }),
};

// Storage Keys
const STORAGE_KEY2 = "iris_einvoice_irn_ewabill";
const EINV_DOC_KEY = "iris_einv_doc_map";
const LAST_GENERATED_ID_KEY = "iris_last_generated_id";
const LAST_DOC_DETAILS_KEY = "iris_last_used_doc_details";
const LAST_IRN_KEY = "iris_last_used_irn";
const LAST_SIGNED_QR_JWT_KEY = "iris_last_signed_qr_jwt";
const LAST_EWB_DETAILS_KEY = "iris_last_ewb_details";

// ==================== SANITIZERS ====================
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
    <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={tableStyles.select}>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </label>
);

const createBasePayload = (invoiceData = {}, dynamicId, selectedCatg = "B2B") => {
 const inv = invoiceData;
 const pid = dynamicId

console.log("📦 FULL INVOICE:", inv);

const selectedTrnTyp = inv?.transactionType || "REG";
console.log("🚚 Transaction Type:", selectedTrnTyp);

const sellerGstin =
  inv?.companyBranches?.gstin || "01AAACI9260R002";
console.log("🏭 Seller GSTIN:", sellerGstin);

const sellerStateCode = sellerGstin.substring(0, 2);
console.log("🏭 Seller State Code:", sellerStateCode);

let buyerGstin = inv?.buyerClients?.gstin || "";
console.log("🧾 Raw Buyer GSTIN:", buyerGstin);

if (selectedCatg === "B2B" && (!buyerGstin || buyerGstin === "URP")) {
  buyerGstin = "02AAACI9260R002";
  console.log("🔁 B2B fallback Buyer GSTIN applied:", buyerGstin);
} else if (selectedCatg === "B2C") {
  buyerGstin = "URP";
  console.log("🔁 B2C Buyer GSTIN set to URP");
}

const buyerStateCode =
  buyerGstin !== "URP" ? buyerGstin.substring(0, 2) : "02";
console.log("🏢 Buyer State Code:", buyerStateCode);

const isInterState = sellerStateCode !== buyerStateCode;
console.log("🌐 Is InterState:", isInterState);

const productList =
  inv?.invoiceProductDetails?.length > 0
    ? inv.invoiceProductDetails
    : [];

console.log("📦 Product List Count:", productList.length);
console.log("📦 Product List:", productList);

  const totTxVal = Number(productList.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0).toFixed(2));
  const totIgst = Number(productList.reduce((sum, item) => sum + Number(item.igstAmount || 0), 0).toFixed(2));
  const totCgst = Number(productList.reduce((sum, item) => sum + Number(item.cgstAmount || 0), 0).toFixed(2));
  const totSgst = Number(productList.reduce((sum, item) => sum + Number(item.sgstAmount || 0), 0).toFixed(2));
  const totalInvVal = totTxVal + totIgst + totCgst + totSgst;

  const formatDate = (dateInput) => {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
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
    no: dynamicId ,
    dt: formatDate(inv?.dateofIssue || new Date()),
    pos: buyerStateCode,
    rchrg: "N",
    taxSch: "GST",
    fy: inv?.tYear || "26-27",

    // ================= SELLER =================
    sgstin: sellerGstin,
    strdNm: inv?.company_Name || "TEST Company",
    slglNm: inv?.company_Name  || "TEST PROD",
    sbnm: inv?.company_Name  || "Testing",
    sflno: "ABC",
    sloc: inv?.companyBranches?.poBox || "BANGALOR32",
    sdst: inv?.company_State|| "BENGALURU",
    sstcd: sellerStateCode,
    spin: inv?.companyBranches?.pinCode || inv?.companyBranches?.poBoxCode || "500016",
    sph: inv?.companyBranches?.mobile || "123456111111",
    sem: inv?.companyBranches?.email || "abc123@gmail.com",

    // ================= BUYER =================
    bgstin: buyerGstin,
    btrdNm: inv?.buyerClients?.companyName || "TEST ENTERPRISES",
    blglNm: inv?.buyerClients?.companyName || "TEST PRODUCT01",
    bbnm: inv?.buyerClients?.companyName || "ABCD12345",
    bflno: "abc",
    bloc: inv?.buyerClients?.officeAddress || "Jijamat",
    bdst: inv?.buyerClients?.masterStateNames?.stateName || "BANGALORE",
    bstcd: buyerStateCode,
    bpin: inv?.buyerClients?.poBox || "174071",
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
    transDocNo: inv?.pid ? `INV-${inv.pid}` : "INV-001",
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
      prdNm: item?.description || item?.prdNm || "New Product",
      //prdDesc: "-",
      hsnCd: item?.hsncode || "73041190",
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
      itmVal: Number(item?.totalAmount || 0) + (isInterState ? Number(item?.igstAmount || 0) : (Number(item?.cgstAmount || 0) + Number(item?.sgstAmount || 0))),
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
const { token, companyId } = useAuth();
const { setLastInvoice } = useAuth();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [template, setTemplate] = useState("STANDARD");
  const [pdfMessage, setPdfMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("B2B");
  const [lastGeneratedId, setLastGeneratedId] = useState(null);
  const [genEwb, setGenEwb] = useState("Y");
  const location = useLocation();
  const [manualInvoiceId, setManualInvoiceId] = useState("");
  const receivedData = location.state || {};
  const invoiceData = location.state?.invoiceData || {};
  const dynamicId = receivedData.id || location.state?.pid;
  console.log("invoiceData",invoiceData);
  console.log("dynamicId ",dynamicId);

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

      if (field === "sgstin" && value?.length >= 2) {
        updated.sstcd = value.substring(0, 2);
      }

      if (field === "bgstin" && value?.length >= 2 && value !== "URP") {
        updated.bstcd = value.substring(0, 2);
      }

      return recalculateTotals(updated);
    });
  };

  const handleCategorySelectionChange = (category) => {
    setSelectedCategory(category);
    if (!invoiceData) return;
    const basePayload = createBasePayload(invoiceData, dynamicId, category);
    setPayload(recalculateTotals(basePayload));
  };

  useEffect(() => {
    if (!invoiceData) return;
    
    if (!initializedRef.current) {
      const basePayload = createBasePayload(invoiceData, dynamicId, selectedCategory);
      setPayload(recalculateTotals(basePayload));
      initializedRef.current = true;
    }
  }, [invoiceData, dynamicId, selectedCategory, recalculateTotals]);

  const addItem = () => {
    setPayload((prev) => {
      const productList = invoiceData?.invoiceProductDetails || [];
      const index = prev.itemList.length;
      const product = productList[index] || productList[0];

      const newItem = {
        num: String(index + 1).padStart(5, "0"),
        prdNm: product?.description || product?.prdNm || "New Product",
        //prdDes: "- ",
        hsnCd: product?.hsncode || "73041190",
        qty: 1,
        unit: sanitizeUQC(product?.uom),
        unitPrice: Number(product?.quantityAmount || product?.unitPrice || 100),
        rt: Number(product?.gstPer || product?.gstRate || 18),
        txval: 0,
        iamt: 0,
        camt: 0,
        samt: 0,
        itmVal: 0,
      };

      return recalculateTotals({
        ...prev,
        itemList: [...prev.itemList, newItem],
      });
    });
  };

  const updateItem = (idx, field, value) => {
    setPayload((prev) => {
      const list = [...prev.itemList];
      if (!list[idx]) return prev;

      list[idx] = { ...list[idx], [field]: value };
      return recalculateTotals({ ...prev, itemList: list });
    });
  };

  const removeItem = (idx) => {
    setPayload((prev) => {
      const filtered = prev.itemList.filter((_, i) => i !== idx);
      return recalculateTotals({ ...prev, itemList: filtered });
    });
  };
  const storeEinv = (apiResponse) => {
  if (!apiResponse?.id || !payload?.no) return;

  const entry = {
    docNo: payload.no?.trim(),
    einvId: String(apiResponse.id),
    createdAt: new Date().toISOString(),
  };

  const existing = JSON.parse(localStorage.getItem(EINV_DOC_KEY)) || [];

  const filtered = existing.filter(
    (e) => e.docNo !== entry.docNo && e.einvId !== entry.einvId
  );

  localStorage.setItem(
    EINV_DOC_KEY,
    JSON.stringify([...filtered, entry])
  );
};

const saveResponseForAutoPopulate = (data) => {
  if (!data?.response) return;

  const responseData = data.response;

  try {
    // ID
    if (responseData.id) {
      localStorage.setItem(
        LAST_GENERATED_ID_KEY,
        String(responseData.id)
      );
    }

    // IRN
    localStorage.setItem(
      LAST_IRN_KEY,
      JSON.stringify({
        irn: responseData.irn,
        timestamp: new Date().toISOString(),
      })
    );

    // QR
    if (responseData.signedQrCode) {
      localStorage.setItem(
        LAST_SIGNED_QR_JWT_KEY,
        responseData.signedQrCode
      );
    }

    // EWB
    localStorage.setItem(
      LAST_EWB_DETAILS_KEY,
      JSON.stringify({
        ewbNo: responseData.ewbNo || "",
        ewbDate: responseData.ewbDate || "",
        timestamp: new Date().toISOString(),
      })
    );

    // DOC
    localStorage.setItem(
      LAST_DOC_DETAILS_KEY,
      JSON.stringify({
        docNum: payload.no?.trim(),
        docDate: payload.dt?.trim(),
        docType: payload.docType,
        timestamp: new Date().toISOString(),
      })
    );

    // FULL RESPONSE (single source of truth)
    localStorage.setItem(
      STORAGE_KEY2,
      JSON.stringify({
        ...responseData,
        userGstin: payload.userGstin,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error("Failed to save response:", e);
  }

  // AUTH sync (sessionStorage only)
  try {
    const { token, companyId } = getAuthData();

    sessionStorage.setItem(
      "iris_einvoice_session",
      JSON.stringify({ token, companyId })
    );
  } catch (e) {
    console.error("Auth sync failed:", e);
  }

  if (typeof setLastInvoice === "function") {
    setLastInvoice(
      responseData.irn,
      payload.userGstin,
      payload.no,
      payload.dt,
      payload.docType
    );
  }
};

const getAuthData = () => {
  try {
    const auth = JSON.parse(
      sessionStorage.getItem("iris_einvoice_session") || "{}"
    );
    return {
      token: auth.token || "",
      companyId: auth.companyId || "24",
    };
  } catch (e) {
    return { token: "", companyId: "24" };
  }
};

 const handleGenerate = async () => {
   //const { token, companyid } = useAuth(); // ✅ SESSION STORAGE
  console.log("tokenvalue",token)
  console.log("companyIdvalue",companyId)
  if (!token) {
    alert("Login required!");
    return;
  }

  setLoading(true);
  setResponse(null);

  try {
   const finalPayload = recalculateTotals({
  ...payload,
  genewb: payload.genewb || "Y",
});

    const res = await fetch(
      "https://einvoice.fcssoftwares.com/api/gst/einvoice/generate-irn",
      // Api for local node.js is  http://localhost:3001/proxy/irn/addInvoice
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": token,
          companyId: companyId,
          product: "ONYX",
        },
        body: JSON.stringify(finalPayload),
      }
    );

    const data = await res.json();
    setResponse(data);

    const generatedId =
      data?.response?.id ||
      data?.response?.Id ||
      data?.response?.irn ||
      data?.response?.invoiceId;

    if (generatedId) setLastGeneratedId(generatedId);

    if (data?.status === "SUCCESS" && data?.response?.irn) {
      saveResponseForAutoPopulate(data);
      storeEinv(data.response);
      sessionStorage.setItem(STORAGE_KEY2, JSON.stringify(data));

      alert(`✅ IRN Generated Successfully!\nIRN: ${data.response.irn}`);
    } else if (data?.response?.id || data?.response?.irn) {
      alert(
        `⚠️ Warning: ${
          data?.errors?.[0]?.msg || "Operation completed with warning"
        }`
      );
    } else {
      alert(
        data?.status === "FAILURE"
          ? `❌ Failed: ${data?.errors?.[0]?.msg || "Unknown error"}`
          : "Unexpected response"
      );
    }
  } catch (err) {
    alert("Network error: " + err.message);
  } finally {
    setLoading(false);
  }
};
 
  /// downloading the pdf of invoice with respect to last generated id of invoice
 const downloadPDF = async () => {
  // If no invoice was generated yet, use the local form ID payload as sandbox template baseline
const finalInvoiceId =
  manualInvoiceId.trim() ||
  lastGeneratedId ||
  response?.response?.id ||
  response?.response?.Id ||
  payload?.id ||
  "1001";

  try {
    setPdfMessage("Processing PDF download...");

    // API URL
    const url = `https://einvoice.fcssoftwares.com/api/gst/einvoice/print?id=${finalInvoiceId}`;

    const resp = await axios.get(url, {
      headers: {
        "X-Auth-Token": token,
        companyId: companyId,
        product: "ONYX",
      },
      responseType: "blob",
    });

    // Create blob URL for download
    const blobUrl = window.URL.createObjectURL(
      new Blob([resp.data], { type: "application/pdf" })
    );

    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", `EInvoice_${finalInvoiceId}.pdf`);

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    setPdfMessage("✅ PDF downloaded successfully.");
  } catch (error) {
    console.error(error);
    setPdfMessage("❌ Failed to download PDF.");
  }
};

  return (
    <div style={tableStyles.container}>
      <h1 style={tableStyles.header}>Dynamic E-Invoice Generator ({selectedCategory} Mode)</h1>
      <div style={{ marginBottom: "20px" }}>
  <label><strong>Generate E-Way Bill:</strong></label>

  <select
    value={genEwb}
    onChange={(e) => setGenEwb(e.target.value)}
    style={tableStyles.select}
  >
    <option value="Y">Yes</option>
    <option value="N">No</option>
  </select>
</div>

      {/* ==================== META CONFIGURATION ==================== */}
      <table style={tableStyles.table}>
        <thead>
          <tr><th colSpan={4} style={tableStyles.th}>Document Meta Configuration</th></tr>
        </thead>
        <tbody>
          <tr>
            <td style={tableStyles.td}>
              <LabeledSelect label="Invoice Scenario Category" value={selectedCategory} options={["B2B", "B2C", "EXP"]} onChange={handleCategorySelectionChange} />
            </td>
            <td style={tableStyles.td}>
              <LabeledSelect label="Transaction Type" value={payload.trnTyp || "REG"} options={["REG", "BILLTO_SHIPTO", "BILLFROM_DISPATCHFROM"]} onChange={(v) => setField("trnTyp", v)} />
            </td>
            <td style={tableStyles.td}><LabeledInput label="User GSTIN" value={payload.userGstin} onChange={(v) => setField("userGstin", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="Document Type" value={payload.docType} onChange={(v) => setField("docType", v)} /></td>
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

      {/* ==================== SELLER & BUYER INFORMATION ==================== */}
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

      {/* ==================== DISPATCH & SHIP TO ==================== */}
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
        <div style={{ ...tableStyles.col }}>
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

      {/* ==================== ITEM MANAGEMENT ==================== */}
      <div style={{ marginTop: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3>Line Items Spreadsheet</h3>
          <button style={tableStyles.btnGreen} onClick={addItem}>+ Add Document Row Item</button>
        </div>

        {payload.itemList?.map((item, idx) => (
          <div key={idx} style={tableStyles.itemCard}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "15px" }}>
              <LabeledInput label="Product Name" value={item.prdNm} onChange={(v) => updateItem(idx, "prdNm", v)} />
                <LabeledInput label="Product Desription" value={item.prdNm} onChange={(v) => updateItem(idx, "prdNm", v)} />
              <LabeledInput label="HSN Code" value={item.hsnCd} onChange={(v) => updateItem(idx, "hsnCd", v)} />
              <LabeledInput label="Quantity" type="number" value={item.qty} onChange={(v) => updateItem(idx, "qty", v)} />
              <LabeledInput label="Unit Price" type="number" step="0.01" value={item.unitPrice} onChange={(v) => updateItem(idx, "unitPrice", v)} />
            </div>

            <div style={{ fontSize: "12px", color: "#666", background: "#f1f3f4", padding: "8px 12px", borderRadius: "4px" }}>
              Calculated Breakdown: CGST: ₹{item.camt || 0} | SGST: ₹{item.samt || 0} | IGST: ₹{item.iamt || 0}
            </div>
          </div>
        ))}
      </div>

      {/* ==================== TOTALS BREAKDOWN ==================== */}
      <div style={{ margin: "30px 0", background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <h3>Consolidated Invoice Aggregations</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "20px", marginTop: "15px" }}>
          <div><strong>Total Taxable Value:</strong> <p>₹{payload.tottxval || 0}</p></div>
          <div><strong>Total CGST:</strong> <p>₹{payload.totcamt || 0}</p></div>
          <div><strong>Total SGST:</strong> <p>₹{payload.totsamt || 0}</p></div>
          <div><strong>Total IGST:</strong> <p>₹{payload.totiamt || 0}</p></div>
          <div><strong>Net Gross Invoice Value:</strong> <p style={{ color: colors.primary, fontWeight: "bold" }}>₹{payload.totinvval || 0}</p></div>
        </div>
      </div>

      {/* ==================== ACTION CONSOLE ==================== */}
<div style={{ marginTop: "40px", padding: "20px", background: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
  
  {/* Primary Action Button Row Container */}
  <div style={{ textAlign: "center", marginBottom: "20px" }}>
    <button 
      style={tableStyles.btnGenerate(loading, token)} 
      onClick={handleGenerate}
      disabled={loading || !token}
    >
      {loading ? "Registering Invoice Core..." : "🚀 Generate IRN / E-Invoice"}
    </button>
  </div>

  {/* Conditional Template Export UI Controls Wrapper */}
  {(lastGeneratedId || 
    response?.status === "SUCCESS" || 
    response?.response?.id || 
    response?.response?.Id || 
    response?.response?.irn) && (
    <div style={{ 
      display: "flex", 
      gap: "15px", 
      alignItems: "center", 
      justifyContent: "center", 
      borderTop: "1px dashed #ccc", 
      paddingTop: "20px" 
    }}>
      <div style={{ width: "250px" }}>
        <select 
          style={tableStyles.select} 
          value={template} 
          onChange={(e) => setTemplate(e.target.value)}
        >
          <option value="STANDARD">Standard Layout</option>
          <option value="CLASSIC">Classic Invoice</option>
          <option value="MODERN">Modern Minimalist</option>
        </select>
      </div>
      <button style={tableStyles.btnGreen} onClick={downloadPDF}>
        Download Tax PDF
      </button>
    </div>
  )}
  
  {pdfMessage && <p style={{ marginTop: "15px", textAlign: "center", color: "#555", fontSize: "14px" }}>{pdfMessage}</p>}
</div>
    </div>
  );
};  
export default GenerateAndPrintEinvoice;

