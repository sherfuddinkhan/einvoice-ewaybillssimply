import React, { useEffect, useState } from "react";

/* ----------------------------
   LocalStorage Keys
---------------------------- */
const STORAGE_KEY = "iris_einvoice_response";
const STORAGE_KEY1 = "iris_einvoice_shared_config";
const STORAGE_KEY2 = "iris_einvoice_irn_ewabill";

const ListEInvoices = () => {
  /* -------------------------
     Headers
  ------------------------- */
  const [headers, setHeaders] = useState({
    accept: "application/json",
    companyId: "",
    "X-Auth-Token": "",
    product: "ONYX",
    "Content-Type": "application/json",
  });

  /* -------------------------
     Payload
  ------------------------- */
  const [payload, setPayload] = useState({
    gstin: "",
    CompanyUniqueCode: "",
    docNo: ["12369"],
    fromDt: "19/02/2020",
    toDt: "19/02/2020",
    btrdNm: "Aamir Traders",
    catg: ["B2B"],
    docType: ["RI"],
    invStatus: ["UPLOADED", "IRN_GENERATED"],
    irnStatus: ["ACT", "CNL"],
    totinvval: { gt: "8000" },
    itemCount: { gt: "0" },
    hasError: false,
    hasWarning: true,
    page: 0,
    size: 50,
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  /* -------------------------
     Auto-load headers and payload
  ------------------------- */
  useEffect(() => {
    const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY1) || "{}");
    const savedResponse = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    setHeaders((prev) => ({
      ...prev,
      companyId: savedConfig.companyUniqueCode || "24",
      "X-Auth-Token": savedResponse.token || "",
    }));

    setPayload((prev) => ({
      ...prev,
      gstin: savedConfig.companyUniqueCode || "01AAACI9260R002",
      CompanyUniqueCode: savedConfig.companyUniqueCode || "01AAACI9260R002",
    }));
  }, []);

  /* -------------------------
     Helpers
  ------------------------- */
  const updateHeader = (k, v) => setHeaders((p) => ({ ...p, [k]: v }));
  const updatePayload = (k, v) => setPayload((p) => ({ ...p, [k]: v }));
  const updateArray = (k, v) =>
    setPayload((p) => ({ ...p, [k]: v.split(",").map((i) => i.trim()) }));

  /* -------------------------
     API Call
  ------------------------- */
  const fetchInvoices = async () => {
    if (!payload.CompanyUniqueCode) {
      return alert("Company Unique Code is mandatory");
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("http://localhost:3001/proxy/einvoice/view", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------
     UI
  ------------------------- */
  return (
    <div style={{ padding: 30, background: "#f1f8e9", minHeight: "100vh" }}>
      <h2>List E-Invoices</h2>

      <div style={card}>
        <h4>Request URL</h4>
        <pre style={urlBox}>
https://stage-api.irisgst.com/irisgst/onyx/einvoice/view
        </pre>

        <h4>Headers</h4>
        {Object.entries(headers).map(([k, v]) => (
          <Row key={k} label={k}>
            <input value={v} onChange={(e) => updateHeader(k, e.target.value)} />
          </Row>
        ))}

        <h4 style={{ marginTop: 25 }}>Payload</h4>

        <Row label="GSTIN">
          <input value={payload.gstin} onChange={(e) => updatePayload("gstin", e.target.value)} />
        </Row>

        <Row label="Company Unique Code">
          <input
            value={payload.CompanyUniqueCode}
            onChange={(e) => updatePayload("CompanyUniqueCode", e.target.value)}
          />
        </Row>

        <Row label="Doc No (comma separated)">
          <input value={payload.docNo.join(",")} onChange={(e) => updateArray("docNo", e.target.value)} />
        </Row>

        <Row label="From Date">
          <input value={payload.fromDt} onChange={(e) => updatePayload("fromDt", e.target.value)} />
        </Row>

        <Row label="To Date">
          <input value={payload.toDt} onChange={(e) => updatePayload("toDt", e.target.value)} />
        </Row>

        <Row label="Buyer Trade Name">
          <input value={payload.btrdNm} onChange={(e) => updatePayload("btrdNm", e.target.value)} />
        </Row>

        <Row label="Category">
          <input value={payload.catg.join(",")} onChange={(e) => updateArray("catg", e.target.value)} />
        </Row>

        <Row label="Doc Type">
          <input value={payload.docType.join(",")} onChange={(e) => updateArray("docType", e.target.value)} />
        </Row>

        <Row label="Invoice Status">
          <input value={payload.invStatus.join(",")} onChange={(e) => updateArray("invStatus", e.target.value)} />
        </Row>

        <Row label="IRN Status">
          <input value={payload.irnStatus.join(",")} onChange={(e) => updateArray("irnStatus", e.target.value)} />
        </Row>

        <Row label="Total Invoice Value &gt;">
          <input
            value={payload.totinvval.gt}
            onChange={(e) => updatePayload("totinvval", { gt: e.target.value })}
          />
        </Row>

        <Row label="Item Count &gt;">
          <input
            value={payload.itemCount.gt}
            onChange={(e) => updatePayload("itemCount", { gt: e.target.value })}
          />
        </Row>

        <Row label="Has Error">
          <input type="checkbox" checked={payload.hasError} onChange={(e) => updatePayload("hasError", e.target.checked)} />
        </Row>

        <Row label="Has Warning">
          <input type="checkbox" checked={payload.hasWarning} onChange={(e) => updatePayload("hasWarning", e.target.checked)} />
        </Row>

        <Row label="Page">
          <input value={payload.page} onChange={(e) => updatePayload("page", Number(e.target.value))} />
        </Row>

        <Row label="Size">
          <input value={payload.size} onChange={(e) => updatePayload("size", Number(e.target.value))} />
        </Row>

        <button onClick={fetchInvoices} disabled={loading} style={btn}>
          {loading ? "Fetching..." : "SEARCH E-INVOICES"}
        </button>
      </div>

      {response && <pre style={responseBox}>{JSON.stringify(response, null, 2)}</pre>}
    </div>
  );
};

/* -------------------------
   Row Component
------------------------- */
const Row = ({ label, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", marginBottom: 12 }}>
    <strong>{label}</strong>
    {children}
  </div>
);

/* -------------------------
   Styles
------------------------- */
const card = {
  background: "#fff",
  padding: 25,
  borderRadius: 14,
  maxWidth: 1000,
  margin: "auto",
  boxShadow: "0 10px 30px rgba(0,0,0,.15)",
};

const urlBox = { background: "#eee", padding: 10 };
const btn = {
  marginTop: 25,
  width: "100%",
  padding: 14,
  background: "#2e7d32",
  color: "#fff",
  fontSize: 18,
  borderRadius: 10,
};
const responseBox = {
  marginTop: 25,
  background: "#1e1e1e",
  color: "#00e676",
  padding: 20,
  borderRadius: 10,
};

export default ListEInvoices;
