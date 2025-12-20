import React, { useEffect, useState } from "react";

/* ----------------------------
    LocalStorage Keys
---------------------------- */
const STORAGE_KEY = "iris_einvoice_response";
const STORAGE_KEY1 = "iris_einvoice_shared_config";
const EINV_DOC_KEY = "iris_einv_doc_map";

// Helper to convert DD/MM/YYYY to YYYY-MM-DD (ISO format)
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

// Helper to simulate storing IRN data (included for testing context)
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
            console.log(`Successfully stored DocNo ${docNo} in Local Storage.`);
        }
    } catch (e) {
        console.error("Failed to update Local Storage document map:", e);
    }
};


const ListEInvoices = () => {
    const [docMap, setDocMap] = useState([]);

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
        Payload (Dates stored in YYYY-MM-DD for UI calendar compatibility)
    ------------------------- */
    const [payload, setPayload] = useState({
        companyUniqueCode: "", 
        docNo: ["1s4345"], 
        fromDt: convertDMYToYMD("20/12/2025"), // Stored as "2025-12-20"
        toDt: convertDMYToYMD("20/12/2025"),   // Stored as "2025-12-20"
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
        Helper to get documents within a date range (Handles filtering)
    ------------------------- */
    const getDocNumbersByDateRange = (map, fromDt, toDt) => {
        // Since fromDt/toDt are now guaranteed to be YYYY-MM-DD, parsing is simpler
        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            return new Date(dateStr); // New Date handles YYYY-MM-DD natively
        };

        const fromDate = parseDate(fromDt);
        const toDate = parseDate(toDt);

        if (isNaN(fromDate) || isNaN(toDate)) {
            console.warn("Invalid date format detected. Cannot filter documents.");
            return []; 
        }

        const filteredDocs = map.filter(entry => {
            const entryDate = new Date(entry.createdAt);
            if (isNaN(entryDate)) return false;

            // Normalize comparison dates to the start of the day
            const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
            const startOfFromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
            const startOfToDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());

            return entryDateOnly >= startOfFromDate && entryDateOnly <= startOfToDate;
        });

        return filteredDocs.map(entry => entry.docNo); 
    };


    /* -------------------------
        Auto-load headers, payload, and Doc Map
    ------------------------- */
    useEffect(() => {
        const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY1) || "{}");
        const savedResponse = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        
        // --- SIMULATE DATA POPULATION ---
        if (!localStorage.getItem(EINV_DOC_KEY)) {
            updateLocalStorageDocMap("1s4345", "2025-12-20 20:57:36");
        }
        // --------------------------------

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
        Helpers
    ------------------------- */
    const updateHeader = (k, v) => setHeaders((p) => ({ ...p, [k]: v }));
    
    const updatePayload = (k, v) => {
        setPayload((p) => {
            let newPayload = { ...p, [k]: v };

            // Logic to auto-populate docNo when dates change
            if (k === "fromDt" || k === "toDt") {
                const fromDt = k === "fromDt" ? v : p.fromDt;
                const toDt = k === "toDt" ? v : p.toDt;

                if (fromDt && toDt && docMap.length > 0) {
                    const docsArray = getDocNumbersByDateRange(docMap, fromDt, toDt);
                    newPayload.docNo = docsArray; 
                    
                    console.log(`Dates changed to ${fromDt} - ${toDt}. Auto-populated Docs: ${docsArray.join(', ')}`);

                } else if (docMap.length === 0) {
                    console.log("Document map is empty. Cannot auto-populate docNo.");
                }
            }

            return newPayload;
        });
    };

    const updateArray = (k, v) =>
        setPayload((p) => ({ ...p, [k]: v.split(",").map((i) => i.trim()).filter(i => i) }));

    /* -------------------------
        API Call (MODIFIED: Convert dates to DD/MM/YYYY here)
    ------------------------- */
    const fetchInvoices = async () => {
        if (!payload.companyUniqueCode) { 
            return alert("Company Unique Code is mandatory");
        }

        setLoading(true);
        setResponse(null);

        // 1. Create a temporary payload copy
        const finalPayload = { ...payload };

        // 2. CONVERT DATES to DD/MM/YYYY for the API
        finalPayload.fromDt = convertYMDToDMY(payload.fromDt);
        finalPayload.toDt = convertYMDToDMY(payload.toDt);

        console.log("Sending Payload:", finalPayload); // Check the format here

        try {
            const res = await fetch("http://localhost:3001/proxy/einvoice/view", {
                method: "POST",
                headers,
                body: JSON.stringify(finalPayload), // Use the converted payload
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
        UI (Uses type="date")
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
                    <input type="date" value={payload.fromDt} onChange={(e) => updatePayload("fromDt", e.target.value)} />
                </Row>

                <Row label="To Date">
                    <input type="date" value={payload.toDt} onChange={(e) => updatePayload("toDt", e.target.value)} />
                </Row>

                <Row label="Buyer Trade Name">
                    <input value={payload.btrdNm} onChange={(e) => updatePayload("btrdNm", e.target.value)} />
                </Row>
                {/* ... (other payload rows remain the same) */}
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