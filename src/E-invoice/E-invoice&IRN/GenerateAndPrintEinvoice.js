import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../components/AuthContext";
import { useLocation } from "react-router-dom";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';


/* ================= COMPACT GOVERNMENT INVOICE STYLING SHEET ================= */

/* ================= TRADITIONAL BUSINESS ENTERPRISE STYLING RULE SETS ================= */
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#000000',
    backgroundColor: '#ffffff'
  },
  outerBorder: {
    borderWidth: 1,
    borderColor: '#000000',
    flexDirection: 'column'
  },
  titleBanner: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#000000',
    paddingVertical: 3,
    backgroundColor: '#fafafa'
  },
  mainTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 7,
    marginTop: 1,
    color: '#333333'
  },
  rowFlex: {
    flexDirection: 'row'
  },
  flexHalf: {
    width: '50%'
  },
  profileLeftBlock: {
    width: '55%',
    borderRightWidth: 1,
    borderColor: '#000000'
  },
  profileRightGrid: {
    width: '45%'
  },
  pad4: { padding: 4 },
  pad6: { padding: 6 },
  borderRight: { borderRightWidth: 1, borderColor: '#000000' },
  borderBottom: { borderBottomWidth: 1, borderColor: '#000000' },
  borderTop: { borderTopWidth: 1, borderColor: '#000000' },
  bold: { fontWeight: 'bold' },
  textLine: {
    marginBottom: 2,
    lineHeight: 1.2
  },
  companyName: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginBottom: 1
  },
  companySub: {
    fontSize: 7.5,
    color: '#333333',
    marginBottom: 3
  },
  labelHeader: {
    fontSize: 7,
    color: '#555555',
    fontWeight: 'bold'
  },
  valText: {
    fontSize: 8,
    marginTop: 1
  },
  sectionHeaderTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 3
  },
  partyName: {
    fontWeight: 'bold',
    fontSize: 8.5,
    marginVertical: 1
  },
  sectionBlock: {
    flexDirection: 'column'
  },
  tableContainer: {
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#000000'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#eaeaea',
    borderBottomWidth: 1,
    borderColor: '#000000',
    fontWeight: 'bold',
    paddingVertical: 3,
    textAlign: 'center'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dddddd',
    paddingVertical: 3,
    textAlign: 'center'
  },
  tableTotalRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000000',
    paddingVertical: 3,
    backgroundColor: '#fafafa',
    textAlign: 'center'
  },
  colSl: { width: '8%', borderRightWidth: 0.5, borderColor: '#eee' },
  colDesc: { width: '40%', textAlign: 'left', paddingLeft: 4, borderRightWidth: 0.5, borderColor: '#eee' },
  colHsn: { width: '12%', borderRightWidth: 0.5, borderColor: '#eee' },
  colQty: { width: '10%', borderRightWidth: 0.5, borderColor: '#eee' },
  colRate: { width: '10%', textAlign: 'right', paddingRight: 4, borderRightWidth: 0.5, borderColor: '#eee' },
  colPer: { width: '8%', borderRightWidth: 0.5, borderColor: '#eee' },
  colAmount: { width: '12%', textAlign: 'right', paddingRight: 4 },
  hsnTableContainer: {
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#000000',
    fontSize: 7.5
  },
  hsnTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#eaeaea',
    borderBottomWidth: 1,
    borderColor: '#000000',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  hsnTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#cccccc',
    textAlign: 'center'
  }
});
/* ================= COMPACT GOVERNMENT INVOICE STYLING SHEET ================= */
const pdfStyles = StyleSheet.create({
  page: {
    padding: 24,
    backgroundColor: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#222222',
  },
  container: {
    flexDirection: 'column',
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#111111',
    paddingBottom: 4,
    marginBottom: 10,
    alignItems: 'center',
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  sectionBlock: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: '#f2f2f2',
    padding: '3 6',
    borderWidth: 0.5,
    borderColor: '#cccccc',
    color: '#111111',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#cccccc',
    padding: 6,
  },
  leftColumn: {
    width: '78%',
  },
  rightColumn: {
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  irnText: {
    fontSize: 7.5,
    fontFamily: 'Courier',
  },
  textRow: {
    marginBottom: 2,
    lineHeight: 1.2,
  },
  boldLabel: {
    fontWeight: 'bold',
    color: '#000000',
  },
  inlineFieldsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '4 6',
    borderWidth: 0.5,
    borderColor: '#cccccc',
    borderTopWidth: 0,
  },
  invoiceDetailsContainer: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: '#cccccc',
    borderTopWidth: 0,
  },
  leftBox: {
    width: '50%',
    padding: 6,
    borderRightWidth: 0.5,
    borderRightColor: '#cccccc',
  },
  rightBox: {
    width: '50%',
    padding: 6,
  },
  boxTitle: {
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 4,
    fontSize: 9,
  },
  companyName: {
    fontWeight: 'bold',
    fontSize: 9,
    marginVertical: 1,
  },
  qrCode: {
    width: 75,
    height: 75,
  },
  table: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#cccccc',
    borderTopWidth: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    fontWeight: 'bold',
    paddingVertical: 4,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    paddingVertical: 4,
    textAlign: 'center',
  },
  colSl: { width: '6%' },
  colDesc: { width: '28%', textAlign: 'left', paddingLeft: 4 },
  colHsn: { width: '10%' },
  colQty: { width: '8%' },
  colUnit: { width: '8%' },
  colRate: { width: '12%', textAlign: 'right', paddingRight: 4 },
  colTaxable: { width: '12%', textAlign: 'right', paddingRight: 4 },
  colGstRate: { width: '6%' },
  colTotal: { width: '10%', textAlign: 'right', paddingRight: 4, fontWeight: 'bold' },

  matrixTable: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#cccccc',
    borderTopWidth: 0,
    textAlign: 'center',
  },
  matrixHeader: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    fontWeight: 'bold',
    paddingVertical: 4,
  },
  matrixRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  mCol: {
    width: '20%',
    fontSize: 8.5,
  },
  mColBold: {
    width: '20%',
    fontWeight: 'bold',
    fontSize: 9,
    color: '#000000',
  },
  footerBlock: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc',
    paddingTop: 8,
  },
  declaration: {
    width: '60%',
    fontSize: 7.5,
    fontStyle: 'italic',
    color: '#555555',
    lineHeight: 1.3,
  },
  signatureSection: {
    width: '35%',
    alignItems: 'center',
    textAlign: 'center',
  },
  signatureCompany: {
    fontWeight: 'bold',
    fontSize: 8,
  },
});

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

const createBasePayload = (invoiceData = {}, dynamicId, selectedCatg = "B2B",invoiceCreatedOn,refid01) => {
 const inv = invoiceData;
 const pid = dynamicId;
 const invoicedate=invoiceCreatedOn;

console.log("📦 FULL INVOICE:", inv);
console.log("📦 invoicenumber", inv.invoiceNumber);
console.log("📦 invoicedate", invoicedate);

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
  if (!dateInput) return "";

  // 1. Direct handle for native Date objects
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return "";
    const dd = String(dateInput.getDate()).padStart(2, "0");
    const mm = String(dateInput.getMonth() + 1).padStart(2, "0");
    const yyyy = dateInput.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  // 2. Normalize and check string formats
  const cleanInput = String(dateInput).trim();

  // Matches DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(cleanInput)) {
    const [dd, mm, yyyy] = cleanInput.split(/[\/\-]/);
    return `${dd.padStart(2, "0")}-${mm.padStart(2, "0")}-${yyyy}`;
  }

  // 3. Fallback for ISO strings (e.g., "2025-09-10T00:00:00.000Z")
  const date = new Date(cleanInput);
  if (isNaN(date.getTime())) return "";

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
};

  return {
    id: refid01,
    userGstin: sellerGstin,
    pobCode: null,
    supplyType: "O",
    ntr: isInterState ? "Inter" : "Intra",
    docType: "RI",
    catg: selectedCatg || "B2B",
    dst: "O",
    trnTyp: selectedTrnTyp,
    no: inv?.invoiceNumber,
    dt: formatDate(invoiceCreatedOn),
    pos: buyerStateCode,
    rchrg: "N",
    taxSch: "GST",
    fy: inv?.tYear || "26-27",

    // ================= SELLER =================
    sgstin: sellerGstin,
    strdNm: inv?.company_Name || null,
    slglNm: inv?.company_Name  || null,
    sbnm: inv?.company_Name  || null,
    sflno: null,
    sloc: inv?.companyBranches?.officeAddress || null,
    sdst: inv?.company_State|| null,
    sstcd: sellerStateCode,
    spin: inv?.companyBranches?.pinCode || inv?.companyBranches?.poBoxCode || null,
    sph: inv?.companyBranches?.mobile || null,
    sem: inv?.companyBranches?.email|| null,

    // ================= BUYER =================
    bgstin: buyerGstin,
    btrdNm: inv?.buyerClients?.companyName || null,
    blglNm: inv?.buyerClients?.companyName || null,
    bbnm: inv?.buyerClients?.companyName || null,
    bflno: null,
    bloc: inv?.buyerClients?.officeAddress || null,
    bdst: inv?.buyerClients?.masterStateNames?.stateName || null,
    bstcd: buyerStateCode,
    bpin: inv?.buyerClients?.poBox || null,
    bph: inv?.buyerClients?.mobile || null, //ateeq changed from phone to Mobile for buyer
    bem: inv?.buyerClients?.email || null,

    // ================= SHIP TO =================
    togstin: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? (inv?.buyerClients?.gstin || buyerGstin) : null,
    totrdNm: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? (inv?.buyerClients?.companyName || null) : null,
    tolglNm: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? (inv?.buyerClients?.companyName || null) : null,
    tobnm: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? null : null,
    toloc: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? (inv?.buyerClients?.officeAddress || null) : null,
    tostcd: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? buyerStateCode : null,
    topin: (selectedTrnTyp === "BILLTO_SHIPTO" || selectedTrnTyp === "COMBINED") ? (inv?.buyerClients?.poBox || null) : null,

    // ================= DISPATCH =================
    dgstin: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? sellerGstin : null,
    dtrdNm: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? (inv?.companyBranches?.companyTallyName || null) : null,
    dlglNm: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? (inv?.companyBranches?.nameEng || null) : null,
    dbnm: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? null : null,
    dflno: null,
    dloc: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? (inv?.companyBranches?.poBox || null) : null,
    ddst: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? "BENGALURU" : null,
    dstcd: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? sellerStateCode : null,
    dpin: (selectedTrnTyp === "BILLFROM_DISPATCHFROM" || selectedTrnTyp === "COMBINED") ? (inv?.companyBranches?.pinCode || null) : null,

    // ================= TRANSPORT =================
    subSplyTyp: "Supply",
    transId: null,
    transMode: null,
    transDist: null,
    transName: null,
    transDocNo: null,
    transDocDate: formatDate(inv?.dateofIssue || new Date()),
    vehNo: inv?.vehicleNo || null,
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



export const EinvoicePDF = ({
 invoiceData,
  irn,
  ackNo,
  ackDate,
  qrCodeBase64,
  ewayBillNo,
  ewayBillDate
}) => {
  // Safe base64 protocol string formatting for the QR graphic element
  const qrUri = qrCodeBase64 
    ? (qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`)
    : null;

  // Unified resolution array capturing both direct payload arrays and deep data properties
  const items = invoiceData?.itemList || invoiceData?.invoiceProductDetails || [];
  console.log("invoicedata for pdf", invoiceData)

  // Complete Financial Ledger Matrix Computation Calculations
  const totalTaxable = items.reduce((sum, item) => sum + Number(item?.txval || item?.totalAmount || 0), 0);
  const totalCGST = items.reduce((sum, item) => sum + Number(item?.camt || item?.cgstAmount || 0), 0);
  const totalSGST = items.reduce((sum, item) => sum + Number(item?.samt || item?.sgstAmount || 0), 0);
  const totalIGST = items.reduce((sum, item) => sum + Number(item?.iamt || item?.igstAmount || 0), 0);
  const grandTotal = totalTaxable + totalCGST + totalSGST + totalIGST;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.outerBorder}>
          
          {/* TITLE SECTION BANNER */}
          <View style={styles.titleBanner}>
            <Text style={styles.mainTitle}>TAX INVOICE</Text>
            <Text style={styles.subtitle}>Original Invoice Of Recipient</Text>
          </View>
             {/* ================= GOVT PROTOCOL E-INVOICE SYSTEM METRICS BAR ================= */}
          <View style={[styles.rowFlex, styles.borderTop, styles.borderBottom, styles.pad4, { backgroundColor: '#fdfdfd' }]}>
            <View style={{ width: '82%', flexDirection: 'column', justifyContent: 'center' }}>
              <Text style={styles.textLine}><Text style={styles.bold}>IRN: </Text><Text style={{ fontFamily: 'Courier', fontSize: 7.5 }}>{irn || "-"}</Text></Text>
              <Text style={styles.textLine}><Text style={styles.bold}>Ack No: </Text>{ackNo || "-"}   |   <Text style={styles.bold}>Ack Date: </Text>{ackDate || "-"}</Text>
            </View>
            <View style={{ width: '18%', alignItems: 'center', justifyContent: 'center' }}>
              {qrUri ? <Image src={qrUri} style={{ width: 42, height: 42 }} /> : <Text style={{ fontSize: 6, color: '#999' }}>No QR Data</Text>}
            </View>
          </View>

       {/* ================= ERP PROFILE MATRIX ================= */}
<View style={styles.rowFlex}>

  {/* Supplier Details */}
  <View style={[styles.profileLeftBlock, styles.pad6]}>

    <Text style={styles.companyName}>
      {invoiceData?.strdNm ||
        invoiceData?.slglNm ||
        invoiceData?.sbnm ||
        "-"}
    </Text>

    <Text style={styles.companySub}>
      {[invoiceData?.sflno, invoiceData?.sloc]
        .filter(Boolean)
        .join(", ")}
    </Text>

    <Text style={styles.textLine}>
      <Text style={styles.bold}>GSTIN/UIN: </Text>
      {invoiceData?.sgstin || "-"}
    </Text>

    <Text style={styles.textLine}>
      <Text style={styles.bold}>State Name: </Text>
      {invoiceData?.sdst || "-"}
      {invoiceData?.sstcd
        ? `, Code: ${invoiceData?.sstcd}`
        : ""}
    </Text>

    <Text style={styles.textLine}>
      <Text style={styles.bold}>Email: </Text>
      {invoiceData?.sem || "-"}
    </Text>

    <Text style={styles.textLine}>
      <Text style={styles.bold}>Phone: </Text>
      {invoiceData?.sph || "-"}
    </Text>

  </View>

  {/* Invoice Header Details */}
  <View style={styles.profileRightGrid}>

    <View style={[styles.rowFlex, styles.borderBottom, { height: 32 }]}>
      <View style={[styles.flexHalf, styles.pad4, styles.borderRight]}>
        <Text style={styles.labelHeader}>Invoice No.</Text>
        <Text style={styles.valText}>
          {invoiceData?.no || "-"}
        </Text>
      </View>

      <View style={[styles.flexHalf, styles.pad4]}>
        <Text style={styles.labelHeader}>Dated</Text>
        <Text style={styles.valText}>
          {invoiceData?.dt || "-"}
        </Text>
      </View>
    </View>

    <View style={[styles.rowFlex, styles.borderBottom, { height: 32 }]}>
      <View style={[styles.flexHalf, styles.pad4, styles.borderRight]}>
        <Text style={styles.labelHeader}>D.C. No.</Text>
        <Text style={styles.valText}>
          {invoiceData?.transDocNo || "-"}
        </Text>
      </View>

      <View style={[styles.flexHalf, styles.pad4]}>
        <Text style={styles.labelHeader}>D.C. Date</Text>
        <Text style={styles.valText}>
          {invoiceData?.transDocDate || "-"}
        </Text>
      </View>
    </View>

    <View style={[styles.rowFlex, { minHeight: 35 }]}>

      <View style={[styles.flexHalf, styles.pad4, styles.borderRight]}>
        <Text style={styles.labelHeader}>
          Purchase Order No.
        </Text>

        <Text style={styles.valText}>
          {invoiceData?.invRefContDtls?.[0]?.poref || "-"}
        </Text>
      </View>

      <View style={[styles.flexHalf, styles.pad4]}>
        <Text style={styles.labelHeader}>
          Mode/Terms of Payment
        </Text>

        <Text style={styles.valText}>
          {invoiceData?.modeorTermsOfPayment || "-"}
        </Text>
      </View>

    </View>

  </View>
</View>
      
          {/* ================= CLIENT PARTY DETAILS ================= */}
<View style={[styles.rowFlex, styles.borderTop]}>

  {/* Ship To */}
  <View
    style={[
      styles.flexHalf,
      styles.pad6,
      styles.borderRight,
      { minHeight: 85 }
    ]}
  >
    <Text style={styles.sectionHeaderTitle}>
      Consignee (Ship To):
    </Text>

    <Text style={styles.partyName}>
      {invoiceData?.totrdNm ||
        invoiceData?.btrdNm ||
        "-"}
    </Text>

    <Text style={styles.textLine}>
      {invoiceData?.toloc ||
        invoiceData?.bloc ||
        "-"}
    </Text>

    <Text style={styles.textLine}>
      <Text style={styles.bold}>GSTIN/UIN: </Text>

      {invoiceData?.togstin ||
        invoiceData?.bgstin ||
        "-"}
    </Text>

    <Text style={styles.textLine}>
      <Text style={styles.bold}>State Name: </Text>

      {invoiceData?.tostcd ||
        invoiceData?.bdst ||
        "-"}

      {invoiceData?.tostcd
        ? `, Code: ${invoiceData?.tostcd}`
        : ""}
    </Text>

  </View>

  {/* Bill To */}
  <View
    style={[
      styles.flexHalf,
      styles.pad6,
      { minHeight: 85 }
    ]}
  >
    <Text style={styles.sectionHeaderTitle}>
      Buyer (Bill To / if other than consignee):
    </Text>

    <Text style={styles.partyName}>
      {invoiceData?.btrdNm ||
        invoiceData?.blglNm ||
        invoiceData?.bbnm ||
        "-"}
    </Text>

    <Text style={styles.textLine}>
      {[invoiceData?.bflno, invoiceData?.bloc]
        .filter(Boolean)
        .join(", ")}
    </Text>

    <Text style={styles.textLine}>
      <Text style={styles.bold}>GSTIN/UIN: </Text>
      {invoiceData?.bgstin || "-"}
    </Text>

    <Text style={styles.textLine}>
      <Text style={styles.bold}>State Name: </Text>
      {invoiceData?.bdst || "-"}
      {invoiceData?.bstcd
        ? `, Code: ${invoiceData?.bstcd}`
        : ""}
    </Text>

    <Text style={styles.textLine}>
      <Text style={styles.bold}>Email: </Text>
      {invoiceData?.bem || "-"}
    </Text>

    <Text style={styles.textLine}>
      <Text style={styles.bold}>Phone: </Text>
      {invoiceData?.bph || "-"}
    </Text>

  </View>
    </View>
       

          {/* ================= GOODS LINE ITEMS ACCOUNTING TABLE ================= */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.colSl}>SI. No</Text>
              <Text style={styles.colDesc}>Description of Goods</Text>
              <Text style={styles.colHsn}>HSN/SAC</Text>
              <Text style={styles.colQty}>Quantity</Text>
              <Text style={styles.colRate}>Rate</Text>
              <Text style={styles.colPer}>Per</Text>
              <Text style={styles.colAmount}>Amount</Text>
            </View>

            {items.map((item, index) => {
              const itemTaxable = Number(item?.txval || item?.totalAmount || 0);
              return (
                <View key={index} style={styles.tableRow} wrap={false}>
                  <Text style={styles.colSl}>{index + 1}</Text>
                  <Text style={styles.colDesc}>{item?.prdNm || item?.description || "-"}</Text>
                  <Text style={styles.colHsn}>{item?.hsnCd || item?.hsncode || "-"}</Text>
                  <Text style={styles.colQty}>{Number(item?.qty || item?.quantity || 0).toFixed(0)} {item?.unit || item?.uom || "NOS"}</Text>
                  <Text style={styles.colRate}>{Number(item?.unitPrice || item?.quantityAmount || 0).toFixed(2)}</Text>
                  <Text style={styles.colPer}>{item?.unit || item?.uom || "NOS"}</Text>
                  <Text style={styles.colAmount}>{itemTaxable.toFixed(2)}</Text>
                </View>
              );
            })}

            <View style={styles.tableTotalRow} wrap={false}>
              <Text style={styles.colSl}></Text>
              <Text style={[styles.colDesc, { fontWeight: 'bold' }]}>Total Taxable Base Value</Text>
              <Text style={styles.colHsn}></Text>
              <Text style={styles.colQty}></Text>
              <Text style={styles.colRate}></Text>
              <Text style={styles.colPer}></Text>
              <Text style={[styles.colAmount, { fontWeight: 'bold' }]}>{totalTaxable.toFixed(2)}</Text>
            </View>
          </View>

          {/* ================= HSN / SAC TAX COMPONENT SUMMARY MATRIX ================= */}
          <View style={styles.hsnTableContainer} wrap={false}>
            <View style={styles.hsnTableHeader}>
              <Text style={{ width: '15%', borderRightWidth: 0.5, borderColor: '#000', padding: 2 }}>HSN/SAC</Text>
              <Text style={{ width: '20%', borderRightWidth: 0.5, borderColor: '#000', padding: 2 }}>Taxable Value</Text>
              <Text style={{ width: '25%', borderRightWidth: 0.5, borderColor: '#000', padding: 2 }}>Central Tax (Rate / Amt)</Text>
              <Text style={{ width: '25%', borderRightWidth: 0.5, borderColor: '#000', padding: 2 }}>State Tax (Rate / Amt)</Text>
              <Text style={{ width: '15%', padding: 2 }}>Total Tax Amount</Text>
            </View>

            {items.map((item, index) => {
              const itemTaxable = Number(item?.txval || item?.totalAmount || 0);
              const rate = Number(item?.rt || item?.gstPer || 0);
              const halfRate = (rate / 2).toFixed(1) + "%";
              const cgst = Number(item?.camt || item?.cgstAmount || 0);
              const sgst = Number(item?.samt || item?.sgstAmount || 0);
              const totalTax = cgst + sgst + Number(item?.iamt || item?.igstAmount || 0);

              return (
                <View key={index} style={styles.hsnTableRow}>
                  <Text style={{ width: '15%', borderRightWidth: 0.5, borderColor: '#cccccc', padding: 2 }}>{item?.hsnCd || item?.hsncode || "-"}</Text>
                  <Text style={{ width: '20%', borderRightWidth: 0.5, borderColor: '#cccccc', padding: 2, textAlign: 'right' }}>{itemTaxable.toFixed(2)}</Text>
                  <Text style={{ width: '25%', borderRightWidth: 0.5, borderColor: '#cccccc', padding: 2, textAlign: 'right' }}>{halfRate} / {cgst.toFixed(2)}</Text>
                  <Text style={{ width: '25%', borderRightWidth: 0.5, borderColor: '#cccccc', padding: 2, textAlign: 'right' }}>{halfRate} / {sgst.toFixed(2)}</Text>
                  <Text style={{ width: '15%', textAlign: 'right', padding: 2 }}>{totalTax.toFixed(2)}</Text>
                </View>
              );
            })}

            <View style={[styles.hsnTableRow, { fontWeight: 'bold', backgroundColor: '#f9f9f9' }]}>
              <Text style={{ width: '15%', borderRightWidth: 0.5, borderColor: '#cccccc', padding: 2 }}>Total</Text>
              <Text style={{ width: '20%', borderRightWidth: 0.5, borderColor: '#cccccc', padding: 2, textAlign: 'right' }}>{totalTaxable.toFixed(2)}</Text>
              <Text style={{ width: '25%', borderRightWidth: 0.5, borderColor: '#cccccc', padding: 2, textAlign: 'right' }}>{totalCGST.toFixed(2)}</Text>
              <Text style={{ width: '25%', borderRightWidth: 0.5, borderColor: '#cccccc', padding: 2, textAlign: 'right' }}>{totalSGST.toFixed(2)}</Text>
              <Text style={{ width: '15%', textAlign: 'right', padding: 2 }}>{(totalCGST + totalSGST + totalIGST).toFixed(2)}</Text>
            </View>
          </View>

          {/* ================= FINAL CALCULATIONS TOTALS & METADATA BANK BLOCK ================= */}
          <View style={[styles.rowFlex, styles.borderTop]} wrap={false}>
            <View style={[styles.flexHalf, styles.pad6, styles.borderRight, { justifyContent: 'space-between' }]}>
              <View>
                <Text style={{ fontSize: 7.5, fontWeight: 'bold' }}>Amount Chargeable (In Words):</Text>
                <Text style={{ fontSize: 7.5, fontStyle: 'italic', marginTop: 2 }}>INR {grandTotal.toFixed(2)} Only.</Text>
              </View>
              <View style={{ borderTopWidth: 0.5, borderColor: '#ccc', paddingTop: 4, marginTop: 10 }}>
                <Text style={styles.textLine}><Text style={styles.bold}>Bank Name: </Text>AXIS BANK</Text>
                <Text style={styles.textLine}><Text style={styles.bold}>A/c No: </Text>xxx000xxx000</Text>
                <Text style={styles.textLine}><Text style={styles.bold}>IFS Code: </Text>UTIB0000211</Text>
              </View>
            </View>

            <View style={[styles.flexHalf, { backgroundColor: '#fafafa' }]}>
              <View style={[styles.rowFlex, styles.pad4, { justifyContent: 'space-between', borderBottomWidth: 0.5, borderColor: '#eee' }]}>
                <Text style={styles.bold}>Total Taxable Value:</Text>
                <Text>{totalTaxable.toFixed(2)}</Text>
              </View>
              <View style={[styles.rowFlex, styles.pad4, { justifyContent: 'space-between', borderBottomWidth: 0.5, borderColor: '#eee' }]}>
                <Text style={styles.bold}>Central Tax (CGST):</Text>
                <Text>{totalCGST.toFixed(2)}</Text>
              </View>
              <View style={[styles.rowFlex, styles.pad4, { justifyContent: 'space-between', borderBottomWidth: 0.5, borderColor: '#eee' }]}>
                <Text style={styles.bold}>State Tax (SGST):</Text>
                <Text>{totalSGST.toFixed(2)}</Text>
              </View>
              {totalIGST > 0 && (
                <View style={[styles.rowFlex, styles.pad4, { justifyContent: 'space-between', borderBottomWidth: 0.5, borderColor: '#eee' }]}>
                  <Text style={styles.bold}>Integrated Tax (IGST):</Text>
                  <Text>{totalIGST.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.rowFlex, styles.pad6, { justifyContent: 'space-between', backgroundColor: '#eef3f7' }]}>
                <Text style={{ fontWeight: 'bold', fontSize: 9.5 }}>Final Invoice Value:</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 9.5 }}>₹{grandTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* ================= 5. TRANSPORT / EWAY BILL PROFILE MATRIX ================= */}
          <View style={[styles.sectionBlock, styles.borderTop]} wrap={false}>
            <Text style={[styles.sectionHeaderTitle, { backgroundColor: '#eaeaea', padding: 3, marginBottom: 0, textDecoration: 'none' }]}>5. E-WayBill & Transport Details</Text>
            <View style={[styles.rowFlex, styles.pad4]}>
              <Text style={{ marginRight: 25 }}><Text style={styles.bold}>Eway Bill No: </Text>{ewayBillNo || "-"}</Text>
              <Text style={{ marginRight: 25 }}><Text style={styles.bold}>Eway Bill Date: </Text>{ewayBillDate || "-"}</Text>
              <Text><Text style={styles.bold}>Vehicle No: </Text>{invoiceData?.vehicleNo ||invoiceData?.vehNo || "-"}</Text>
            </View>
          </View>

          {/* TRADITIONAL ACCOUNTING REMARKS & SIGNATURE BLOCK */}
          <View style={[styles.rowFlex, styles.borderTop, { minHeight: 60 }]} wrap={false}>
            <View style={[styles.flexHalf, styles.pad6, styles.borderRight]}>
              <Text style={{ fontSize: 6.5, color: '#555' }}>
                Subjected to Hyderabad Jurisdiction. We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              </Text>
            </View>
            <View style={[styles.flexHalf, styles.pad6, { alignItems: 'center', justifyContent: 'space-between' }]}>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>For {invoiceData?.strdNm ||
     invoiceData?.slglNm ||
     "SWASTIK MACHINERY CORPORATION"}</Text>
              <Text style={{ fontSize: 8, color: '#444' }}>Authorised Signatory</Text>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
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
  const [showPdf, setShowPdf] = useState(false);
  const location = useLocation();
  const [manualInvoiceId, setManualInvoiceId] = useState("");
  const receivedData = location.state || {};
  console.log("received data",receivedData)
  const invoiceData = location.state?.invoiceData || {};
  const invoicenumber = location.state?.invoiceNumber;
  const dynamicId = receivedData.id || location.state?.pid;
  const [connectionType, setConnectionType] = useState(
      localStorage.getItem("connectionType") || "DEFAULT"
    );
  console.log("invoiceData",invoiceData);

const storedInvoiceCreatedOn =
  localStorage.getItem("invoicecreatedOn");
  const refid =
  localStorage.getItem("refid");

const refid01 = location.state?.refID ||
  (refid &&
   refid!== "undefined"
    ? JSON.parse(refid)
    : "");

    const invoiceCreatedOn =
  location.state?.invoicecreatedOn ||
  (storedInvoiceCreatedOn &&
   storedInvoiceCreatedOn !== "undefined"
    ? JSON.parse(storedInvoiceCreatedOn)
    : "");
  const [payload, setPayload] = useState({ itemList: [] });
  const initializedRef = useRef(false);
const apiPrintData = response?.response || response || {};
  const irnValue = apiPrintData.irn || apiPrintData.irnnumber || "";
  const ackNoValue = apiPrintData.ackNo || apiPrintData.ackno || "";
  const rawDate = apiPrintData.ackDt || apiPrintData.ackdate;
  
  const formattedPrintDate = rawDate 
    ? new Date(String(rawDate).replace(" ", "T")).toLocaleString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).replace(',', '')
    : "";
    
  const qrCodeBase64 = apiPrintData.qrCode || apiPrintData.einvoiceqrcode || apiPrintData.qrcodeBase64 || apiPrintData.SignedQRCode || "";


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
    const basePayload = createBasePayload(invoiceData, dynamicId, category,invoiceCreatedOn,refid01);
    setPayload(recalculateTotals(basePayload));
  };

  useEffect(() => {
    if (!invoiceData) return;
    
    if (!initializedRef.current) {
      const basePayload = createBasePayload(invoiceData, dynamicId, selectedCategory,invoiceCreatedOn,refid01);
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
  setShowPdf(false);
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
  genewb: genEwb,
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
          "ConnectionType": connectionType,
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

  // Automatically save generated IRN details to DB
  const saved = await handleSaveToDB(data);

  if (saved) {
    console.log("Invoice synced to DB successfully.");
  }
}

  }  finally {
    setLoading(false);
  }
};

console.log("invoicenumber",invoiceData?.invoiceNumber)
console.log("invoicecreatedon", invoiceCreatedOn)

const handleSaveToDB = async (generatedResponse = response) => {
  if (!generatedResponse) {
    alert("No data available to save.");
    return false;
  }

  const apiData = generatedResponse.response || generatedResponse;

  // 🌟 Define your dynamic ID lookup
  const dynamicId = receivedData?.id || location.state?.pid;

  const putPayload = {
    // 🌟 Assign dynamicId here, falling back to apiData or payload id if needed, normalized as a Number
    id: Number(dynamicId || apiData.id || payload.id) || 0,
    
    eWayBillNumber: String(apiData.eWayBillNumber || apiData.EwbNo || ""),
    irnnumber: apiData.irnnumber || apiData.irn || "",
    ackno: String(apiData.ackNo || apiData.ackno || ""),
    ackdate: apiData.ackdate || apiData.ackDt 
      ? new Date(apiData.ackdate || apiData.ackDt).toISOString() 
      : new Date().toISOString(),
    einvoiceqrcode: apiData.einvoiceqrcode || apiData.qrCode || ""
  };


  try {
    setLoading(true);

    const res = await fetch("https://einvoice.fcssoftwares.com/api/OrderList/UpdateInvoice", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "ConnectionType": connectionType || "Online", 
        ...(token && { "Authorization": `Bearer ${token}` })
      },
      body: JSON.stringify(putPayload),
    });
   if (res.ok) {
  const data = await res.json();
  console.log("Database updated successfully:", data);

  alert(
    `✅ IRN Generated Successfully!\n\n` +
    `🎉 Invoice updated in DB successfully!`
  );

  return true;
}   
  } catch (error) {
  console.error("Database Save Error:", error);

  alert(
    `⚠ IRN generated successfully, but DB update failed.\n\n${error.message}`
  );

  return false;
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
      "ConnectionType": connectionType || "Online"
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
    
    <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
      <label style={{ fontSize: "13px" }}><strong>Generate E-Way Bill:</strong></label>
      <select
        value={genEwb}
        onChange={(e) => setGenEwb(e.target.value)}
        style={{ ...tableStyles.select, width: "100px", padding: "4px 8px", height: "28px" }}
      >
        <option value="Y">Yes</option>
        <option value="N">No</option>
      </select>
    </div>

    {/* ==================== META CONFIGURATION ==================== */}
    <table style={{ ...tableStyles.table, marginBottom: "15px" }}>
      <thead>
        <tr><th colSpan={4} style={{ ...tableStyles.th, padding: "6px" }}>Document Meta Configuration</th></tr>
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
    <div style={{ ...tableStyles.twoColGrid, gap: "15px" }}>
      <div style={tableStyles.compactSectionCard}>
        <h3 style={tableStyles.sectionHeader}>Seller Information</h3>
        <div style={tableStyles.inlineGridFields}>
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
      </div>
      
      <div style={tableStyles.compactSectionCard}>
        <h3 style={tableStyles.sectionHeader}>Buyer Information</h3>
        <div style={tableStyles.inlineGridFields}>
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
    </div>

    {/* ==================== DISPATCH & SHIP TO ==================== */}
    <div style={{ ...tableStyles.twoColGrid, marginTop: "15px", gap: "15px" }}>
      <div style={tableStyles.compactSectionCard}>
        <h3 style={tableStyles.sectionHeader}>Dispatch From</h3>
        <div style={tableStyles.inlineGridFields}>
          <LabeledInput label="GSTIN" value={payload.dgstin} onChange={(v) => setField("dgstin", v)} />
          <LabeledInput label="Trade Name" value={payload.dtrdNm} onChange={(v) => setField("dtrdNm", v)} />
          <LabeledInput label="Legal Name" value={payload.dlglNm} onChange={(v) => setField("dlglNm", v)} />
          <LabeledInput label="Building Name" value={payload.dbnm} onChange={(v) => setField("dbnm", v)} />
          <LabeledInput label="Location" value={payload.dloc} onChange={(v) => setField("dloc", v)} />
          <LabeledInput label="State Code" value={payload.dstcd} onChange={(v) => setField("dstcd", v)} />
          <LabeledInput label="Pincode" value={payload.dpin} onChange={(v) => setField("dpin", v)} />
        </div>
      </div>
      <div style={tableStyles.compactSectionCard}>
        <h3 style={tableStyles.sectionHeader}>Ship To</h3>
        <div style={tableStyles.inlineGridFields}>
          <LabeledInput label="GSTIN" value={payload.togstin} onChange={(v) => setField("togstin", v)} />
          <LabeledInput label="Trade Name" value={payload.totrdNm} onChange={(v) => setField("totrdNm", v)} />
          <LabeledInput label="Legal Name" value={payload.tolglNm} onChange={(v) => setField("tolglNm", v)} />
          <LabeledInput label="Building Name" value={payload.tobnm} onChange={(v) => setField("tobnm", v)} />
          <LabeledInput label="Location" value={payload.toloc} onChange={(v) => setField("toloc", v)} />
          <LabeledInput label="State Code" value={payload.tostcd} onChange={(v) => setField("tostcd", v)} />
          <LabeledInput label="Pincode" value={payload.topin} onChange={(v) => setField("topin", v)} />
        </div>
      </div>
    </div>

    {/* ==================== TRANSPORT DETAILS ==================== */}
    {genEwb === "Y" && (
      <div style={{ ...tableStyles.twoColGrid, marginTop: "15px", gap: "15px" }}>
        <div style={tableStyles.compactSectionCard}>
          <h3 style={tableStyles.sectionHeader}>Transport Details</h3>
          <div style={tableStyles.inlineGridFields}>
            <LabeledInput label="Supply Type" value={payload.subSplyTyp} onChange={(v) => setField("subSplyTyp", v)} />
            <LabeledInput label="Transporter ID" value={payload.transId} onChange={(v) => setField("transId", v)} />
            <LabeledInput label="Transport Mode" value={payload.transMode} onChange={(v) => setField("transMode", v)} />
            <LabeledInput label="Transport Distance" value={payload.transDist} onChange={(v) => setField("transDist", v)} />
            <LabeledInput label="Transporter Name" value={payload.transName} onChange={(v) => setField("transName", v)} />
          </div>
        </div>

        <div style={tableStyles.compactSectionCard}>
          <h3 style={tableStyles.sectionHeader}>Document & Vehicle Details</h3>
          <div style={tableStyles.inlineGridFields}>
            <LabeledInput label="Trans Doc No" value={payload.transDocNo} onChange={(v) => setField("transDocNo", v)} />
            <LabeledInput label="Trans Doc Date" value={payload.transDocDate} onChange={(v) => setField("transDocDate", v)} />
            <LabeledInput label="Vehicle No" value={payload.vehNo} onChange={(v) => setField("vehNo", v)} />
            <LabeledInput label="Vehicle Type" value={payload.vehTyp} onChange={(v) => setField("vehTyp", v)} />
          </div>
        </div>
      </div>
    )}

    {/* ==================== ITEM MANAGEMENT ==================== */}
    <div style={{ marginTop: "20px" }}>
      {payload.itemList?.map((item, idx) => (
        <div key={idx} style={{ ...tableStyles.itemCard, padding: "12px", marginBottom: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "8px" }}>
            <LabeledInput label="Product Name" value={item.prdNm} onChange={(v) => updateItem(idx, "prdNm", v)} />
            <LabeledInput label="Product Description" value={item.prdDesc} onChange={(v) => updateItem(idx, "prdDesc", v)} />
            <LabeledInput label="HSN Code" value={item.hsnCd} onChange={(v) => updateItem(idx, "hsnCd", v)} />
            <LabeledInput label="Quantity" type="number" value={item.qty} onChange={(v) => updateItem(idx, "qty", v)} />
            <LabeledInput label="Unit Price" type="number" step="0.01" value={item.unitPrice} onChange={(v) => updateItem(idx, "unitPrice", v)} />
          </div>

          <div style={{ fontSize: "11px", color: "#666", background: "#f1f3f4", padding: "4px 8px", borderRadius: "4px" }}>
            Calculated Breakdown: CGST: ₹{item.camt || 0} | SGST: ₹{item.samt || 0} | IGST: ₹{item.iamt || 0}
          </div>
        </div>
      ))}
    </div>

    {/* ==================== TOTALS BREAKDOWN ==================== */}
    <div style={{ margin: "15px 0", background: "#fff", padding: "12px", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #eee" }}>
      <h3 style={{ ...tableStyles.sectionHeader, marginBottom: "8px" }}>Consolidated Invoice Aggregations</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", fontSize: "12px" }}>
        <div><strong>Taxable:</strong> <p style={{ margin: "2px 0 0" }}>₹{payload.tottxval || 0}</p></div>
        <div><strong>CGST:</strong> <p style={{ margin: "2px 0 0" }}>₹{payload.totcamt || 0}</p></div>
        <div><strong>SGST:</strong> <p style={{ margin: "2px 0 0" }}>₹{payload.totsamt || 0}</p></div>
        <div><strong>IGST:</strong> <p style={{ margin: "2px 0 0" }}>₹{payload.totiamt || 0}</p></div>
        <div><strong>Net Gross Value:</strong> <p style={{ color: colors?.primary || "#000", fontWeight: "bold", margin: "2px 0 0" }}>₹{payload.totinvval || 0}</p></div>
      </div>
    </div>
    

   {/* ==================== ACTION CONSOLE ==================== */}
    <div style={{ marginTop: "20px", padding: "15px", background: "#fff", borderRadius: "6px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "12px", flexWrap: "wrap" }}>
        
        {/* Button 1: Generate Invoice */}
        <button 
          style={{ ...tableStyles.btnGenerate(loading, token), padding: "8px 16px", fontSize: "13px" }} 
          onClick={handleGenerate}
          disabled={loading || !token}
        >
          {loading ? "Registering Invoice Core..." : "🚀 Generate IRN / E-Invoice"}
        </button>

        {/* Button 3: Instant PDF Generation and Download */}
     {/* Button 3: Instant PDF Generation and Download */}
    {/* Button 3: Instant PDF Generation and Download */}
{response && (irnValue || response.status === "SUCCESS") && (
  <PDFDownloadLink
    document={
      <EinvoicePDF
        // 🌟 Bind directly to the active live frontend state
        invoiceData={payload} 
        irn={irnValue}
        ackNo={ackNoValue}
        ackDate={formattedPrintDate}
        qrCodeBase64={qrCodeBase64}
        
        // 🌟 Pass E-Way Bill metrics down as explicit props
        ewayBillNo={response.eWayBillNumber || response?.response?.ewbNo || response.ewayBillNo || "-"}
        ewayBillDate={
          response.ewayBillDate || response?.response?.ewbDt 
            ? new Date(response.ewayBillDate || response?.response?.ewbDt).toLocaleDateString() 
            : "-"
        }
      />
    }
    fileName={`E-Invoice_${ackNoValue || 'Document'}.pdf`}
    style={{ textDecoration: 'none' }}
  >
    {({ blob, url, loading: pdfLoading, error }) => {
      if (error) {
        console.error("PDF Compilation Error:", error);
        return (
          <button
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              backgroundColor: "#ff4d4f",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "not-allowed",
              fontWeight: "500"
            }}
            disabled
          >
            ❌ PDF Generation Failed
          </button>
        );
      }

      return (
        <button
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            backgroundColor: pdfLoading ? "#d9d9d9" : "#722ed1",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: pdfLoading ? "not-allowed" : "pointer",
            fontWeight: "500",
            transition: "all 0.3s ease"
          }}
          disabled={pdfLoading}
        >
          {pdfLoading ? (
            <span>⏳ Compiling Data ({payload.itemList?.length || 0} Items)...</span>
          ) : (
            <span>📥 Download E-Invoice PDF</span>
          )}
        </button>
      );
    }}
  </PDFDownloadLink>
)}
      </div>
    </div>
      {/* Conditional Template Export UI Controls Wrapper */}
      {(lastGeneratedId || response?.status === "SUCCESS" || response?.irnnumber || response?.response?.irn) && (
        <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center", borderTop: "1px dashed #ccc", paddingTop: "12px" }}>
          <div style={{ width: "160px" }}>
            <select style={{ ...tableStyles.select, height: "30px", padding: "4px" }} value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="STANDARD">Standard Layout</option>
              <option value="CLASSIC">Classic Invoice</option>
              <option value="MODERN">Modern Minimalist</option>
            </select>
          </div>
          <button style={{ ...tableStyles.btnGreen, padding: "6px 15px", fontSize: "13px" }} onClick={downloadPDF}>Download Tax PDF</button>
        </div>
      )}
      {pdfMessage && <p style={{ marginTop: "10px", textAlign: "center", color: "#555", fontSize: "12px" }}>{pdfMessage}</p>}
    

    {/* ==================== API RESPONSE DISPLAY ==================== */}
   {response && (
  <div style={{
    marginTop: "15px", padding: "12px", borderRadius: "6px", fontSize: "13px",
    background: (response.status === "SUCCESS" || response.irnnumber) ? "#f6ffed" : "#fff1f0",
    border: (response.status === "SUCCESS" || response.irnnumber) ? "1px solid #b7eb8f" : "1px solid #ffa39e",
  }}>
    {response.irnnumber || response.status === "SUCCESS" || response?.response?.irn ? (
      <>
        <h3 style={{ color: "#389e0d", margin: "0 0 6px 0", fontSize: "14px" }}>E-Invoice Operation Matrix</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "6px 15px" }}>
          <p style={{ margin: 0 }}><strong>ID:</strong> {response.id ?? response?.response?.id ?? "-"}</p>
          <p style={{ margin: 0 }}><strong>IRN:</strong> {response.irnnumber || response?.response?.irn || "-"}</p>
          <p style={{ margin: 0 }}><strong>Ack No:</strong> {response.ackno || response?.response?.ackNo || "-"}</p>
          <p style={{ margin: 0 }}><strong>Ack Date:</strong> {response.ackdate || response?.response?.ackDt ? new Date(response.ackdate || response?.response?.ackDt).toLocaleString() : "-"}</p>
          
          {/* ================= UPDATED E-WAY BILL METRICS MATRIX ================= */}
          {(response.eWayBillNumber || response?.response?.ewbNo || response.ewayBillNo) && (
            <>
              <p style={{ margin: 0 }}>
                <strong>Eway Bill No:</strong> {response.eWayBillNumber || response?.response?.ewbNo || response.ewayBillNo || "-"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Eway Bill Date:</strong> {
                  response.ewayBillDate || response?.response?.ewbDt 
                    ? new Date(response.ewayBillDate || response?.response?.ewbDt).toLocaleDateString() 
                    : "-"
                }
              </p>
            </>
          )}
        </div>
      </>
    ) : (
      <>
        <h3 style={{ color: "#cf1322", margin: "0 0 6px 0", fontSize: "14px" }}>Execution Exception Block</h3>
        <pre style={{ background: "#fff1f0", padding: "8px", borderRadius: "4px", fontSize: "11px", color: "#cf1322", margin: 0 }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      </>
    )}
  </div>
)}
  </div>
);
};  
export default GenerateAndPrintEinvoice;

