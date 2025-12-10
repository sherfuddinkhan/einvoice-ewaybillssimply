// GenerateAndPrintEinvoice.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from '../../components/AuthContext';

// -------------------------
// CONSTANTS & KEYS
// -------------------------
const STORAGE_KEY = "iris_einvoice_shared_config";
const LAST_DOC_DETAILS_KEY = "iris_last_used_doc_details";
const LAST_IRN_KEY = "iris_last_used_irn";
const LAST_SIGNED_QR_JWT_KEY = "iris_last_signed_qr_jwt";
const LAST_EWB_DETAILS_KEY = "iris_last_ewb_details";
const LAST_GENERATED_ID_KEY = "iris_last_generated_id";

// -------------------------
// STYLES
// -------------------------
const colors = {
  primary: "#1A73E8",
  primaryDark: "#0B4F9C",
  primaryLight: "#E8F0FE",
  success: "#34A853",
  danger: "#EA4335",
  background: "#F5F5F7",
  cardBackground: "#FFFFFF",
  textDark: "#333333",
  textLight: "#707070",
};

const styles = {
  // REDUCED MAX WIDTH for a more compact UI
  container: { padding: "40px", background: colors.background, minHeight: "100vh", fontFamily: "Roboto, Arial, sans-serif" },
  header: { textAlign: "center", color: colors.primaryDark, fontSize: "36px", marginBottom: "40px", fontWeight: 500, borderBottom: `2px solid ${colors.primaryLight}`, paddingBottom: "15px" },
  section: { background: colors.cardBackground, padding: "30px", borderRadius: "16px", marginBottom: "30px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", borderLeft: `5px solid ${colors.primary}` },
  sectionTitle: { color: colors.primary, fontSize: "22px", marginBottom: "20px", fontWeight: 600, borderBottom: `1px solid ${colors.primaryLight}`, paddingBottom: "10px" },
  
  // NEW FLEXIBLE GRID: Uses fractional units (1fr) for flexible, equal-width columns.
  grid: (cols = 3, template = '1fr') => ({ 
        display: "grid", 
        gridTemplateColumns: `repeat(${cols}, ${template})`, // e.g., 'repeat(3, 1fr)'
        gap: "0px" 
    }),

  label: { fontWeight: 600, color: colors.textDark, display: "block", marginBottom: "8px" },
  input: { width: "75%", padding: "12px", borderRadius: "8px", border: `1px solid ${colors.textLight}`, fontSize: "15px", background: colors.cardBackground, transition: "border-color 0.2s" },
  inputFocus: { borderColor: colors.primary, boxShadow: `0 0 0 3px ${colors.primaryLight}` },
  readOnlyBox: { padding: "12px", background: colors.primaryLight, borderRadius: "8px", marginTop: "6px", fontFamily: "monospace", fontSize: "14px", color: colors.textDark },
  itemCard: { background: colors.primaryLight, padding: 20, borderRadius: 12, marginBottom: 16, border: `1px solid ${colors.primary}` },
  lineTotal: { marginTop: 12, fontWeight: "bold", color: colors.primaryDark, padding: "8px 0", borderTop: `1px dashed ${colors.primary}` },
  btnGreen: { padding: "12px 24px", background: colors.success, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", transition: "background 0.2s" },
  btnRed: { padding: "10px 16px", background: colors.danger, color: "white", border: "none", borderRadius: "8px", cursor: "pointer" },
  btnGenerate: (loading, token) => ({
    padding: "28px 100px",
    fontSize: "32px",
    fontWeight: "bold",
    background: loading || !token ? "#BDBDBD" : colors.primary,
    color: "white",
    border: "none",
    borderRadius: "16px",
    cursor: loading || !token ? "not-allowed" : "pointer",
    boxShadow: `0 10px 30px ${loading || !token ? "rgba(0,0,0,0.2)" : "rgba(26, 115, 232, 0.4)"}`,
    transition: "all 0.3s",
  }),
  responseBox: (status) => ({
    background: "#1e1e1e",
    color: status === "SUCCESS" ? "#A8FFBF" : colors.danger,
    padding: "30px",
    borderRadius: "16px",
    fontSize: "14px",
    border: `2px solid ${status === "SUCCESS" ? colors.success : colors.danger}`,
    overflow: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  }),
};

// -------------------------
// REUSABLE COMPONENTS
// -------------------------
const Section = ({ title, children }) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>{title}</h2>
    {children}
  </div>
);

// UPDATED Grid to accept 'template' for flexible widths
const Grid = ({ cols = 3, template = '1fr', children }) => (
  <div style={styles.grid(cols, template)}>{children}</div>
);

const Input = ({ label, value, onChange, type = "text", step, note }) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <label style={{ display: "block" }}>
      <span style={styles.label}>
        {label} {note && <small style={{ color: colors.textLight }}>({note})</small>}
      </span>
      <input
        type={type}
        step={step}
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => {
          const v = type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value;
          onChange?.(v);
        }}
        style={{ ...styles.input, ...(isFocused ? styles.inputFocus : {}) }}
      />
    </label>
  );
};

const Select = ({ label, value, options, onChange, note }) => (
  <label style={{ display: "block" }}>
    <span style={styles.label}>
      {label} {note && <small style={{ color: colors.textLight }}>({note})</small>}
    </span>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...styles.input, padding: "13px" }}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </label>
);

const ReadOnly = ({ label, value }) => (
  <div>
    <strong style={{ color: colors.primaryDark }}>{label}:</strong>
    <div style={styles.readOnlyBox}>{value}</div>
  </div>
);

// -------------------------
// MAIN COMPONENT
// -------------------------
const GenerateAndPrintEinvoice = () => {
  const { token, setLastInvoice } = useAuth();
  
  console.log("Auth Token:", token);

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const [payload, setPayload] = useState({
    userGstin: "01AAACI9260R002",
    supplyType: "O",
    ntr: "Inter",
    docType: "RI",
    catg: "B2B",
    dst: "O",
    trnTyp: "REG",
    no: "INV001",
    dt: "04-12-2025",
    pos: "04",
    rchrg: "N",
    sgstin: "01AAACI9260R002",
    slglNm: "Calibre Cue Private Limited",
    sbnm: "Head Office",
    sloc: "Srinagar",
    sstcd: "01",
    spin: "190001",
    bgstin: "04AAACI9260R002",
    blglNm: "Chandigarh Trader Pvt Ltd",
    bbnm: "Main Branch",
    bloc: "Chandigarh",
    bstcd: "04",
    bpin: "160001",
    taxSch: "GST",
    totinvval: 3920.49,
    tottxval: 3322.45,
    totiamt: 598.04,
    subSplyTyp: "Supply",
    genIrn: true,
    genewb: "N",
    signedDataReq: true,
    itemList: [
      {
        num: "00001",
        hsnCd: "73041190",
        prdNm: "SEAMLESS STEEL TUBE 10X2MM",
        qty: 1,
        unit: "NOS",
        unitPrice: 3322.45,
        txval: 3322.45,
        sval: 3322.45,
        iamt: 598.04,
        irt: 18,
        rt: 18,
        itmVal: 3920.49,
      },
    ],
    lastGeneratedId: "",
  });

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

      items[idx].txval = Number(txval.toFixed(2));
      items[idx].sval = Number(txval.toFixed(2));
      items[idx].iamt = Number(iamt.toFixed(2));
      items[idx].itmVal = Number(itmVal.toFixed(2));

      const totals = items.reduce(
        (a, i) => ({
          totinvval: a.totinvval + i.itmVal,
          tottxval: a.tottxval + i.txval,
          totiamt: a.totiamt + i.iamt,
        }),
        { totinvval: 0, tottxval: 0, totiamt: 0 }
      );

      return { ...prev, itemList: items, totinvval: totals.totinvval, tottxval: totals.tottxval, totiamt: totals.totiamt };
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
        (a, i) => ({
          totinvval: a.totinvval + i.itmVal,
          tottxval: a.tottxval + i.txval,
          totiamt: a.totiamt + i.iamt,
        }),
        { totinvval: 0, tottxval: 0, totiamt: 0 }
      );
      return { ...prev, itemList: items, totinvval: totals.totinvval, tottxval: totals.tottxval, totiamt: totals.totiamt };
    });
  };

  const saveResponseForAutoPopulate = (data) => {
    if (!data?.response) return;
    const responseData = data.response;

    if (responseData.id) {
      localStorage.setItem(LAST_GENERATED_ID_KEY, String(responseData.id));
      setPayload((prev) => ({ ...prev, lastGeneratedId: String(responseData.id) }));
    }

    const sharedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    sharedData.companyId = "24";
    sharedData.token = token; 
    sharedData.irn = responseData.irn;
    sharedData.companyUniqueCode = payload.userGstin;
    sharedData.lastGeneratedResponse = responseData;
    sharedData.lastGeneratedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sharedData));

    localStorage.setItem(
      LAST_DOC_DETAILS_KEY,
      JSON.stringify({ docNum: payload.no.trim(), docDate: payload.dt.trim(), docType: payload.docType, timestamp: new Date().toISOString() })
    );

    localStorage.setItem(LAST_IRN_KEY, JSON.stringify({ irn: responseData.irn, timestamp: new Date().toISOString() }));

    if (responseData.signedQrCode) localStorage.setItem(LAST_SIGNED_QR_JWT_KEY, responseData.signedQrCode);

    localStorage.setItem(LAST_EWB_DETAILS_KEY, JSON.stringify({ ewbNo: responseData.ewbNo || "", ewbDate: responseData.ewbDate || "", timestamp: new Date().toISOString() }));

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
            product: "ONYX" 
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
      setResponse({ error: err.message });
      alert("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // PDF Download
  // -------------------------
  const [template, setTemplate] = useState("STANDARD");
  const [pdfMessage, setPdfMessage] = useState("");

  const downloadPDF = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/proxy/einvoice/print?template=${template}&id=${payload.lastGeneratedId}`, {
        headers: { 
            "X-Auth-Token": token, 
            companyId: "24", 
            product: "ONYX" 
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `EInvoice_${payload.lastGeneratedId}.pdf`);
      document.body.appendChild(link);
      link.click();
      setPdfMessage("PDF downloaded successfully.");
    } catch (error) {
      setPdfMessage("Failed to download PDF.");
      console.error(error);
    }
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div style={styles.container}>
      <div style={{ maxWidth: "1500px", margin: "0 auto" }}> {/* Further reduced max-width */}
        <h1 style={styles.header}>Generate & Print E-Invoice</h1>
        
        {/* Invoice Header: 3 Flexible Columns (1fr 1fr 1fr) */}
        <Section title="Invoice Header">
          <div style={styles.grid3}>
            <Input label="GSTIN" value={payload.userGstin} onChange={(v) => setField("userGstin", v)} />
            <Input label="Invoice No" value={payload.no} onChange={(v) => setField("no", v)} />
            <Input label="Invoice Date" value={payload.dt} onChange={(v) => setField("dt", v)} />

            <Select label="Doc Type" value={payload.docType} options={["RI", "CR", "DB"]} onChange={(v) => setField("docType", v)} />
            <Input label="Place of Supply" value={payload.pos} onChange={(v) => setField("pos", v)} />
            <Select label="Category" value={payload.catg} options={["B2B", "B2C"]} onChange={(v) => setField("catg", v)} />

            <Select label="Nature" value={payload.ntr} options={["Inter", "Intra"]} onChange={(v) => setField("ntr", v)} />
            <Select label="RCHRG" value={payload.rchrg} options={["Y", "N"]} onChange={(v) => setField("rchrg", v)} />
          </div>
        </Section>

        {/* Seller & Buyer: Split into two cleaner 3-column grids */}
          {/* Seller */}
        <Section title="Seller Details">
          <div style={styles.grid3}>
            <Input label="Seller Name" value={payload.slglNm} onChange={(v) => setField("slglNm", v)} />
            <Input label="GSTIN" value={payload.sgstin} onChange={(v) => setField("sgstin", v)} />
            <Input label="Location" value={payload.sloc} onChange={(v) => setField("sloc", v)} />

            <Input label="Branch" value={payload.sbnm} onChange={(v) => setField("sbnm", v)} />
            <Input label="State Code" value={payload.sstcd} onChange={(v) => setField("sstcd", v)} />
            <Input label="PIN" value={payload.spin} onChange={(v) => setField("spin", v)} />
          </div>
        </Section>

         {/* Buyer */}
        <Section title="Buyer Details">
          <div style={styles.grid3}>
            <Input label="Buyer Name" value={payload.blglNm} onChange={(v) => setField("blglNm", v)} />
            <Input label="GSTIN" value={payload.bgstin} onChange={(v) => setField("bgstin", v)} />
            <Input label="Location" value={payload.bloc} onChange={(v) => setField("bloc", v)} />

            <Input label="Branch" value={payload.bbnm} onChange={(v) => setField("bbnm", v)} />
            <Input label="State Code" value={payload.bstcd} onChange={(v) => setField("bstcd", v)} />
            <Input label="PIN" value={payload.bpin} onChange={(v) => setField("bpin", v)} />
          </div>
        </Section>

 {/* Item List: Using 5 columns, with Item Name taking up more space (e.g., 2fr) */}
<Section title="Item Details">
  {payload.itemList.map((item, idx) => (
    <div key={idx} style={styles.itemCard}>
      {/* Item row */}
      <Grid cols={1} template="2fr 1fr 1fr 1fr 1fr">
        <Input
          label="Item Name"
          value={item.prdNm}
          onChange={(v) => updateItem(idx, "prdNm", v)}
        />

        <Input
          label="HSN"
          value={item.hsnCd}
          onChange={(v) => updateItem(idx, "hsnCd", v)}
        />

        <Input
          label="Qty"
          type="number"
          value={item.qty}
          onChange={(v) => updateItem(idx, "qty", v)}
        />

        <Input
          label="Unit Price"
          type="number"
          value={item.unitPrice}
          onChange={(v) => updateItem(idx, "unitPrice", v)}
        />

        <Input
          label="Rate (%)"
          type="number"
          value={item.irt}
          onChange={(v) => updateItem(idx, "irt", v)}
        />
      </Grid>

      {/* Item totals */}
      <div style={styles.lineTotal}>
        Item Total: ₹{item.itmVal.toFixed(2)} &nbsp;|&nbsp; Tax: ₹{item.iamt.toFixed(2)}
      </div>

      {/* Remove item */}
      <div style={{ textAlign: "right" }}>
        <button style={styles.btnRed} onClick={() => removeItem(idx)}>
          Remove Item
        </button>
      </div>
    </div>
  ))}

  {/* Add item */}
  <div style={{ marginTop: 20 }}>
    <button style={styles.btnGreen} onClick={addItem}>
      + Add Item
    </button>
  </div>
</Section>

        {/* Totals: 3 Flexible Columns (1fr 1fr 1fr) */}
          <Section title="Totals">
          <div style={styles.grid3}>
            <ReadOnly label="Taxable Value" value={`₹ ${payload.tottxval.toFixed(2)}`} />
            <ReadOnly label="Tax Amount" value={`₹ ${payload.totiamt.toFixed(2)}`} />
            <ReadOnly label="Invoice Value" value={`₹ ${payload.totinvval.toFixed(2)}`} />
          </div>
        </Section>

        {/* Actions */}
        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <button style={styles.btnGenerate(loading, token)} onClick={handleGenerate} disabled={loading || !token}>
            {loading ? "Generating..." : "Generate IRN"}
          </button>
          {payload.lastGeneratedId && (
            <>
              <div style={{ marginTop: "20px" }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                  <Select label="PDF Template" value={template} options={["STANDARD", "DETAILED"]} onChange={setTemplate} />
                  <button style={{ ...styles.btnGreen, marginTop: "12px", alignSelf: 'flex-end' }} onClick={downloadPDF}>
                    Download PDF
                  </button>
                </div>
                {pdfMessage && <div style={{ marginTop: "8px", color: colors.primaryDark }}>{pdfMessage}</div>}
              </div>
            </>
          )}
        </div>

        {/* API Response */}
        {response && (
          <Section title="API Response">
            <pre style={styles.responseBox(response.status)}>{JSON.stringify(response, null, 2)}</pre>
          </Section>
        )}
      </div>
    </div>
  );
};

export default GenerateAndPrintEinvoice;