import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

/* ───────────────────────────
   Storage helpers
─────────────────────────── */
const STORAGE_KEY = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

const safeParse = (v, fallback = {}) => {
  try {
    return JSON.parse(v || "null") ?? fallback;
  } catch {
    return fallback;
  }
};

/* ───────────────────────────
   Styling
─────────────────────────── */
const COLORS = {
  success: "#27ae60",
  danger: "#e74c3c",
  primary: "#3498db",
};

const containerStyle = {
  maxWidth: "1300px",
  margin: "20px auto",
  padding: "20px",
  fontFamily: "Arial, sans-serif",
};

const grid3 = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "16px",
};

const field = {
  display: "flex",
  flexDirection: "column",
};

const label = {
  fontSize: "13px",
  fontWeight: "bold",
  marginBottom: "4px",
};

const input = {
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

/* ───────────────────────────
   Default Payload
─────────────────────────── */
const DEFAULT_FORM = {
  supplyType: "O",
  subSupplyType: "1",
  docType: "INV",
  docNo: "Topaz340290",
  invType: "B2B",
  docDate: "15/11/2025",
  transactionType: 1,
  fromGstin: "",
  fromTrdName: "ABC",
  dispatchFromGstin: "",
  dispatchFromTradeName: "PQR",
  fromAddr1: "T231",
  fromAddr2: "IIP",
  fromPlace: "Akodiya",
  fromPincode: 248001,
  fromStateCode: 5,
  toGstin: "05AAAAU1183B1Z0",
  toTrdName: "RJ-Rawat Foods",
  toAddr1: "S531",
  toAddr2: "MG Road",
  toPlace: "Dehradun",
  toPincode: 248002,
  toStateCode: 5,
  totInvValue: 21000,
  totalValue: 20000,
  cgstValue: 500,
  sgstValue: 500,
  igstValue: 0,
  transMode: 1,
  transDistance: 10,
  transDocDate: "15/11/2025",
  transDocNo: "1212",
  transporterId: "",
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
      iamt: 0,
      camt: 500,
      samt: 500,
      txp: "T",
    },
  ],
  companyId: "",
  userGstin: "",
  forceDuplicateCheck: true,
};

/* ───────────────────────────
   Main Component
─────────────────────────── */
const EwbGenerateAndPrint = () => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiResponse, setApiResponse] = useState(null);

  /* ───── Load auth from storage ───── */
  useEffect(() => {
    const login = safeParse(localStorage.getItem(STORAGE_KEY), {});
    const token = login?.token || login?.fullResponse?.response?.token || "";
    const companyId = login?.companyId || login?.fullResponse?.response?.companyId || "";
    const userGstin =
      login?.userGstin ||
      login?.fullResponse?.response?.userGstin ||
      login?.fullResponse?.response?.user?.gstin ||
      "";

    setFormData((p) => ({
      ...p,
      companyId,
      userGstin,
      fromGstin: userGstin,
      dispatchFromGstin: userGstin,
      transporterId: userGstin,
    }));
  }, []);

  /* ───── Form handlers ───── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleItemChange = (idx, e) => {
    const { name, value } = e.target;
    setFormData((p) => {
      const items = [...p.itemList];
      items[idx] = { ...items[idx], [name]: value };
      return { ...p, itemList: items };
    });
  };

  const addItem = () =>
    setFormData((p) => ({
      ...p,
      itemList: [...p.itemList, {}],
    }));

  const removeItem = (idx) =>
    setFormData((p) => ({
      ...p,
      itemList: p.itemList.filter((_, i) => i !== idx),
    }));

  /* ───── Submit ───── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setApiResponse(null);

    const login = safeParse(localStorage.getItem(STORAGE_KEY), {});
    const token = login?.token || "";
    const companyId = login?.companyId || "";

    try {
      const res = await axios.post(
        "http://localhost:3001/proxy/topaz/ewb/generate",
        formData,
        {
          headers: {
            "X-Auth-Token": token,
            companyId,
            product: "TOPAZ",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.status === "SUCCESS") {
        setApiResponse(res.data);
        localStorage.setItem(
          LATEST_EWB_KEY,
          JSON.stringify({ ...res.data.response, payload: formData })
        );
      } else {
        throw new Error(res.data?.message);
      }
    } catch (err) {
      setError(err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: "center" }}>Generate E-Way Bill</h1>

      <form onSubmit={handleSubmit}>
        {/* ===== MAIN FORM : 3 COLUMNS ===== */}
        <div style={grid3}>
          {Object.keys(formData)
            .filter((k) => k !== "itemList")
            .map((key) => (
              <div key={key} style={field}>
                <label style={label}>{key}</label>
                <input
                  name={key}
                  value={formData[key] ?? ""}
                  onChange={handleChange}
                  style={input}
                />
              </div>
            ))}
        </div>

        {/* ===== ITEM LIST ===== */}
        <h3 style={{ marginTop: 30 }}>Item List</h3>

        {formData.itemList.map((item, idx) => (
          <div
            key={idx}
            style={{
              marginTop: 20,
              padding: 20,
              border: "2px dashed #ccc",
              borderRadius: 10,
            }}
          >
            <div style={grid3}>
              {Object.keys(item).map((attr) => (
                <div key={attr} style={field}>
                  <label style={label}>{attr}</label>
                  <input
                    name={attr}
                    value={item[attr] ?? ""}
                    onChange={(e) => handleItemChange(idx, e)}
                    style={input}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => removeItem(idx)}
              style={{
                marginTop: 15,
                background: COLORS.danger,
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
              }}
            >
              Remove Item
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          style={{
            marginTop: 20,
            background: COLORS.primary,
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 6,
            border: "none",
          }}
        >
          + Add Item
        </button>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 30,
            width: "100%",
            padding: 16,
            fontSize: 18,
            background: loading ? "#aaa" : COLORS.success,
            color: "#fff",
            border: "none",
            borderRadius: 8,
          }}
        >
          {loading ? "Generating..." : "Generate E-Way Bill"}
        </button>
      </form>

      {error && <p style={{ color: COLORS.danger }}>{error}</p>}
    </div>
  );
};

export default EwbGenerateAndPrint;
