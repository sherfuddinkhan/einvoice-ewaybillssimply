import React, { useState } from "react";
import axios from "axios";

const colors = {
  primary: "#1A73E8",
  success: "#34A853",
  danger: "#EA4335",
  background: "#F8F9FA",
};

// -------------------- INITIAL PAYLOAD --------------------
const initialPayload = {
  userGstin: "01AAACI9260R002",
  pobCode: null,
  supplyType: "O",
  ntr: "Inter",
  docType: "C",
  catg: "B2B",
  dst: "O",
  trnTyp: "REG",

  no: "CN-5001",
  dt: "15-06-2026",

  refinum: "AG45y6/4327",
  refidt: "28-03-2026",

  pos: "27",
  diffprcnt: null,
  etin: null,
  rchrg: "N",

  sgstin: "01AAACI9260R002",
  strdNm: "TEST Company",
  slglNm: "TEST PROD",
  sbnm: "Testing",
  sflno: "ABC",
  sloc: "BANGALOR32",
  sdst: "BENGALURU",
  sstcd: "01",
  spin: "192233",
  sph: "123456111111",
  sem: "abc123@gmail.com",

  bgstin: "02AAACI9260R002",
  btrdNm: "TEST ENTERPRISES",
  blglNm: "TEST PRODUCT",
  bbnm: "ABCD12345",
  bflno: "abc",
  bloc: "Jijamat",
  bdst: "BANGALORE",
  bstcd: "02",
  bpin: "174001",
  bph: "989898111111",
  bem: "abc123@gmail.com",

  taxSch: "GST",

  totinvval: 500,
  tottxval: 390.63,
  tottiamt: 109.37,
  totcamt: 0,
  totsamt: 0,
  totcsamt: 0,
  totstcsamt: 0,

  rndOffAmt: 0,
  sec7act: "N",
  invRmk: "Goods returned against Invoice AG45y6/4327",
  oinvtyp: "B2CL",

  genIrn: true,
  genewb: "N",
  signedDataReq: true,

  itemList: [
    {
      num: "00001",
      prdDesc: "Goods Returned",
      prdNm: "SEAMLESS STEEL TUBE 10X2 -U71889903",
      hsnCd: "73041190",
      qty: 1,
      unit: "NOS",
      unitPrice: 390.63,
      txval: 390.63,
      iamt: 109.37,
      rt: 28,
      itmVal: 500,
    },
  ],

  invRefPreDtls: [
    {
      no: "AG45y6/4327",
      oidt: "28-03-2026",
      othRefNo: null,
    },
  ],

  invRefContDtls: [
    {
      paymode: "UPI",
      trid: "123456789",
      rapd: "100.00",
    },
  ],
};

// -------------------- COMPONENT --------------------
const GenerateandprintCNinvoice = () => {
  const [payload, setPayload] = useState(initialPayload);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  // -------------------- UPDATE FIELD --------------------
  const setField = (key, value) => {
    setPayload((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // -------------------- ITEM UPDATE --------------------
  const updateItem = (index, key, value) => {
    const updatedItems = [...payload.itemList];
    updatedItems[index][key] = value;

    setPayload({
      ...payload,
      itemList: updatedItems,
    });
  };

  // -------------------- ADD ITEM --------------------
  const addItem = () => {
    setPayload({
      ...payload,
      itemList: [
        ...payload.itemList,
        {
          num: String(payload.itemList.length + 1).padStart(5, "0"),
          prdNm: "New Product",
          prdDesc: "Description",
          hsnCd: "0000",
          qty: 1,
          unit: "NOS",
          unitPrice: 0,
          txval: 0,
          rt: 18,
          itmVal: 0,
        },
      ],
    });
  };

  // -------------------- REMOVE ITEM --------------------
  const removeItem = (index) => {
    const filtered = payload.itemList.filter((_, i) => i !== index);
    setPayload({ ...payload, itemList: filtered });
  };

  // -------------------- GENERATE API CALL --------------------
  const generateInvoice = async () => {
    try {
      setLoading(true);

      const res = await axios.post(
        "https://einvoice.fcssoftwares.com/api/gst/einvoice/generate-irn",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Token": "YOUR_TOKEN",
            companyId: "24",
            product: "ONYX",
          },
        }
      );

      setResponse(res.data);
    } catch (err) {
      console.error(err);
      alert("Error generating invoice");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- UI --------------------
  return (
    <div style={{ padding: 20, background: colors.background }}>
      <h2 style={{ color: colors.primary }}>E-Invoice Editor</h2>

      {/* BASIC INFO */}
      <div>
        <input value={payload.no} onChange={(e) => setField("no", e.target.value)} placeholder="Invoice No" />
        <input value={payload.dt} onChange={(e) => setField("dt", e.target.value)} placeholder="Date" />
        <input value={payload.pos} onChange={(e) => setField("pos", e.target.value)} placeholder="POS" />
      </div>

      {/* ITEMS */}
      <h3>Items</h3>
      {payload.itemList.map((item, idx) => (
        <div key={idx} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <input
            value={item.prdNm}
            onChange={(e) => updateItem(idx, "prdNm", e.target.value)}
            placeholder="Product Name"
          />
          <input
            type="number"
            value={item.qty}
            onChange={(e) => updateItem(idx, "qty", Number(e.target.value))}
            placeholder="Qty"
          />
          <input
            type="number"
            value={item.unitPrice}
            onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
            placeholder="Unit Price"
          />

          <button onClick={() => removeItem(idx)}>Remove</button>
        </div>
      ))}

      <button onClick={addItem}>+ Add Item</button>

      {/* GENERATE */}
      <div style={{ marginTop: 20 }}>
        <button onClick={generateInvoice} disabled={loading}>
          {loading ? "Generating..." : "Generate IRN"}
        </button>
      </div>

      {/* RESPONSE */}
      {response && (
        <pre style={{ marginTop: 20, background: "#000", color: "#0f0", padding: 10 }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}
export default GenerateandprintCNinvoice;