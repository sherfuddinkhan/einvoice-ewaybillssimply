// ===============================
// server.js (CLEAN FINAL VERSION - REWRITTEN WITH DIRECT SQL CONTROLLERS)
// ===============================
 
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const FormData = require("form-data");
const sql = require("mssql"); // Import mssql for DB

const app = express();
const PORT = 3001;
const BASE_URL = "https://stage-api.irisgst.com";

/* =======================
    DATABASE CONFIG & CONNECTION
======================= */
const dbConfig = {
    server: "DESKTOP-BUGKGO7",
    database: "EWayBillDB",
    user: "nodeuser",
    password: "Node@123",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Global Connection Pool Promise
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log("✅ Connected to SQL Server");
        // Store the pool object on the app for access in route handlers
        app.set("dbPool", pool);
        return pool;
    })
    .catch(err => {
        console.error("❌ DB connection failed:", err.message);
        process.exit(1);
    });

/* =======================
    CONTROLLERS (USER-PROVIDED DIRECT SQL)
======================= */

/**


/**
 * 2️⃣ Get record BY ID (using Stored Procedure)
 */
const getEwayBillById = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("Id", req.params.id) 
            .execute("dbo.sp_GetEWayBillById");

        const ewayBillHeader = result.recordsets[0];
        const ewayBillItems = result.recordsets[1];

        if (ewayBillHeader.length === 0) {
            return res.status(404).json({ message: "Record not found" });
        }
        
        res.json({
            ...ewayBillHeader[0], 
            items: ewayBillItems 
        });
        
    } catch (err) {
        console.error("DB Error in getEwayBillById:", err);
        res.status(500).json({ message: "DB Error" });
    }
};

/* =======================
    MIDDLEWARE
======================= */
app.use(express.json()); // For parsing application/json
app.use(
    cors({
        origin: ["http://localhost:3000", "http://localhost:3002"],
        credentials: true,
    })
);
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// ===============================
// File Upload (Memory)
// ===============================
const upload = multer();

/* =======================
    APIs (EWAYBILL DATABASE ROUTES)
    NOTE: These replace your old stored procedure routes
======================= */

/**
 * 1️⃣ Get ALL records (using new direct SQL controller)
 */


/**
 * 2️⃣ Get record BY ID (using new direct SQL controller)
 */
app.get("/api/ewaybill/:id", getEwayBillById);


// ===============================
// Helper: Auth Headers
// ===============================
const authHeaders = (req) => ({
    "X-Auth-Token":
        req.headers["x-auth-token"] ||
        req.headers["authorization"]?.replace("Bearer ", "") ||
        "",
    companyId: req.headers["companyid"] || req.headers["companyId"] || "",
    product: req.headers["product"] || "ONYX",
});

// ===============================
// Helper: Proxy Wrapper
// ===============================
const proxy = async (res, fn) => {
    try {
        const response = await fn();
        res.json(response.data);
    } catch (err) {
        console.error("Proxy Error:", err.response?.data || err.message);
        res
            .status(err.response?.status || 500)
            .json(err.response?.data || { error: "Proxy Error" });
    }
};

// ===============================
// Helper: EWB Print PDF
// ===============================
const printEWB = async (url, req, res, filename) => {
    try {
        const response = await axios.post(`${BASE_URL}${url}`, req.body, {
            headers: { Accept: "application/pdf", "Content-Type": "application/json", product: "TOPAZ", ...authHeaders(req) },
            responseType: "arraybuffer",
        });
        res.set("Content-Type", "application/pdf");
        res.set("Content-Disposition", `attachment; filename=${filename}`);
        res.send(response.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { error: "Print failed" });
    }
};

/* =====================================================
    1. AUTH – LOGIN / SWITCH
    ===================================================== */

// E-Way Bill Login
app.post("/proxy/ewaybill/login", (req, res) =>
    proxy(res, () =>
        axios.post(`${BASE_URL}/irisgst/mgmt/login`, req.body, {
            headers: { Accept: "application/json", "Content-Type": "application/json" },
        })
    )
);

// E-Invoice Login
app.post("/proxy/einvoice/login", (req, res) =>
    proxy(res, () =>
        axios.post(`${BASE_URL}/irisgst/mgmt/login`, req.body, {
            headers: { Accept: "application/json", "Content-Type": "application/json" },
        })
    )
);

/* =====================================================
    2. CHANGE PASSWORD (Sidebar → Change Password)
    ===================================================== */

// E-WAY Change Password
app.post("/proxy/EWchange-password", (req, res) =>
    proxy(res, () =>
        axios.post(
            `${BASE_URL}/irisgst/mgmt/public/user/changepassword`,
            req.body,
            { headers: { "Content-Type": "application/json" } }
        )
    )
);

// E-INVOICE Change Password
app.post("/proxy/EIchange-password", async (req, res) => {
    try {
        const response = await axios.post(
            `${BASE_URL}/irisgst/mgmt/public/user/changepassword`,
            req.body,
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(error.response ? error.response.status : 500).json(
            error.response ? error.response.data : { error: 'Proxy error' }
        );
    }
});

/* =====================================================
    3. E-WAY BILL → CORE
    ===================================================== */

// Generate EWB
app.post("/proxy/topaz/ewb/generate", (req, res) =>
    proxy(res, () =>
        axios.post(`${BASE_URL}/irisgst/topaz/api/v0.3/ewb`, req.body, {
            headers: {
                ...authHeaders(req),
                product: "TOPAZ",
                "Content-Type": "application/json",
            },
        })
    )
);

// Get EWB by Number
app.get("/proxy/topaz/ewb/byNumber", (req, res) =>
    proxy(res, () =>
        axios.get(`${BASE_URL}/irisgst/topaz/api/v0.3/getewb/ewbNo`, {
            params: req.query,
            headers: { ...authHeaders(req), product: "TOPAZ" },
        })
    )
);

// Get EWB Details
app.get("/proxy/topaz/ewb/details", (req, res) =>
    proxy(res, () =>
        axios.get(
            `${BASE_URL}/irisgst/topaz/api/v0.3/getewb/ewbDetails`,
            {
                params: req.query,
                headers: {
                    Accept: "application/json",
                    product: "TOPAZ",
                    ...authHeaders(req),
                },
            }
        )
    )
);

/* =====================================================
    4. E-WAY BILL → ACTIONS
    ===================================================== */

// EWB Actions (update / cancel / extend)
app.put("/proxy/topaz/ewb/action", (req, res) =>
    proxy(res, () =>
        axios.put(`${BASE_URL}/irisgst/topaz/api/v0.3/ewb`, req.body, {
            headers: {
                ...authHeaders(req),
                product: "TOPAZ",
                "Content-Type": "application/json",
            },
        })
    )
);

/* =====================================================
    5. E-WAY BILL → FETCH / CONSIGNEE
    ===================================================== */

// GET EWB BY DATE - PROXY ROUTE
app.get("/proxy/topaz/ewb/fetchByDate", async (req, res) => {
    try {
        const response = await axios.get(
            `${BASE_URL}/irisgst/topaz/api/v0.3/getewb/generatorEwbs`,
            {
                params: req.query,
                headers: {
                    Accept: "application/json",
                    product: "TOPAZ",
                    "X-Auth-Token": req.headers["x-auth-token"],
                    companyId: req.headers["companyid"],
                },
            }
        );
        res.json(response.data);
    } catch (err) {
        console.error(err);
        res.status(err.response?.status || 500).json({
            message: err.response?.data?.message || err.message,
        });
    }
});

// Transporter EWB
app.get("/proxy/topaz/api/transporter-ewb", async (req, res) => {
    try {
        const { date, userGstin, page = "1", size = "10", updateNeeded = "true" } = req.query;

        const companyId = req.headers["companyid"] || req.headers["companyId"];
        const token = req.headers["x-auth-token"];

        if (!companyId || !token) {
            return res.status(401).json({ status: "ERROR", message: "Missing auth headers" });
        }
        if (!date || !userGstin) {
            return res.status(400).json({ status: "ERROR", message: "date & userGstin required" });
        }

        const irisResponse = await axios.get(
            `${BASE_URL}/irisgst/topaz/api/v0.3/getewb/transporter`,
            {
                params: { date, userGstin, page, size, updateNeeded: updateNeeded === "true" },
                headers: {
                    accept: "application/json",
                    companyId,
                    "X-Auth-Token": token,
                    product: "TOPAZ",
                },
                timeout: 30000,
            }
        );

        res.json({
            status: "SUCCESS",
            response: irisResponse.data.response || irisResponse.data,
        });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            status: "ERROR",
            message: error.message,
            details: error.response?.data || null,
        });
    }
});

/* =====================================================
    6. E-WAY BILL → CONSOLIDATED EWB
    ===================================================== */

app.post("/proxy/topaz/cewb/generate", async (req, res) => {
    try {
        const response = await axios.post(
            `${BASE_URL}/irisgst/topaz/api/v0.3/cewb`,
            req.body, // payload from the client
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    product: "TOPAZ",
                    ...authHeaders(req), // include authentication headers
                },
            }
        );

        // send the response data back to the client
        res.json(response.data);
    } catch (err) {
        // handle errors
        const status = err.response?.status || 500;
        const data = err.response?.data || { message: err.message };
        res.status(status).json(data);
    }
});

app.get("/proxy/topaz/cewb/details", async (req, res) => {
    try {
        const response = await axios.get(
            `${BASE_URL}/irisgst/topaz/api/v0.3/cewb/getcewb`,
            {
                params: req.query,
                headers: {
                    Accept: "application/json",
                    product: "TOPAZ",
                    ...authHeaders(req), // assuming authHeaders(req) returns token & companyId
                },
            }
        );

        res.json(response.data);
    } catch (err) {
        console.error(err);
        res.status(err.response?.status || 500).json({
            message: err.response?.data?.message || err.message,
        });
    }
});

/* =====================================================
    7. E-WAY BILL → BY DOCUMENT
    ===================================================== */

app.get("/proxy/topaz/ewb/getByDocNumAndType", async (req, res) => {
    try {
        const { userGstin, docType, docNum } = req.query;

        if (!userGstin || !docType || !docNum) {
            return res.status(400).json({
                error: "Missing required query params: userGstin, docType, docNum",
                received: req.query,
            });
        }

        const irisUrl = `${BASE_URL}/irisgst/topaz/api/v0.3/getewb/docNumAndType`;

        const response = await axios.get(irisUrl, {
            params: {
                userGstin,
                docType,
                docNum,
            },
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                product: "TOPAZ",
                companyId: req.headers.companyid,        // from frontend
                "X-Auth-Token": req.headers["x-auth-token"],
            },
        });

        res.json(response.data);
    } catch (err) {
        // Handle API errors
        if (err.response) {
            return res.status(err.response.status).json(err.response.data);
        }
        res.status(500).json({ error: err.message });
    }
});

// POST /proxy/topaz/ewb/docNum
app.post("/proxy/topaz/ewb/docNum", async (req, res) => {
    try {
        const response = await axios.post(
            `${BASE_URL}/irisgst/topaz/api/v0.3/getewb/docNum`,
            req.body, // payload body
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    companyId: req.headers["companyid"],    // forward companyId header
                    "X-Auth-Token": req.headers["x-auth-token"],
                    product: "TOPAZ",
                    ...authHeaders(req), // if you have additional auth headers
                },
            }
        );

        res.json(response.data);
    } catch (err) {
        console.error(err);
        res.status(err.response?.status || 500).json({
            message: err.response?.data?.message || err.message,
        });
    }
});

app.get("/proxy/topaz/ewb/bulkDownload", async (req, res) => {
    try {
        const response = await axios.get(
            `${BASE_URL}/irisgst/topaz/api/v0.3/getewb/docNum/download`,
            {
                params: req.query,
                headers: { Accept: "application/json", product: "TOPAZ", ...authHeaders(req) },
            }
        );
        res.status(response.status).send(response.data);
    } catch (err) {
        console.error(err);
        res.status(err.response?.status || 500).send(err.response?.data || { error: err.message });
    }
});


// GET /proxy/topaz/ewb/bulkStatus
app.get("/proxy/topaz/ewb/bulkStatus", async (req, res) => {
    try {
        const response = await axios.get(
            `${BASE_URL}/irisgst/topaz/api/v0.3/getewb/docNum/status`,
            {
                params: {
                    companyId: req.query.companyId,
                    userGstin: req.query.userGstin,
                    docType: req.query.docType,
                    docNumList: req.query.docNumList,
                },
                headers: {
                    Accept: "application/json",
                    product: "TOPAZ",
                    ...authHeaders(req),
                },
            }
        );

        res.json(response.data);
    } catch (err) {
        console.error(err);
        res.status(err.response?.status || 500).json({
            message: err.response?.data?.message || err.message,
        });
    }
});

/* =====================================================
    8. E-WAY BILL → MULTI-VEHICLE
    ===================================================== */

// Initiate
app.post("/proxy/topaz/multiVehicle/initiate", (req, res) =>
    proxy(res, () =>
        axios.post(
            `${BASE_URL}/irisgst/topaz/api/v0.3/ewb/multiVehicle`,
            req.body,
            {
                headers: {
                    ...authHeaders(req),
                    product: "TOPAZ",
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        )
    )
);

// Get Requests
app.get("/proxy/topaz/multiVehicle/requests", (req, res) =>
    proxy(res, () =>
        axios.get(`${BASE_URL}/irisgst/topaz/api/v0.3/getewb/multiVehReq`, {
            params: req.query,
            headers: {
                ...authHeaders(req),
                product: "TOPAZ",
                Accept: "application/json",
            },
        })
    )
);

// Get Group Details
app.get("/proxy/topaz/multiVehicle/groupDetails", (req, res) =>
    proxy(res, () =>
        axios.get(`${BASE_URL}/irisgst/topaz/api/v0.3/getewb/multiVehDet`, {
            params: req.query,
            headers: {
                ...authHeaders(req),
                product: "TOPAZ",
                Accept: "application/json",
            },
        })
    )
);

// Add Vehicle
app.post("/proxy/topaz/multiVehicle/add", (req, res) =>
    proxy(res, () =>
        axios.post(
            `${BASE_URL}/irisgst/topaz/api/v0.3/ewb/multiVehicle/add`,
            req.body,
            {
                headers: {
                    ...authHeaders(req),
                    product: "TOPAZ",
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        )
    )
);

// Edit Vehicle
app.post("/proxy/topaz/multiVehicle/edit", (req, res) =>
    proxy(res, () =>
        axios.post(
            `${BASE_URL}/irisgst/topaz/api/v0.3/ewb/multiVehicle/edit`,
            req.body,
            {
                headers: {
                    ...authHeaders(req),
                    product: "TOPAZ",
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        )
    )
);

/* =====================================================
    9. E-WAY BILL → PRINT / SUMMARY
    ===================================================== */

app.post("/proxy/topaz/ewb/printDetails", (req, res) =>
    printEWB("/irisgst/topaz/ewb/print/details", req, res, "ewb-details.pdf")
);

app.post("/proxy/topaz/ewb/printSummary", (req, res) =>
    printEWB("/irisgst/topaz/ewb/print/summary", req, res, "ewb-summary.pdf")
);

/* =====================================================
    10. E-INVOICE → CORE
    ===================================================== */

// Generate IRN
app.post("/proxy/irn/addInvoice", (req, res) =>
    proxy(res, () =>
        axios.post(
            `${BASE_URL}/irisgst/onyx/irn/addInvoice`,
            req.body,
            { headers: { ...authHeaders(req), "Content-Type": "application/json" } }
        )
    )
);

// Get Invoice by IRN
app.get("/proxy/irn/getInvByIrn", (req, res) =>
    proxy(res, () =>
        axios.get(`${BASE_URL}/irisgst/onyx/irn/getInvByIrn`, {
            params: req.query,
            headers: authHeaders(req),
        })
    )
);

// Get IRN by Document
app.get("/proxy/irn/getIrnByDocDetails", (req, res) =>
    proxy(res, () =>
        axios.get(`${BASE_URL}/irisgst/onyx/irn/getIrnByDocDetails`, {
            params: {
                ...req.query,
                docDate: req.query.docDate?.replace(/-/g, "/"),
            },
            headers: authHeaders(req),
        })
    )
);

// Cancel IRN
app.put("/proxy/irn/cancel", (req, res) =>
    proxy(res, () =>
        axios.put(`${BASE_URL}/irisgst/onyx/irn/cancel`, req.body, {
            headers: { ...authHeaders(req), "Content-Type": "application/json" },
        })
    )
);

/* =====================================================
    11. E-INVOICE → EWB FROM IRN
    ===================================================== */

// Generate EWB from IRN
app.put("/proxy/irn/generateEwbByIrn", (req, res) =>
    proxy(res, () =>
        axios.put(
            `${BASE_URL}/irisgst/onyx/irn/generateEwbByIrn`,
            req.body,
            { headers: { ...authHeaders(req), "Content-Type": "application/json" } }
        )
    )
);

// GET E-WAY BILL BY IRN (GetEWBForm)
app.get('/proxy/irn/getEwbByIrn', async (req, res) => {
    console.log('Query params:', req.query); // DEBUG

    const { irn, userGstin, updateFlag } = req.query; // <-- MUST BE req.query for GET

    if (!irn || !userGstin) {
        return res.status(400).json({ error: 'Missing irn or userGstin in query' });
    }

    const targetUrl = `https://stage-api.irisgst.com/irisgst/onyx/irn/getEwbByIrn?` +
        `irn=${encodeURIComponent(irn)}&userGstin=${encodeURIComponent(userGstin)}&updateFlag=${updateFlag || 'true'}`;

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'Accept': 'application/json',
                'X-Auth-Token': req.headers['x-auth-token'] || '',
                'companyId': req.headers['companyid'] || '24',
                'product': req.headers['product'] || 'ONYX',
                'userGstin': req.headers['usergstin'] || userGstin, // Fallback to query
                'irn': req.headers['irn'] || irn,
                'updateFlag': req.headers['updateflag'] || updateFlag,
            },
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response ? error.response.status : 500).json(
            error.response ? error.response.data : { error: 'Proxy error' }
        );
    }
});

// CANCEL E-WAY BILL (CancelEWB)
app.put('/proxy/irn/cancelEwb', async (req, res) => {
    try {
        const { ewbNo, cnlRsn, cnlRem, userGstin } = req.body;

        if (!ewbNo || !cnlRsn || !userGstin || !cnlRem) {
            return res.status(400).json({
                status: 'FAILURE',
                message: 'Missing required fields: ewbNo, cnlRsn, userGstin, cnlRem'
            });
        }

        const irisResponse = await axios.put(
            'https://stage-api.irisgst.com/irisgst/onyx/irn/cancelEwb',
            {
                ewbNo,
                cnlRsn,
                cnlRem,
                userGstin
            },
            {
                headers: {
                    /* EXACT HEADER CONTRACT */
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    companyId: req.headers.companyid,        // ← forwarded
                    'X-Auth-Token': req.headers['x-auth-token'], // ← forwarded
                    product: 'ONYX'
                }
            }
        );

        return res.json(irisResponse.data);
    } catch (err) {
        return res.status(err.response?.status || 500).json(
            err.response?.data || {
                status: 'FAILURE',
                message: 'IRIS Cancel EWB failed'
            }
        );
    }
});

/* =====================================================
    12. E-INVOICE → PRINT
    ===================================================== */

// Print E-Invoice (PDF)
app.get("/proxy/einvoice/print", async (req, res) => {
    try {
        const response = await axios.get(
            `${BASE_URL}/irisgst/onyx/einvoice/print`,
            {
                params: req.query,
                headers: { ...authHeaders(req), Accept: "application/pdf" },
                responseType: "arraybuffer",
            }
        );

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=einvoice_${req.query.id}.pdf`,
        });
        res.send(response.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data);
    }
});

/* =====================================================
    13. E-INVOICE → UPLOAD
    ===================================================== */
// Upload Invoices
app.post("/proxy/onyx/upload/invoices", upload.single("file"), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append("file", req.file.buffer, req.file.originalname);

        const companyUniqueCode = req.query.companyUniqueCode;
        if (!companyUniqueCode) return res.status(400).json({ error: "companyUniqueCode is required" });

        const response = await axios.post(
            `${BASE_URL}/irisgst/onyx/upload/invoices?companyUniqueCode=${companyUniqueCode}`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    "X-Auth-Token": req.headers["x-auth-token"] || "",
                    companyId: req.headers["companyid"] || "24",
                    product: req.headers.product || "ONYX",
                    Accept: "application/json",
                },
                maxBodyLength: Infinity,
                timeout: 60000,
            }
        );

        res.json(response.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
    }
});

// E-INVOICE → UPLOAD (Updated)
// ===============================
/* =====================================================
    E-INVOICE → UPLOAD STATUS
    ===================================================== */
app.get('/proxy/onyx/upload/status', async (req, res) => {

    // 1. Extract the uploadId from the local URL query parameters
    const uploadId = req.query.uploadId;

    if (!uploadId) {
        return res.status(400).json({
            status: "FAILURE",
            message: "Missing Required Parameter",
            response: ["uploadId is mandatory in query parameters."]
        });
    }

    // 2. Construct the target external API URL with the query parameter
    const EXTERNAL_BASE_URL = 'https://stage-api.irisgst.com/irisgst/onyx/upload/status';
    const targetUrl = `${EXTERNAL_BASE_URL}?uploadId=${uploadId}`;

    // 3. Extract necessary headers from the incoming request
    const headers = {
        'X-Auth-Token': req.headers['x-auth-token'],
        'companyId': req.headers['companyid'],
        'accept': req.headers['accept'] || 'application/json',
        'product': req.headers['product'],
        // NOTE: GET requests typically don't need Content-Type: application/json
    };

    try {
        // 4. Forward the GET request to the external API using axios
        const apiResponse = await axios.get(targetUrl, { headers });

        // 5. Send the external API's response back to the client
        res.status(apiResponse.status).json(apiResponse.data);

    } catch (error) {
        // Handle errors from the external API call
        console.error('External API Error:', error.response ? error.response.data : error.message);

        const status = error.response ? error.response.status : 500;
        const data = error.response ? error.response.data : {
            status: "FAILURE",
            message: "Proxy or Network Error",
            error: error.message
        };

        res.status(status).json(data);
    }
});


/* =====================================================
    14. E-INVOICE → VIEW / DOWNLOADS
    ===================================================== */

// E-Invoice Download
app.post("/proxy/onyx/download/einvoices", (req, res) =>
    proxy(res, () =>
        axios.post(`${BASE_URL}/irisgst/onyx/download/einvoices`, req.body, {
            headers: { ...authHeaders(req), "Content-Type": "application/json" },
            timeout: 120000,
        })
    )
);

// Download Status
app.get("/proxy/onyx/download/status", (req, res) =>
    proxy(res, () =>
        axios.get(`${BASE_URL}/irisgst/onyx/download/status`, {
            params: req.query,
            headers: authHeaders(req),
        })
    )
);

// E-Invoice View Proxy
app.post("/proxy/einvoice/view", async (req, res) => {
    try {
        const BASE_URL = "https://stage-api.irisgst.com";

        const response = await fetch(`${BASE_URL}/irisgst/onyx/einvoice/view`, {
            method: "POST",
            headers: {
                accept: req.headers.accept || "application/json",
                companyId: req.headers.companyid || "24",
                "X-Auth-Token": req.headers["x-auth-token"] || "",
                product: req.headers.product || "ONYX",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req.body),
        });

        const text = await response.text();

        if (text.startsWith("<!DOCTYPE")) {
            return res.status(500).json({ error: "Received HTML instead of JSON", body: text });
        }

        const data = JSON.parse(text);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get("/proxy/onyx/einvoice/details", async (req, res) => {
    try {
        const { einvId } = req.query;

        if (!einvId) {
            return res.status(400).json({ error: "einvId is required" });
        }

        const response = await axios.get(
            "https://stage-api.irisgst.com/irisgst/onyx/einvoice/details",
            {
                params: { einvId }, // → ?einvId=728761
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                    companyId: req.headers.companyid,        // 24
                    "x-auth-token": req.headers["x-auth-token"],
                    product: "ONYX",
                },
            }
        );

        res.json(response.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(
            err.response?.data || { error: "Failed to fetch e-invoice details" }
        );
    }
});

/* =====================================================
    SERVER START
    ===================================================== */
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
});