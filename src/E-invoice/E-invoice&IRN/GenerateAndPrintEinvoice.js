import React, { useState, useEffect, useCallback } from "react";
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
// ==================== SANITIZERS ====================
const sanitizeSubSupplyType = (type, supplyType = "Outward") => {
  let clean = String(type || "").trim();
  
  // If already a valid number string
  if (/^(1[0-2]|[1-9])$/.test(clean)) {
    return clean;                    // Return as STRING
  }

  // Common mappings
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

  return "1";   // Default: Supply
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
    <label htmlFor={id}>
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
  <label htmlFor={id}>
    <span style={tableStyles.labelText}>{label}</span>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} style={tableStyles.select}>
      {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </label>
);

const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const createBasePayload = (
  invoiceData = {},
  dynamicId,
  selectedCatg = "B2B"
) => {
  // =========================================================
  // HELPERS
  // =========================================================
  const inv = invoiceData;   // ← Use this instead of 'invoice'
  const formatDate = (date) => {
    if (!date) {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }

    if (typeof date === "string" && date.includes("-")) {
      return date;
    }

    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
  };

  const sellerStateCode = "29";

  const invoiceDate = formatDate(
    invoiceData?.invoiceDate || new Date()
  );

  const transportDocDate = formatDate(
    invoiceData?.transportDocDate ||
      invoiceData?.invoiceDate ||
      new Date()
  );

  const isExport = selectedCatg === "EXP";

  // =========================================================
  // TRANSACTION TYPES
  // =========================================================
  // REG
  // BILLTO_SHIPTO
  // BILLFROM_DISPATCHFROM
  // =========================================================

  const selectedTrnTyp =
    invoiceData?.transactionType || "REG";

  const isRegular = selectedTrnTyp === "REG";

  const isBillToShipTo =
    selectedTrnTyp === "BILLTO_SHIPTO";

  const isBillFromDispatchFrom =
    selectedTrnTyp === "BILLFROM_DISPATCHFROM";

  // =========================================================
  // BUYER GSTIN
  // =========================================================

  let buyerGstin = "URP";

  if (selectedCatg === "B2B") {
    buyerGstin =
      invoiceData?.gstin?.length === 15
        ? invoiceData.gstin
        : "27ABCDE1234F1Z5";
  }

  const buyerStateCode =
    buyerGstin !== "URP"
      ? buyerGstin.substring(0, 2)
      : invoiceData?.buyerStateCode || "27";

  const isInterState =
    sellerStateCode !== buyerStateCode;

  // =========================================================
  // PRODUCTS
  // =========================================================

  const productList =
    invoiceData?.invoiceProductDetails?.length > 0
      ? invoiceData.invoiceProductDetails
      : [
          {
            hsnCode: "73041190",
            itemName: "SEAMLESS STEEL TUBE",
            quantity: 1,
            totalAmount: 3322.45,
            igstAmount: 598.04,
            cgstAmount: 0,
            sgstAmount: 0,
            gstPer: 18,
            uom: "NOS",
            discount: 0,
          },
        ];

  // =========================================================
  // TOTALS
  // =========================================================

  const totTxVal = Number(
    productList
      .reduce(
        (sum, item) =>
          sum + Number(item.totalAmount || 0),
        0
      )
      .toFixed(2)
  );

  const totIgst = Number(
    productList
      .reduce(
        (sum, item) =>
          sum + Number(item.igstAmount || 0),
        0
      )
      .toFixed(2)
  );

  const totCgst = Number(
    productList
      .reduce(
        (sum, item) =>
          sum + Number(item.cgstAmount || 0),
        0
      )
      .toFixed(2)
  );

  const totSgst = Number(
    productList
      .reduce(
        (sum, item) =>
          sum + Number(item.sgstAmount || 0),
        0
      )
      .toFixed(2)
  );

  const totalDiscount = Number(
    invoiceData?.totalDiscount || 0
  );

  const otherCharges = Number(
    invoiceData?.otherCharges || 0
  );

  const totalInvVal = Number(
    (
      totTxVal +
      totIgst +
      totCgst +
      totSgst +
      otherCharges -
      totalDiscount
    ).toFixed(2)
  );

  // =========================================================
  // SAFE EWB DISTANCE
  // =========================================================

  let transportDistance = Number(
    invoiceData?.transportDistance || 120
  );

  if (transportDistance <= 0) {
    transportDistance = 120;
  }

  if (transportDistance > 4000) {
    transportDistance = 4000;
  }

  // =========================================================
  // PAYLOAD
  // =========================================================

return {
  // =====================================================
  // BASIC
  // =====================================================

  id: String(inv?.refID || dynamicId || "1001"),

  userGstin: inv?.companyBranches?.gstin || null,

  pobCode: null,

  supplyType: isExport
    ? "EXP"
    : inv?.transactionStatusXid === 2
      ? "Outward"
      : "Outward",

  ntr: isInterState ? "Inter" : "Intra",

  docType: "RI",

  catg: selectedCatg === "B2C" ? "B2CS" : selectedCatg,

  dst: "O",

  trnTyp: selectedTrnTyp,

  no: inv?.refID ? `INV-${inv.refID}` : null,

  dt: inv?.dateofIssue,

  refinum: null,
  refidt: null,

  pos: inv?.buyerClients?.stateXid,

  diffprcnt: null,
  etin: null,

  rchrg: "N",

  // =====================================================
  // SELLER
  // =====================================================

  sgstin: inv?.companyBranches?.gstin,
  strdNm: inv?.companyBranches?.companyTallyName,
  slglNm: inv?.companyBranches?.nameEng,
  sbnm: inv?.companyBranches?.companySignature,
  sflno: null,
  sloc: inv?.companyBranches?.poBox,
  sdst: inv?.companyBranches?.stateNames?.stateName,
  sstcd: inv?.companyBranches?.stateXid,
  spin: null,
  sph: inv?.companyBranches?.mobile,
  sem: inv?.companyBranches?.email,

  // =====================================================
  // BUYER
  // =====================================================

  bgstin: inv?.buyerClients?.gstin,
  btrdNm: inv?.buyerClients?.companyName,
  blglNm: inv?.buyerClients?.companyName,
  bbnm: inv?.buyerClients?.poBox,
  bflno: null,
  bloc: inv?.buyerClients?.officeAddress,
  bdst: inv?.buyerClients?.masterStateNames?.stateName,
  bstcd: inv?.buyerClients?.stateXid,
  bpin: inv?.buyerClients?.poBox,
  bph: inv?.buyerClients?.mobile,
  bem: inv?.buyerClients?.email,

  // =====================================================
  // DISPATCH
  // =====================================================

  dgstin: inv?.companyBranches?.gstin,
  dtrdNm: inv?.companyBranches?.companyTallyName,
  dlglNm: inv?.companyBranches?.nameEng,
  dbnm: null,
  dflno: null,
  dloc: inv?.companyBranches?.poBox,
  ddst: null,
  dstcd: inv?.companyBranches?.stateXid,
  dpin: null,
  dph: inv?.companyBranches?.mobile,
  dem: inv?.companyBranches?.email,

  // =====================================================
  // SHIP TO
  // =====================================================

  togstin: inv?.buyerClients?.gstin,
  totrdNm: inv?.buyerClients?.companyName,
  tolglNm: inv?.buyerClients?.companyName,
  tobnm: inv?.buyerClients?.poBox,
  toflno: null,
  toloc: inv?.buyerClients?.officeAddress,
  todst: inv?.buyerClients?.masterStateNames?.stateName,
  tostcd: inv?.buyerClients?.stateXid,
  topin: inv?.buyerClients?.poBox,
  toph: inv?.buyerClients?.mobile,
  toem: inv?.buyerClients?.email,

  // =====================================================
  // EXPORT
  // =====================================================

  sbnum: isExport ? `SB${inv?.refID || "000001"}` : null,
  sbdt: isExport ? inv?.dateofIssue : null,
  port: isExport ? "INMAA1" : null,
  expduty: isExport ? 0 : null,
  cntcd: isExport ? "IN" : null,
  forCur: isExport ? "INR" : null,
  invForCur: isExport ? totalInvVal : null,

  // =====================================================
  // TOTALS
  // =====================================================

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

  // =====================================================
  // PAYMENT
  // =====================================================

  payNm: inv?.companyBranchesBank?.[0]?.bankName,
  acctdet: inv?.companyBranchesBank?.[0]?.accountNo,
  pa: null,
  mc: null,
  mode: "1",
  ifsc: inv?.companyBranchesBank?.[0]?.ifscCode,

  paidAmt: totalInvVal,
  balAmt: 0,

  // =====================================================
  // TRANSPORT / EWAY BILL
  // =====================================================

  transId: inv?.companyBranches?.gstin,
  subSplyTyp: "Supply",
  subSplyDes: null,

  transMode: "1",
  vehTyp: "R",
  transDist: transportDistance,

  transName: "FastTrack Logistics",

  transDocNo: inv?.invoiceProductDetails?.[0]?.pid
    ? `DOC${inv.invoiceProductDetails[0].pid}`
    : "DOC001",

  transDocDate: transportDocDate,

  vehNo: inv?.vehicleNo,

  // =====================================================
  // FLAGS
  // =====================================================

  fy: inv?.tYear || "2025-26",
  genIrn: true,
  genewb: "Y",
  signedDataReq: true,

  // =====================================================
  // ITEMS
  // =====================================================

  itemList: (inv?.invoiceProductDetails || []).map((item, index) => {
    const txVal = Number(item?.totalAmount || 0);
    const rate = Number(item?.gstPer || 18);

    return {
      num: String(index + 1).padStart(5, "0"),
      hsnCd: item?.hsncode || "0000",
      prdNm: item?.itemName,
      prdDesc: item?.description,
      qty: Number(item?.quantity || 1),
      freeQty: 0,
      unit: item?.uom,
      unitPrice: Number(item?.quantityAmount || 0),

      totAmt: txVal,
      discount: 0,
      preTaxVal: txVal,
      assAmt: txVal,
      txval: txVal,

      rt: rate,

      irt: isInterState ? rate : 0,
      crt: !isInterState ? rate / 2 : 0,
      srt: !isInterState ? rate / 2 : 0,

      iamt: isInterState ? item?.igstAmount : 0,
      camt: !isInterState ? item?.cgstAmount : 0,
      samt: !isInterState ? item?.sgstAmount : 0,

      csamt: 0,
      othChrg: 0,

      itmVal: Number(
        (
          txVal +
          (item?.igstAmount || 0) +
          (item?.cgstAmount || 0) +
          (item?.sgstAmount || 0)
        ).toFixed(2)
      ),

      isServc: "N",
      orgCntry: "IN",
    };
  }),

  // =====================================================
  // OPTIONAL
  // =====================================================

  invOthDocDtls: [
    {
      url: "https://www.google.com",
      docs: "Tax Invoice",
      infoDtls: "System Generated",
    },
  ],

  invRefPreDtls: [{ oinum: null, oidt: null, othRefNo: null }],

  invRefContDtls: [
    {
      raref: null,
      radt: null,
      tendref: null,
      contref: null,
      extref: null,
      projref: null,
      poref: null,
      porefdt: null,
    },
  ],
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
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("B2B");
  const location = useLocation();

  const receivedData = location.state || {};
  const invoiceData = receivedData.invoiceData || {};
  const dynamicId = receivedData.id || invoiceData.pid;

    // ==================== RECALCULATE TOTALS ====================
  const recalculateTotals = (currentPayload) => {
    if (!currentPayload?.itemList) {
      return currentPayload;
    }

    let totalTaxableValue = 0;
    let totalIGST = 0;

    const updatedItems = currentPayload.itemList.map((item) => {
      const qty = Number(item.qty) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const igstRate = Number(item.irt) || 0;

      const txval = Number((qty * unitPrice).toFixed(2));
      const iamt = Number((txval * (igstRate / 100)).toFixed(2));
      const itmVal = Number((txval + iamt).toFixed(2));

      totalTaxableValue += txval;
      totalIGST += iamt;

      return {
        ...item,
        txval,
        sval: txval,           // alias for taxable value
        iamt,
        itmVal,
        // Reset other tax fields (as per your original logic)
        camt: 0,
        samt: 0,
        csamt: 0,
      };
    });

    const discount = Number(currentPayload.totdisc) || 0;
    const otherCharges = Number(currentPayload.totothchrg) || 0;

    const tottxval = Number(totalTaxableValue.toFixed(2));
    const totiamt = Number(totalIGST.toFixed(2));
    const totinvval = Number((
      tottxval +
      totiamt +
      otherCharges -
      discount
    ).toFixed(2));

    return {
      ...currentPayload,
      itemList: updatedItems,
      tottxval,
      totiamt,
      totinvval,
      totcamt: 0,
      totsamt: 0,
      totcsamt: 0,
      totstcsamt: 0,
    };
  };

   // ==================== PAYLOAD STATE ====================
  const [payload, setPayload] = useState({ 
    itemList: [] 
  });

  // ==================== INITIALIZE PAYLOAD ====================
  useEffect(() => {
    const dataToUse = invoiceApiData || invoiceData;
    
    if (!dataToUse) return;

    try {
      const basePayload = createBasePayload(dataToUse, selectedCategory || "B2B");
      const initializedPayload = recalculateTotals(basePayload);
      
      setPayload(initializedPayload);
    } catch (err) {
      console.error("Error initializing payload:", err);
    }
  }, [
    invoiceApiData, 
    invoiceData, 
    selectedCategory, 
    createBasePayload, 
    recalculateTotals
  ]);



  // ==================== HELPER FUNCTIONS ====================
  const setField = (field, value) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (idx, field, value) => {
    setPayload((prev) => {
      if (!prev.itemList || !prev.itemList[idx]) return prev;

      const newPayload = { ...prev };
      newPayload.itemList = [...prev.itemList];
      newPayload.itemList[idx] = { 
        ...newPayload.itemList[idx], 
        [field]: value 
      };

      return recalculateTotals(newPayload);
    });
  };

  const handleCategorySelectionChange = (category) => {
    setSelectedCategory(category);

    const dataToUse = invoiceApiData || invoiceData;
    if (!dataToUse) return;

    const basePayload = createBasePayload(dataToUse, category);
    setPayload(recalculateTotals(basePayload));
  };

  // ==================== INITIAL PAYLOAD SETUP ====================
  useEffect(() => {
    const dataToUse = invoiceApiData || invoiceData;
    if (dataToUse) {
      const basePayload = createBasePayload(dataToUse, "B2B");
      setPayload(recalculateTotals(basePayload));
    }
  }, [invoiceApiData, invoiceData, createBasePayload, recalculateTotals]);

   // ==================== ITEM MANAGEMENT ====================
  const addItem = () => {
    setPayload((prev) => {
      const newItem = {
        num: String(prev.itemList.length + 1).padStart(5, "0"),
        hsnCd: "84713010",
        prdNm: "New Service/Product",
        qty: 1,
        unit: "NOS",
        unitPrice: 100,
        irt: 18,
        rt: 18,
        txval: 0,
        iamt: 0,
        itmVal: 0,
        discount: 0,
        othChrg: 0,
        camt: 0,
        csamt: 0,
        srt: 0,
        crt: 0,
        freeQty: 0,
        preTaxVal: 0,
        isServc: "N",
        orgCntry: "IN",
      };

      const updatedPayload = {
        ...prev,
        itemList: [...prev.itemList, newItem],
      };

      return recalculateTotals(updatedPayload);
    });
  };

  const removeItem = (idx) => {
    setPayload((prev) => {
      if (!prev.itemList || prev.itemList.length <= 1) return prev; // Prevent removing last item

      const updatedPayload = {
        ...prev,
        itemList: prev.itemList.filter((_, i) => i !== idx),
      };

      return recalculateTotals(updatedPayload);
    });
  };

  // ==================== STORAGE & RESPONSE HANDLERS ====================
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

    localStorage.setItem(EINV_DOC_KEY, JSON.stringify([...filtered, entry]));
  };

  const saveResponseForAutoPopulate = (data) => {
    if (!data?.response) return;

    const responseData = data.response;

    // Save Last Generated ID
    if (responseData.id) {
      localStorage.setItem(LAST_GENERATED_ID_KEY, String(responseData.id));
    }

    // Save Shared Config
    const sharedData = JSON.parse(localStorage.getItem(STORAGE_KEY1) || "{}");
    sharedData.companyId = "24";
    sharedData.token = token;
    sharedData.irn = responseData.irn;
    sharedData.companyUniqueCode = payload.userGstin;
    sharedData.lastGeneratedResponse = responseData;
    sharedData.lastGeneratedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY1, JSON.stringify(sharedData));

    // Save Document Details
    localStorage.setItem(
      LAST_DOC_DETAILS_KEY,
      JSON.stringify({
        docNum: payload.no?.trim(),
        docDate: payload.dt?.trim(),
        docType: payload.docType,
        timestamp: new Date().toISOString(),
      })
    );

    // Save IRN
    localStorage.setItem(
      LAST_IRN_KEY,
      JSON.stringify({
        irn: responseData.irn,
        timestamp: new Date().toISOString(),
      })
    );

    // Save Signed QR (if available)
    if (responseData.signedQrCode) {
      localStorage.setItem(LAST_SIGNED_QR_JWT_KEY, responseData.signedQrCode);
    }

    // Save EWB Details
    localStorage.setItem(
      LAST_EWB_DETAILS_KEY,
      JSON.stringify({
        ewbNo: responseData.ewbNo || "",
        ewbDate: responseData.ewbDate || "",
        timestamp: new Date().toISOString(),
      })
    );

    // Update Auth Context
    setLastInvoice?.(
      responseData.irn,
      payload.userGstin,
      payload.no,
      payload.dt,
      payload.docType
    );
  };
  // ==================== FETCH INVOICE DATA ====================
  const fetchInvoiceData = useCallback(async () => {
    if (!dynamicId) return;

    setLoadingInvoice(true);
    setError("");

    try {
      console.log("🔄 Fetching invoice data for ID:", dynamicId);

      const res = await axios.get(`http://localhost:3001/api/invoice/${dynamicId}`);

      const encryptedData = res?.data?.data?.data;

      if (!encryptedData) {
        throw new Error("Invoice encrypted data not found");
      }

      // Base64 URL Decode Function
      const base64UrlDecode = (data) => {
        try {
          let decoded = data.replace(/-/g, "+").replace(/_/g, "/");
          while (decoded.length % 4) decoded += "=";
          return atob(decoded);
        } catch (err) {
          console.warn("Base64 decode failed:", err);
          return null;
        }
      };

      const decodedString = base64UrlDecode(encryptedData);

      let actualInvoiceData;
      try {
        actualInvoiceData = JSON.parse(decodedString);
      } catch (err) {
        console.warn("JSON parse failed, storing raw data");
        actualInvoiceData = {
          rawEncrypted: encryptedData,
          decodedRaw: decodedString,
        };
      }

      setInvoiceApiData(actualInvoiceData);

      // Create and set payload
      const basePayload = createBasePayload(actualInvoiceData, selectedCategory);
      const finalPayload = recalculateTotals(basePayload);

      setPayload(finalPayload);

      console.log("✅ Invoice data loaded successfully");

    } catch (err) {
      console.error("❌ Fetch Invoice Error:", err);
      setError(err.message || "Error fetching invoice data");
    } finally {
      setLoadingInvoice(false);
    }
  }, [dynamicId, selectedCategory, createBasePayload, recalculateTotals]);

  // ==================== INITIAL DATA LOAD ====================
  useEffect(() => {
    if (dynamicId) {
      fetchInvoiceData();
    }
  }, [dynamicId, fetchInvoiceData]);

  // ==================== HANDLE GENERATE E-INVOICE ====================
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

      // Extract generated ID
      const generatedId =
        data?.response?.id ||
        data?.response?.Id ||
        data?.response?.irn ||
        data?.response?.Irn ||
        data?.response?.invoiceId;

      if (generatedId) {
        setPayload((prev) => ({
          ...prev,
          lastGeneratedId: generatedId,
        }));
      }

      if (data?.status === "SUCCESS" && data?.response?.irn) {
        saveResponseForAutoPopulate(data);
        storeEinv(data.response);

        localStorage.setItem(STORAGE_KEY2, JSON.stringify(data));

        alert(`✅ IRN Generated Successfully!\nIRN: ${data.response.irn}`);
      } 
      else if (data?.status === "FAILURE") {
        const errorMsg = data?.errors?.[0]?.msg || "Unknown error";
        alert(`❌ Generation Failed: ${errorMsg}`);
      } 
      else {
        alert("Unexpected response from server");
      }
    } catch (err) {
      console.error("Generate Error:", err);
      setResponse({ status: "ERROR", error: err.message });
      alert("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

const downloadPDF = async () => {
  console.log("DOWNLOAD CLICKED");
  console.log("lastGeneratedId:", payload?.lastGeneratedId);

  if (!payload?.lastGeneratedId) {
    console.log("No Generated ID Found");
    return;
  }

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

    console.log("PDF RESPONSE:", resp);

    const blob = new Blob([resp.data], {
      type: "application/pdf",
    });

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

  return (
    <div style={tableStyles.container}>
      <h1 style={tableStyles.header}>Dynamic E-Invoice Generator ({selectedCategory} Mode)</h1>

      {/* Configuration & Meta Context Section */}
      <table style={tableStyles.table}>
        <thead>
          <tr>
            <th colSpan={3} style={tableStyles.th}>Document Meta Configuration</th>
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
            <td style={tableStyles.td}><LabeledInput label="User GSTIN" value={payload.userGstin} onChange={(v) => setField("userGstin", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="Document Type" value={payload.docType} onChange={(v) => setField("docType", v)} /></td>
          </tr>
          <tr>
            <td style={tableStyles.td}><LabeledInput label="Invoice Number" value={payload.no} onChange={(v) => setField("no", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="Invoice Date" value={payload.dt} onChange={(v) => setField("dt", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="Supply Type" value={payload.supplyType} onChange={(v) => setField("supplyType", v)} /></td>
          </tr>
        </tbody>
      </table>

      {/* Core Operational Details Layer */}
      <div style={tableStyles.twoColGrid}>
        <div style={tableStyles.col}>
          <h3>Seller Information</h3>
          <LabeledInput label="Seller GSTIN" value={payload.sgstin} onChange={(v) => setField("sgstin", v)} />
          <LabeledInput label="Trade Name" value={payload.strdNm} onChange={(v) => setField("strdNm", v)} />
          <LabeledInput label="Legal Name" value={payload.slglNm} onChange={(v) => setField("slglNm", v)} />
          <LabeledInput label="Location" value={payload.sloc} onChange={(v) => setField("sloc", v)} />
          <LabeledInput label="Pincode" value={payload.spin} onChange={(v) => setField("spin", v)} />
        </div>

        <div style={tableStyles.col}>
          <h3>Buyer Information</h3>
          <LabeledInput label="Buyer GSTIN" value={payload.bgstin} onChange={(v) => setField("bgstin", v)} />
          <LabeledInput label="Trade Name" value={payload.btrdNm} onChange={(v) => setField("btrdNm", v)} />
          <LabeledInput label="Legal Name" value={payload.blglNm} onChange={(v) => setField("blglNm", v)} />
          <LabeledInput label="Location" value={payload.bloc} onChange={(v) => setField("bloc", v)} />
          <LabeledInput label="Pincode" value={payload.bpin} onChange={(v) => setField("bpin", v)} />
        </div>
      </div>

      {/* Conditional UI Sub-systems Blocks Based on Scenario Selection */}
      {selectedCategory === "B2B" && (
        <div style={{ ...tableStyles.twoColGrid, marginTop: "30px" }}>
          <div style={tableStyles.col}>
            <h3>Dispatch Address Details</h3>
            <LabeledInput label="Dispatch GSTIN" value={payload.dgstin} onChange={(v) => setField("dgstin", v)} />
            <LabeledInput label="Legal Name" value={payload.dlglNm} onChange={(v) => setField("dlglNm", v)} />
            <LabeledInput label="Location" value={payload.dloc} onChange={(v) => setField("dloc", v)} />
            <LabeledInput label="Pincode" value={payload.dpin} onChange={(v) => setField("dpin", v)} />
          </div>

          <div style={tableStyles.col}>
            <h3>Ship To Address Details</h3>
            <LabeledInput label="Ship To GSTIN" value={payload.togstin} onChange={(v) => setField("togstin", v)} />
            <LabeledInput label="Legal Name" value={payload.tolglNm} onChange={(v) => setField("tolglNm", v)} />
            <LabeledInput label="Location" value={payload.toloc} onChange={(v) => setField("toloc", v)} />
            <LabeledInput label="Pincode" value={payload.topin} onChange={(v) => setField("topin", v)} />
          </div>
        </div>
      )}

      {/* Universal Dynamic Item Configuration Panel */}
      <h3 style={{ marginTop: "40px" }}>Item Line Execution List</h3>
      {payload.itemList.map((item, idx) => (
        <div key={idx} style={tableStyles.itemCard}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "15px" }}>
            <LabeledInput label="Product Name" value={item.prdNm} onChange={(v) => updateItem(idx, "prdNm", v)} />
            <LabeledInput label="HSN Code" value={item.hsnCd} onChange={(v) => updateItem(idx, "hsnCd", v)} />
            <LabeledInput label="Quantity" type="number" value={item.qty} onChange={(v) => updateItem(idx, "qty", v)} />
            <LabeledInput label="Unit Price" type="number" value={item.unitPrice} onChange={(v) => updateItem(idx, "unitPrice", v)} />
            <LabeledInput label="IGST Rate (%)" type="number" value={item.irt} onChange={(v) => updateItem(idx, "irt", v)} />
          </div>
          <div style={tableStyles.itemFooter}>
            <span>Taxable Value: ₹{item.txval} | Calculated Tax: ₹{item.iamt} | Unit: {item.unit}</span>
            {payload.itemList.length > 1 && (
              <button style={tableStyles.btnRed} onClick={() => removeItem(idx)}>Remove Item</button>
            )}
          </div>
        </div>
      ))}
      <button style={{ ...tableStyles.btnGreen, marginBottom: "30px" }} onClick={addItem}>+ Add Additional Item Row</button>

      {/* Financial Matrix Summary Section */}
      <table style={tableStyles.table}>
        <thead>
          <tr><th colSpan={4} style={tableStyles.th}>Invoice Values Calculations Matrix Summary</th></tr>
        </thead>
        <tbody>
          <tr>
            <td style={tableStyles.td}><LabeledInput label="Total Taxable Value" type="number" value={payload.tottxval} onChange={(v) => setField("tottxval", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="Total IGST Amount" type="number" value={payload.totiamt} onChange={(v) => setField("totiamt", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="Other Charges" type="number" value={payload.totothchrg} onChange={(v) => setField("totothchrg", v)} /></td>
            <td style={tableStyles.td}><LabeledInput label="Total Invoice Value" type="number" value={payload.totinvval} onChange={(v) => setField("totinvval", v)} /></td>
          </tr>
        </tbody>
      </table>

      {/* Primary Control Call to Action */}
      <div style={{ textAlign: "center", margin: "40px 0" }}>
        <button style={tableStyles.btnGenerate(loading, token)} disabled={loading || !token} onClick={handleGenerate}>
          {loading ? "Processing Payload..." : "Generate & Post E-Invoice"}
        </button>
      </div>

      {response && (
        <div style={{ marginTop: "30px" }}>
          <h3>System Transaction Response Object Log</h3>
          <pre style={tableStyles.responseBox(response?.status)}>{JSON.stringify(response, null, 2)}</pre>
          {response?.status === "SUCCESS" && (
            <div style={{ marginTop: "20px", display: "flex", gap: "15px" }}>
              <button style={tableStyles.btnGreen} onClick={downloadPDF}>Print Standard Template</button>
              <LabeledSelect label="Active PDF Template" value={template} options={["STANDARD", "MINIMALIST"]} onChange={setTemplate} />
            </div>
          )}
          {pdfMessage && <p style={{ color: colors.primary, marginTop: "10px" }}>{pdfMessage}</p>}
        </div>
      )}
    </div>
  );
};

export default GenerateAndPrintEinvoice;