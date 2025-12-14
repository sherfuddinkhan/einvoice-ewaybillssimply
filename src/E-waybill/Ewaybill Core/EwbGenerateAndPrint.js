import React, { useState } from "react";
import axios from "axios";

/* ---------------------------
   LocalStorage keys
--------------------------- */
const STORAGE_KEY00 = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

/* ---------------------------
   Utils
--------------------------- */
const safeParse = (v, fallback = {}) => {
  try {
    return JSON.parse(v ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
};

const getLS = (k, fb = {}) => safeParse(localStorage.getItem(k), fb);
const setLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ---------------------------
   Default payload (UNCHANGED)
--------------------------- */
const DEFAULT_FORM = {
  supplyType: "O",
  subSupplyType: "1",
  docType: "INV",
  docNo: "Topaz340290",
  invType: "B2B",
  docDate: new Date().toLocaleDateString("en-GB").split("/").join("/"),
  transactionType: 1,

  fromGstin: "05AAAAU1183B5ZW",
  fromTrdName: "ABC",
  dispatchFromGstin: "05AAAAU1183B5ZW",
  dispatchFromTradeName: "PQR",
  fromAddr1: "T231",
  fromAddr2: "IIP",
  fromPlace: "Akodiya",
  fromPincode: 248001,
  fromStateCode: 5,

  toGstin: "05AAAAU1183B1Z0",
  toTrdName: "RJ-Rawat Foods",
  toAddr1: "S531, SSB Towers",
  toAddr2: "MG Road",
  toPlace: "Dehradun",
  toPincode: 248002,
  toStateCode: 5,

  totInvValue: 21000,
  totalValue: 20000,
  cgstValue: 500,
  sgstValue: 500,
  igstValue: 0,
  cessValue: 0,
  cessNonAdvolValue: 0,
  otherValue: 0,

  transMode: 1,
  transDistance: 10,
  transDocNo: "1212",
  transDocDate: new Date().toLocaleDateString("en-GB").split("/").join("/"),
  transporterId: "05AAAAU1183B1Z0",
  transporterName: "ACVDF",
  vehicleNo: "RJ14CA9999",
  vehicleType: "R",

  actFromStateCode: "5",
  actToStateCode: "5",

  itemList: [
    {
      productName: "Sugar",
      productDesc: "Sugar",
      hsnCode: "8517",
      quantity: 10,
      qtyUnit: "KGS",
      taxableAmount: 20000,
      sgstRate: 2.5,
      cgstRate: 2.5,
      igstRate: 0,
      cessRate: 0,
      cessNonAdvol: 0,
      iamt: 0,
      camt: 500,
      samt: 500,
      csamt: 0,
      txp: "T"
    }
  ],

  companyId: "",
  userGstin: "05AAAAU1183B5ZW",
  forceDuplicateCheck: true
};

/* ---------------------------
   Component
--------------------------- */
const EwbGenerateAndPrint = () => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiResponse, setApiResponse] = useState(null);
  const [ewbNos, setEwbNos] = useState([]);

  /* ---------------------------
     Auth from localStorage
  --------------------------- */
  const getAuth = () => {
    const cfg = getLS(STORAGE_KEY00);
    return {
      token: cfg?.fullResponse?.response?.token,
      companyId: cfg?.fullResponse?.response?.companyid
    };
  };

  const auth = getAuth();

  /* ---------------------------
     Generate EWB
  --------------------------- */
 const handleGenerate = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    if (!auth.token || !auth.companyId) {
      throw new Error("Auth missing in localStorage");
    }

    const res = await axios.post(
      "http://localhost:3001/proxy/topaz/ewb/generate",
      formData,
      {
        headers: {
          "X-Auth-Token": auth.token,
          companyId: auth.companyId,
          product: "TOPAZ",
          "Content-Type": "application/json",
        },
      }
    );

    if (res.data?.status !== "SUCCESS") {
      throw new Error(res.data?.message || "Generation failed");
    }

    // ✅ Set API response and EWB number
    setApiResponse(res.data);
    setEwbNos([res.data.response.ewbNo]);

    // ✅ Store the API response in LATEST_EWB_KEY for future auto-population
    const latestDataToSave = {
      ewbNo: res.data.response.ewbNo,
      fromGstin: formData.fromGstin,
      response: res.data.response,
      companyId: auth.companyId,
      token: auth.token,
    };
    localStorage.setItem(LATEST_EWB_KEY, JSON.stringify(latestDataToSave));
    console.log("Response data saved:", latestDataToSave);

    // ✅ Update EWB history (last 10 entries)
    const hist = getLS(EWB_HISTORY_KEY, []);
    hist.unshift({ ewbNo: res.data.response.ewbNo, time: new Date().toLocaleString() });
    setLS(EWB_HISTORY_KEY, hist.slice(0, 10));
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};


  /* ---------------------------
     PRINT PDF
  --------------------------- */
  const handlePrint = async () => {
    try {
      if (!ewbNos.length) throw new Error("EWB No missing");

      const res = await axios.post(
        "http://localhost:3001/proxy/topaz/ewb/printDetails",
        { ewbNo: ewbNos },
        {
          headers: {
            "X-Auth-Token": auth.token,
            companyId: auth.companyId,
            product: "TOPAZ",
            Accept: "application/pdf"
          },
          responseType: "blob"
        }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${ewbNos[0]}_EWB.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  /* ---------------------------
     UI
  --------------------------- */
  /* ---------------------------
   UI (BOXED STYLE – SAME AS PREVIOUS)
--------------------------- */
return (
  <div style={{ maxWidth: 1200, margin: "20px auto", padding: 20, fontFamily: "Arial" }}>
    <h1 style={{ textAlign: "center", color: "#2c3e50" }}>
      Generate & Print E-Way Bill
    </h1>

    {/* HEADERS BOX */}
    <div style={{ background: "#f1f2f6", padding: 20, borderRadius: 10, marginBottom: 25 }}>
      <h2>🔐 Request Headers</h2>
      <pre style={{ background: "#dfe4ea", padding: 15, borderRadius: 8 }}>
{JSON.stringify({
  "X-Auth-Token": auth.token ? auth.token.slice(0, 15) + "..." : "MISSING",
  companyId: auth.companyId || "MISSING",
  product: "TOPAZ"
}, null, 2)}
      </pre>
    </div>

    {/* PAYLOAD PREVIEW BOX */}
    <div style={{ background: "#f1f2f6", padding: 20, borderRadius: 10, marginBottom: 25 }}>
      <h2>📦 Payload Preview</h2>
      <pre style={{ background: "#dfe4ea", padding: 15, borderRadius: 8, overflowX: "auto" }}>
        {JSON.stringify(formData, null, 2)}
      </pre>
    </div>

    {/* FORM */}
    <form onSubmit={handleGenerate}>
      <div style={{ background: "#ffffff", padding: 20, borderRadius: 10, border: "1px solid #ccc" }}>
        <h2>✏️ Editable Payload Fields</h2>

        {Object.keys(formData)
          .filter(k => k !== "itemList" && typeof formData[k] !== "object")
          .map(key => (
            <div key={key} style={{ display: "flex", marginBottom: 10 }}>
              <label style={{ width: 220, fontWeight: "bold" }}>{key}</label>
              <input
                name={key}
                value={formData[key]}
                onChange={e =>
                  setFormData(prev => ({ ...prev, [key]: e.target.value }))
                }
                style={{ flex: 1, padding: 8 }}
              />
            </div>
          ))}
      </div>

      {/* ITEM LIST */}
      <h2 style={{ marginTop: 30 }}>📦 Item List</h2>

      {formData.itemList.map((item, idx) => (
        <div
          key={idx}
          style={{
            border: "2px dashed #95a5a6",
            padding: 20,
            marginBottom: 20,
            borderRadius: 10,
            background: "#ecf0f1"
          }}
        >
          <h3>Item #{idx + 1}</h3>

          {Object.keys(item).map(attr => (
            <div key={attr} style={{ display: "flex", marginBottom: 8 }}>
              <label style={{ width: 200 }}>{attr}</label>
              <input
                value={item[attr]}
                onChange={e => {
                  const v = e.target.value;
                  setFormData(prev => {
                    const items = [...prev.itemList];
                    items[idx] = { ...items[idx], [attr]: v };
                    return { ...prev, itemList: items };
                  });
                }}
                style={{ flex: 1, padding: 6 }}
              />
            </div>
          ))}
        </div>
      ))}

      {/* ACTION BUTTON */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: 18,
          fontSize: 18,
          background: loading ? "#95a5a6" : "#27ae60",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          marginTop: 20
        }}
      >
        {loading ? "Generating..." : "Generate E-Way Bill"}
      </button>
    </form>

    {/* PRINT BUTTON */}
    <button
      onClick={handlePrint}
      disabled={!ewbNos.length}
      style={{
        width: "100%",
        padding: 16,
        fontSize: 18,
        marginTop: 15,
        background: "#1A73E8",
        color: "#fff",
        border: "none",
        borderRadius: 8
      }}
    >
      Print PDF
    </button>

    {/* SUCCESS BOX */}
    {apiResponse && (
      <div
        style={{
          marginTop: 40,
          padding: 30,
          background: "#f8f9fa",
          border: "3px solid #27ae60",
          borderRadius: 12
        }}
      >
        <h2 style={{ color: "#27ae60", textAlign: "center" }}>
          ✅ E-Way Bill Generated Successfully
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 15 }}>
          <div><b>EWB No:</b> {apiResponse.response.ewbNo}</div>
          <div><b>Valid Upto:</b> {apiResponse.response.validUpto}</div>
          <div><b>Invoice No:</b> {apiResponse.response.docNo}</div>
          <div><b>Total Value:</b> ₹{apiResponse.response.totInvValue}</div>
        </div>

        <details style={{ marginTop: 20 }}>
          <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
            Full API Response
          </summary>
          <pre style={{ marginTop: 10 }}>
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </details>
      </div>
    )}

    {error && <p style={{ color: "red", marginTop: 20 }}>❌ {error}</p>}
  </div>
);

};

export default EwbGenerateAndPrint;
