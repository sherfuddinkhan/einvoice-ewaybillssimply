// GenerateAndPrintEinvoice.jsx - Final Complete Version
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../components/AuthContext";

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
const STORAGE_KEY1 = "iris_einvoice_shared_config";
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

const GenerateAndPrintEinvoice = () => {
  const { token, setLastInvoice } = useAuth();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [template, setTemplate] = useState("STANDARD");
  const [pdfMessage, setPdfMessage] = useState("");

  const [payload, setPayload] = useState(
   {
    "userGstin": "01AAACI9260R002",
    "pobCode": null,
    "supplyType": "O",
    "ntr": "Inter",
    "docType": "RI",
    "catg": "B2B",
    "dst": "O",
    "trnTyp": "REG",
    "no": "AG/03-09/4565",
    "dt": "28-03-2025",
    "refinum": null,
    "refidt": null,
    "pos": "27",
    "diffprcnt": null,
    "etin": null,
    "rchrg": "N",
    "sgstin": "01AAACI9260R002",
    "strdNm": "TEST Company",
    "slglNm": "TEST PROD",
    "sbnm": "Testing",
    "sflno": "ABC",
    "sloc": "BANGALOR32",
    "sdst": "BENGALURU",
    "sstcd": "01",
    "spin": "192233",
    "sph": "123456111111",
    "sem": "abc123@gmail.com",
    "bgstin": "02AAACI9260R002",
    "btrdNm": "TEST ENTERPRISES",
    "blglNm": "TEST PRODUCT",
    "bbnm": "ABCD12345",
    "bflno": "abc",
    "bloc": "Jijamat",
    "bdst": "BANGALORE",
    "bstcd": "02",
    "bpin": "174001",
    "bph": "989898111111",
    "bem": "abc123@gmail.com",
    "dgstin": null,
    "dtrdNm": null,
    "dlglNm": null,
    "dbnm": null,
    "dflno": null,
    "dloc": null,
    "ddst": null,
    "dstcd": null,
    "dpin": null,
    "dph": null,
    "dem": null,
    "togstin": null,
    "totrdNm": null,
    "tolglNm": null,
    "tobnm": null,
    "toflno": null,
    "toloc": null,
    "todst": null,
    "tostcd": null,
    "topin": null,
    "toph": null,
    "toem": null,
    "sbnum": null,
    "sbdt": null,
    "port": null,
    "expduty": 1234,
    "cntcd": null,
    "forCur": null,
    "invForCur": null,
    "taxSch": "GST",
    "totinvval": 4262.73,
    "totdisc": 10,
    "totfrt": null,
    "totins": null,
    "totpkg": null,
    "totothchrg": 20,
    "tottxval": 3322.45,
    "totiamt": 930.28,
    "totcamt": 0,
    "totsamt": 0,
    "totcsamt": 0,
    "totstcsamt": 0,
    "rndOffAmt": 0,
    "sec7act": "N",
    "invStDt": null,
    "invEndDt": null,
    "invRmk": null,
    "omon": null,
    "odty": null,
    "oinvtyp": "B2CL",
    "octin": null,
    "userIRN": null,
    "payNm": null,
    "acctdet": null,
    "pa":null,
    "mode": null,
    "ifsc": null,
    "payTerm": null,
    "payInstr": null,
    "crTrn": null,
    "dirDr": null,
    "crDay": null,
    "balAmt": null,
    "paidAmt": null,
    "payDueDt": null,
    "transId": null,
    "subSplyTyp": "Supply",
    "subSplyDes": null,
    "kdrefinum": null,
    "kdrefidt": null,
    "transMode": null,
    "vehTyp": null,
    "transDist": "",
    "transName": null,
    "transDocNo": null,
    "transDocDate": null,
    "vehNo": null,
    "clmrfnd": null,
    "rfndelg": null,
    "boef": null,
    "fy": null,
    "refnum": null,
    "pdt": null,
    "ivst": null,
    "cptycde": null,
    "gen1": "abcd",
    "gen2": "abcd",
    "gen3": "abcd",
    "gen4": "abcd",
    "gen5": "abcd",
    "gen6": "abcd",
    "gen7": "abcd",
    "gen8": "abcd",
    "gen9": "abcd",
    "gen10": "abcd",
    "gen11": "abcd",
    "gen12": "abcd",
    "gen13": "abcd",
    "gen14": "PJTCG001",
    "gen15": "abcd",
    "gen16": "abcd",
    "gen17": "abcd",
    "gen18": "abcd",
    "gen19": "abcd",
    "gen20": "abcd",
    "gen21": "abcd",
    "gen22": "abcd",
    "gen23": "abcd",
    "gen24": "abcd",
    "gen25": "abcd",
    "gen26": "abcd",
    "gen27": "abcd",
    "gen28": "abcd",
    "gen29": "abcd",
    "gen30": "abcd",
    "pobewb": "Null",
    "pobret": "Null",
    "tcsrt": "null",
    "tcsamt": 0,
    "pretcs": 0,
    "genIrn": true,
    "genewb": "N",
    "signedDataReq": true,
    "itemList": [
      {
        "barcde": null,
        "bchExpDt": null,
        "bchWrDt": null,
        "bchnm": null,
        "camt": 0,
        "cesNonAdval": 0,
        "stCesNonAdvl": 0,
        "crt": 0,
        "csamt": 0,
        "csrt": 0,
        "disc": 0,
        "freeQty": 0,
        "hsnCd": "73041190",
        "iamt": 930.28,
        "irt": 28,
        "isServc": null,
        "itmgen1": null,
        "itmgen2": null,
        "itmgen3": null,
        "itmgen4": null,
        "itmgen5": null,
        "itmgen6": null,
        "itmgen7": null,
        "itmgen8": null,
        "itmgen9": null,
        "itmgen10": null,
        "itmVal": 4252.73,
        "num": "00001",
        "ordLineRef": null,
        "orgCntry": null,
        "othchrg": 0,
        "prdDesc": null,
        "prdNm": "SEAMLESS STEEL TUBE 10X2 -U71889903",
        "prdSlNo": null,
        "preTaxVal": 0,
        "qty": 1,
        "rt": 28,
        "samt": 0,
        "srt": 0,
        "stcsamt": 0,
        "stcsrt": 0,
        "sval": 3322.45,
        "txp": null,
        "txval": 3322.45,
        "unit": "NOS",
        "unitPrice": 3322.451,
        "invItmOtherDtls": [
          {
            "attNm": "aaa",
            "attVal": "aaa"
          },
          {
            "attNm": "xyz",
            "attVal": "2300"
          }
        ]
      }
    ],
    "invOthDocDtls": [
      {
        "url": "www.google.com",
        "docs": "This is the url",
        "infoDtls": "abcd"
      }
    ],
    "invRefPreDtls": [
      {
        "oinum": null,
        "oidt": null,
        "othRefNo": null
      }
    ],
    "invRefContDtls": [
      {
        "raref": null,
        "radt": null,
        "tendref": null,
        "contref": null,
        "extref": null,
        "projref": null,
        "poref": null,
        "porefdt": null
      }
    ]
  });

  // Load persisted data on mount
  useEffect(() => {
    const savedId = localStorage.getItem(LAST_GENERATED_ID_KEY);
    if (savedId) {
      setPayload((prev) => ({ ...prev, lastGeneratedId: savedId }));
    }

    const savedShared = localStorage.getItem(STORAGE_KEY1);
    if (savedShared) {
      try {
        const parsed = JSON.parse(savedShared);
        if (parsed.lastGeneratedResponse) {
          setResponse({ status: "SUCCESS", response: parsed.lastGeneratedResponse });
        }
      } catch (e) {
        console.error("Failed to load shared config", e);
      }
    }
  }, []);

  const setField = (field, value) => setPayload((prev) => ({ ...prev, [field]: value }));

  const updateItem = (idx, field, value) => {
    setPayload((prev) => {
      const items = [...prev.itemList];
      items[idx] = { ...items[idx], [field]: value };
      const qty = Number(items[idx].qty) || 0;
      const price = Number(items[idx].unitPrice) || 0;
      const rate = Number(items[idx].irt || 18) / 100;
      const txval = qty * price;
      const iamt = txval * rate;
      const itmVal = txval + iamt;

      items[idx] = {
        ...items[idx],
        txval: Number(txval.toFixed(2)),
        sval: Number(txval.toFixed(2)),
        iamt: Number(iamt.toFixed(2)),
        itmVal: Number(itmVal.toFixed(2)),
      };

      const totals = items.reduce(
        (acc, i) => ({
          totinvval: acc.totinvval + i.itmVal,
          tottxval: acc.tottxval + i.txval,
          totiamt: acc.totiamt + i.iamt,
        }),
        { totinvval: 0, tottxval: 0, totiamt: 0 }
      );

      return { ...prev, itemList: items, ...totals };
    });
  };

  const addItem = () => {
    setPayload((prev) => ({
      ...prev,
      itemList: [
        ...prev.itemList,
        {
          num: String(prev.itemList.length + 1).padStart(5, "0"),
          hsnCd: "",
          prdNm: "",
          qty: 1,
          unit: "NOS",
          unitPrice: 0,
          txval: 0,
          sval: 0,
          iamt: 0,
          irt: 18,
          rt: 18,
          itmVal: 0,
        },
      ],
    }));
  };

  const removeItem = (idx) => {
    setPayload((prev) => {
      const items = prev.itemList.filter((_, i) => i !== idx);
      const totals = items.reduce(
        (acc, i) => ({
          totinvval: acc.totinvval + i.itmVal,
          tottxval: acc.tottxval + i.txval,
          totiamt: acc.totiamt + i.iamt,
        }),
        { totinvval: 0, tottxval: 0, totiamt: 0 }
      );
      return { ...prev, itemList: items, ...totals };
    });
  };

  const saveResponseForAutoPopulate = (data) => {
    if (!data?.response) return;

    const responseData = data.response;

    if (responseData.id) {
      const idStr = String(responseData.id);
      localStorage.setItem(LAST_GENERATED_ID_KEY, idStr);
      setPayload((prev) => ({ ...prev, lastGeneratedId: idStr }));
    }

    const sharedData = JSON.parse(localStorage.getItem(STORAGE_KEY1) || "{}");
    sharedData.companyId = "24";
    sharedData.token = token;
    sharedData.irn = responseData.irn;
    sharedData.companyUniqueCode = payload.userGstin;
    sharedData.lastGeneratedResponse = responseData;
    sharedData.lastGeneratedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY1, JSON.stringify(sharedData));
     console.log("STORAGE_KEY1",STORAGE_KEY1) 

    localStorage.setItem(
      LAST_DOC_DETAILS_KEY,
      JSON.stringify({
        docNum: payload.no.trim(),
        docDate: payload.dt.trim(),
        docType: payload.docType,
        timestamp: new Date().toISOString(),
      })
    );

    localStorage.setItem(
      LAST_IRN_KEY,
      JSON.stringify({ irn: responseData.irn, timestamp: new Date().toISOString() })
    );

    if (responseData.signedQrCode) {
      localStorage.setItem(LAST_SIGNED_QR_JWT_KEY, responseData.signedQrCode);
    }

    localStorage.setItem(
      LAST_EWB_DETAILS_KEY,
      JSON.stringify({
        ewbNo: responseData.ewbNo || "",
        ewbDate: responseData.ewbDate || "",
        timestamp: new Date().toISOString(),
      })
    );

    setLastInvoice?.(responseData.irn, payload.userGstin, payload.no, payload.dt, payload.docType);
  };

  const handleGenerate = async () => {
    if (!token) return alert("Login required!");

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("http://localhost:3001/proxy/irn/addInvoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": token,
          companyId: "24",
          product: "ONYX",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResponse(data);

      if (data.status === "SUCCESS" && data.response?.irn) {
        saveResponseForAutoPopulate(data);

        alert(`IRN Generated Successfully!\nIRN: ${data.response.irn}\nAck No: ${data.response.ackNo}`);
      } else if (data.status === "FAILURE") {
        const errorMsg = data.errors?.[0]?.msg || "Unknown error";
        alert(`Generation Failed: ${errorMsg}`);
      }
    } catch (err) {
      setResponse({ status: "ERROR", error: err.message });
      alert("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!payload.lastGeneratedId) return;

    try {
      const resp = await axios.get(
        `http://localhost:3001/proxy/einvoice/print?template=${template}&id=${payload.lastGeneratedId}`,
        {
          headers: { "X-Auth-Token": token, companyId: "24", product: "ONYX" },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `EInvoice_${payload.lastGeneratedId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setPdfMessage("PDF downloaded successfully.");
    } catch (error) {
      setPdfMessage("Failed to download PDF.");
      console.error(error);
    }
  };

  return (
    <div style={tableStyles.container}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={tableStyles.header}>Generate & Print E-Invoice</h1>

        {/* Invoice Header - 3 Columns */}
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th colSpan={3} style={{ background: colors.primary, color: "white", fontSize: "18px", padding: "18px" }}>
                Invoice Header Details
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableStyles.td}><LabeledInput label="User GSTIN" id="userGstin" value={payload.userGstin} onChange={(v) => setField("userGstin", v)} /></td>
              <td style={tableStyles.td}><LabeledInput label="Invoice No" id="invoiceNo" value={payload.no} onChange={(v) => setField("no", v)} /></td>
              <td style={tableStyles.td}><LabeledInput label="Invoice Date" id="invoiceDate" value={payload.dt} onChange={(v) => setField("dt", v)} /></td>
            </tr>
            <tr>
              <td style={tableStyles.td}><LabeledSelect label="Doc Type" id="docType" value={payload.docType} options={["RI", "CR", "DB"]} onChange={(v) => setField("docType", v)} /></td>
              <td style={tableStyles.td}><LabeledInput label="Place of Supply" id="pos" value={payload.pos} onChange={(v) => setField("pos", v)} /></td>
              <td style={tableStyles.td}><LabeledSelect label="Category" id="catg" value={payload.catg} options={["B2B", "B2C", "SEZ", "DE"]} onChange={(v) => setField("catg", v)} /></td>
            </tr>
            <tr>
              <td style={tableStyles.td}><LabeledSelect label="Nature" id="ntr" value={payload.ntr} options={["Inter", "Intra"]} onChange={(v) => setField("ntr", v)} /></td>
              <td style={tableStyles.td}><LabeledSelect label="Reverse Charge" id="rchrg" value={payload.rchrg} options={["Y", "N"]} onChange={(v) => setField("rchrg", v)} /></td>
              <td style={tableStyles.td}><LabeledSelect label="Supply Type" id="supplyType" value={payload.supplyType} options={["O", "I"]} onChange={(v) => setField("supplyType", v)} /></td>
            </tr>
            <tr>
              <td colSpan={3} style={tableStyles.td}>
                <LabeledSelect label="Transaction Type" id="trnTyp" value={payload.trnTyp} options={["REG", "B2C", "EXP", "SEZ", "DE"]} onChange={(v) => setField("trnTyp", v)} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Seller Details - 3 Columns */}
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th colSpan={3} style={{ background: "#4CAF50", color: "white" }}>Seller Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableStyles.td}><LabeledInput label="GSTIN" id="sgstin" value={payload.sgstin} onChange={(v) => setField("sgstin", v)} /></td>
              <td colSpan={2} style={tableStyles.td}><LabeledInput label="Legal Name" id="slglNm" value={payload.slglNm} onChange={(v) => setField("slglNm", v)} /></td>
            </tr>
            <tr>
              <td style={tableStyles.td}><LabeledInput label="Branch" id="sbnm" value={payload.sbnm} onChange={(v) => setField("sbnm", v)} /></td>
              <td style={tableStyles.td}><LabeledInput label="Location" id="sloc" value={payload.sloc} onChange={(v) => setField("sloc", v)} /></td>
              <td style={tableStyles.td}><LabeledInput label="State Code" id="sstcd" value={payload.sstcd} onChange={(v) => setField("sstcd", v)} /></td>
            </tr>
            <tr>
              <td colSpan={3} style={tableStyles.td}><LabeledInput label="PIN Code" id="spin" value={payload.spin} onChange={(v) => setField("spin", v)} /></td>
            </tr>
          </tbody>
        </table>

        {/* Buyer Details - 3 Columns */}
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th colSpan={3} style={{ background: "#FF9800", color: "white" }}>Buyer Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableStyles.td}><LabeledInput label="GSTIN" id="bgstin" value={payload.bgstin} onChange={(v) => setField("bgstin", v)} /></td>
              <td colSpan={2} style={tableStyles.td}><LabeledInput label="Legal Name" id="blglNm" value={payload.blglNm} onChange={(v) => setField("blglNm", v)} /></td>
            </tr>
            <tr>
              <td style={tableStyles.td}><LabeledInput label="Branch" id="bbnm" value={payload.bbnm} onChange={(v) => setField("bbnm", v)} /></td>
              <td style={tableStyles.td}><LabeledInput label="Location" id="bloc" value={payload.bloc} onChange={(v) => setField("bloc", v)} /></td>
              <td style={tableStyles.td}><LabeledInput label="State Code" id="bstcd" value={payload.bstcd} onChange={(v) => setField("bstcd", v)} /></td>
            </tr>
            <tr>
              <td colSpan={3} style={tableStyles.td}><LabeledInput label="PIN Code" id="bpin" value={payload.bpin} onChange={(v) => setField("bpin", v)} /></td>
            </tr>
          </tbody>
        </table>

        {/* Item Details - Two-Column Cards */}
        <div style={{ marginBottom: "40px" }}>
          <table style={tableStyles.table}>
            <thead>
              <tr>
                <th colSpan={2} style={{ background: colors.primary, color: "white", fontSize: "18px", padding: "18px" }}>
                  Item Details
                </th>
              </tr>
            </thead>
          </table>

          {payload.itemList.map((item, idx) => (
            <div key={idx} style={tableStyles.itemCard}>
              <div style={{ fontWeight: "bold", marginBottom: "16px", color: colors.primary, fontSize: "17px" }}>
                Item {idx + 1} ({item.num})
              </div>

              <div style={tableStyles.twoColGrid}>
                <div style={tableStyles.col}>
                  <LabeledInput label="Item Description" id={`prdNm-${idx}`} value={item.prdNm} onChange={(v) => updateItem(idx, "prdNm", v)} />
                  <LabeledInput label="HSN Code" id={`hsnCd-${idx}`} value={item.hsnCd} onChange={(v) => updateItem(idx, "hsnCd", v)} />
                </div>
                <div style={tableStyles.col}>
                  <LabeledInput label="Quantity" id={`qty-${idx}`} type="number" step="0.01" value={item.qty} onChange={(v) => updateItem(idx, "qty", v)} />
                  <LabeledInput label="Unit" id={`unit-${idx}`} value={item.unit} onChange={(v) => updateItem(idx, "unit", v)} />
                  <LabeledInput label="Unit Price (₹)" id={`unitPrice-${idx}`} type="number" step="0.01" value={item.unitPrice} onChange={(v) => updateItem(idx, "unitPrice", v)} />
                  <LabeledInput label="IGST Rate (%)" id={`irt-${idx}`} type="number" step="0.01" value={item.irt} onChange={(v) => updateItem(idx, "irt", v)} />
                </div>
              </div>

              <div style={tableStyles.itemFooter}>
                <div style={{ fontSize: "15px" }}>
                  <strong>Taxable:</strong> ₹{item.txval.toFixed(2)} &nbsp;|&nbsp;
                  <strong>IGST:</strong> ₹{item.iamt.toFixed(2)} &nbsp;|&nbsp;
                  <strong>Total:</strong> ₹{item.itmVal.toFixed(2)}
                </div>
                <button style={tableStyles.btnRed} onClick={() => removeItem(idx)}>Remove Item</button>
              </div>
            </div>
          ))}

          <div style={{ textAlign: "right", marginTop: "30px" }}>
            <button style={tableStyles.btnGreen} onClick={addItem}>+ Add New Item</button>
          </div>
        </div>

        {/* Totals - 3 Columns */}
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th colSpan={3} style={{ background: "#2196F3", color: "white" }}>Invoice Totals</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...tableStyles.td, background: "#E8F5E9", fontWeight: "bold" }}>Total Taxable Value</td>
              <td style={{ ...tableStyles.td, background: "#E8F5E9", textAlign: "right", fontWeight: "bold" }}>₹ {payload.tottxval.toFixed(2)}</td>
              <td style={tableStyles.td}></td>
            </tr>
            <tr>
              <td style={{ ...tableStyles.td, background: "#E3F2FD", fontWeight: "bold" }}>IGST Amount</td>
              <td style={{ ...tableStyles.td, background: "#E3F2FD", textAlign: "right", fontWeight: "bold" }}>₹ {payload.totiamt.toFixed(2)}</td>
              <td style={tableStyles.td}></td>
            </tr>
            <tr>
              <td style={{ ...tableStyles.td, background: "#FFF3E0", fontWeight: "bold" }}>Total Invoice Value</td>
              <td style={{ ...tableStyles.td, background: "#FFF3E0", textAlign: "right", fontWeight: "bold" }}>₹ {payload.totinvval.toFixed(2)}</td>
              <td style={tableStyles.td}></td>
            </tr>
          </tbody>
        </table>

        {/* Actions */}
        <div style={{ textAlign: "center", margin: "50px 0" }}>
          <button style={tableStyles.btnGenerate(loading, token)} onClick={handleGenerate} disabled={loading || !token}>
            {loading ? "Generating IRN..." : "Generate IRN & E-Invoice"}
          </button>

          {payload.lastGeneratedId && (
            <div style={{ marginTop: "40px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "30px", flexWrap: "wrap", justifyContent: "center" }}>
                <div>
                  <label htmlFor="pdfTemplate" style={tableStyles.labelText}>PDF Template:</label>
                  <select id="pdfTemplate" value={template} onChange={(e) => setTemplate(e.target.value)} style={{ ...tableStyles.select, width: "auto", marginLeft: "12px", padding: "12px" }}>
                    <option>STANDARD</option>
                    <option>DETAILED</option>
                  </select>
                </div>
                <button style={tableStyles.btnGreen} onClick={downloadPDF}>
                  Download PDF (ID: {payload.lastGeneratedId})
                </button>
              </div>
              {pdfMessage && (
                <div style={{ marginTop: "16px", color: colors.primary, fontWeight: "bold", fontSize: "16px" }}>
                  {pdfMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* API Response */}
        {response && (
          <div>
            <h3 style={{ color: colors.primary, marginBottom: "16px", fontSize: "18px" }}>
              API Response ({response.status})
            </h3>
            <pre style={tableStyles.responseBox(response.status)}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateAndPrintEinvoice;