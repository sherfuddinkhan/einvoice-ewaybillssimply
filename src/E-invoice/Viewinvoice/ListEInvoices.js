import React, { useEffect, useState } from "react";

/* ----------------------------
    LocalStorage Keys
---------------------------- */
const STORAGE_KEY = "iris_einvoice_response";
const STORAGE_KEY1 = "iris_einvoice_shared_config";
const EINV_DOC_KEY = "iris_einv_doc_map";

// Helper to convert DD/MM/YYYY to YYYY-MM-DD (ISO format for input[type="date"])
const convertDMYToYMD = (dateStr) => {
    if (!dateStr || dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
};

// Helper to convert YYYY-MM-DD (ISO format) to DD/MM/YYYY (API format)
const convertYMDToDMY = (dateStr) => {
    if (!dateStr || dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
};

// Helper to simulate storing IRN data (for initial testing purposes)
const updateLocalStorageDocMap = (docNo, ackDt) => {
    try {
        const existingMap = JSON.parse(localStorage.getItem(EINV_DOC_KEY) || "[]");
        const newEntry = {
            docNo: docNo,
            createdAt: ackDt 
        };

        const exists = existingMap.some(entry => entry.docNo === docNo);
        if (!exists) {
            existingMap.push(newEntry);
            localStorage.setItem(EINV_DOC_KEY, JSON.stringify(existingMap));
        }
    } catch (e) {
        console.error("Failed to update Local Storage document map:", e);
    }
};


const ListEInvoices = () => {
    const [docMap, setDocMap] = useState([]);

    const [headers, setHeaders] = useState({
        accept: "application/json",
        companyId: "",
        "X-Auth-Token": "",
        product: "ONYX",
        "Content-Type": "application/json",
    });

    const [payload, setPayload] = useState({
        companyUniqueCode: "", 
        docNo: ["1s4345"], 
        fromDt: convertDMYToYMD("20/12/2025"), 
        toDt: convertDMYToYMD("20/12/2025"),   
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

    /* ----------------------------------------------------
        FIXED Helper to get documents within a date range 
        Considers full datetime of documents
    ---------------------------------------------------- */
    const getDocNumbersByDateRange = (map, fromDt, toDt) => {
        const parseInputDate = (dateInput) => {
            if (!dateInput) return null;
            if (dateInput.includes('-')) return new Date(dateInput);
            if (dateInput.includes('/')) {
                const parts = dateInput.split('/');
                return new Date(parts[2], parts[1] - 1, parts[0]);
            }
            return null;
        };

        const fromDateObj = parseInputDate(fromDt);
        const toDateObj = parseInputDate(toDt);

        if (!fromDateObj || !toDateObj) {
            console.warn("Invalid date range detected.");
            return [];
        }

        // Include full 'to' date
        const startTimestamp = fromDateObj.getTime();
        const endTimestamp = toDateObj.getTime() + 24*60*60*1000 - 1;

        const filteredDocs = map.filter(entry => {
            const entryDateObj = parseInputDate(entry.createdAt);
            if (!entryDateObj) return false;
            const entryTimestamp = entryDateObj.getTime();
            return entryTimestamp >= startTimestamp && entryTimestamp <= endTimestamp;
        });

        return filteredDocs.map(entry => entry.docNo);
    };


    /* -------------------------
        Auto-load headers, payload, and Doc Map
    ------------------------- */
    useEffect(() => {
        const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY1) || "{}");
        const savedResponse = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        
        if (!localStorage.getItem(EINV_DOC_KEY)) {
            updateLocalStorageDocMap("1s4345", "2025-12-20 20:57:36");
            updateLocalStorageDocMap("987654", "2024-12-20 10:00:00");
            updateLocalStorageDocMap("111111", "2025-11-15 05:00:00");
        }

        try {
            const loadedDocMap = JSON.parse(localStorage.getItem(EINV_DOC_KEY) || "[]");
            setDocMap(loadedDocMap);
            console.log(`Loaded ${loadedDocMap.length} documents from ${EINV_DOC_KEY}.`);
        } catch (e) {
            console.error("Error loading document map:", e);
        }

        setHeaders((prev) => ({
            ...prev,
            companyId: savedConfig.companyId || "24",
            "X-Auth-Token": savedResponse.token || "",
        }));

        setPayload((prev) => ({
            ...prev,
            companyUniqueCode: savedConfig.companyUniqueCode || "01AAACI9260R002",
        }));
    }, []);

    /* -------------------------
        Helpers (Update payload and constraints)
    ------------------------- */
    const updateHeader = (k, v) => setHeaders((p) => ({ ...p, [k]: v }));
    
    const updatePayload = (k, v) => {
        setPayload((p) => {
            let newPayload = { ...p, [k]: v };
            let updatedFromDt = newPayload.fromDt;
            let updatedToDt = newPayload.toDt;

            const newDate = new Date(v);
            
            if (k === "fromDt" && newDate > new Date(p.toDt)) {
                newPayload.toDt = v;
                updatedToDt = v;
            } else if (k === "toDt" && newDate < new Date(p.fromDt)) {
                newPayload.fromDt = v;
                updatedFromDt = v;
            }

            if (k === "fromDt" || k === "toDt") {
                if (updatedFromDt && updatedToDt && docMap.length > 0) {
                    const docsArray = getDocNumbersByDateRange(docMap, updatedFromDt, updatedToDt);
                    newPayload.docNo = docsArray; 
                    console.log(`Dates changed to ${updatedFromDt} - ${updatedToDt}. Auto-populated Docs: ${docsArray.join(', ')}`);
                }
            }

            return newPayload;
        });
    };

    const updateArray = (k, v) =>
        setPayload((p) => ({ 
            ...p, 
            [k]: v.split(",").map((i) => i.trim()).filter(i => i) 
        }));

    /* -------------------------
        API Call (Converts YYYY-MM-DD state to DD/MM/YYYY for API)
    ------------------------- */
    const fetchInvoices = async () => {
        if (!payload.companyUniqueCode) { 
            return alert("Company Unique Code is mandatory");
        }

        setLoading(true);
        setResponse(null);

        const finalPayload = { ...payload };
        finalPayload.fromDt = convertYMDToDMY(payload.fromDt);
        finalPayload.toDt = convertYMDToDMY(payload.toDt);

        console.log("Sending Payload:", finalPayload); 

        try {
            const res = await fetch("http://localhost:3001/proxy/einvoice/view", {
                method: "POST",
                headers,
                body: JSON.stringify(finalPayload),
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
        UI (Unchanged)
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
                
                <Row label="Company Unique Code">
                    <input
                        value={payload.companyUniqueCode}
                        onChange={(e) => updatePayload("companyUniqueCode", e.target.value)}
                    />
                </Row>

                <Row label="Doc No (Comma-separated/Auto-populated)">
                    <input 
                        value={payload.docNo.join(",")} 
                        onChange={(e) => updateArray("docNo", e.target.value)} 
                        placeholder="e.g., 123, 456, 789"
                    />
                </Row>

                <Row label="From Date">
                    <input 
                        type="date" 
                        value={payload.fromDt} 
                        onChange={(e) => updatePayload("fromDt", e.target.value)} 
                        max={payload.toDt} 
                    />
                </Row>

                <Row label="To Date">
                    <input 
                        type="date" 
                        value={payload.toDt} 
                        onChange={(e) => updatePayload("toDt", e.target.value)} 
                        min={payload.fromDt} 
                    />
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
    Row Component and Styles (Unchanged)
------------------------- */
const Row = ({ label, children }) => (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", marginBottom: 12 }}>
        <strong>{label}</strong>
        {children}
    </div>
);

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
    cursor: 'pointer'
};
const responseBox = {
    marginTop: 25,
    background: "#1e1e1e",
    color: "#00e676",
    padding: 20,
    borderRadius: 10,
    whiteSpace: 'pre-wrap'
};

export default ListEInvoices;
