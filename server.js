// ===============================
// server.js (CLEAN FINAL VERSION)
// ===============================

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const FormData = require("form-data");

const app = express();
const PORT = 3001;
const BASE_URL = "https://stage-api.irisgst.com";

// ===============================
// Middleware
// ===============================
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

/* =====================================================
   1. AUTH
   ===================================================== */

// E-Way Bill Login
app.post("/proxy/ewaybill/login", (req, res) => {
  console.log("Proxying E-Way Bill Login request...");
  proxy(res, () =>
    axios.post(`${BASE_URL}/irisgst/mgmt/login`, req.body, {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
    })
  );
});

// E-Invoice Login
app.post("/proxy/einvoice/login", (req, res) =>
  proxy(res, () =>
    axios.post(`${BASE_URL}/irisgst/mgmt/login`, req.body, {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
    })
  )
);

// Change Password
app.post("/proxy/change-password", (req, res) =>
  proxy(res, () =>
    axios.post(
      `${BASE_URL}/irisgst/mgmt/public/user/changepassword`,
      req.body,
      { headers: { "Content-Type": "application/json" } }
    )
  )
);

/* =====================================================
   2. E-INVOICE (ONYX)
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

// Verify Signed QR
app.post("/proxy/einvoice/verifySignature", (req, res) =>
  proxy(res, () =>
    axios.post(
      `${BASE_URL}/irisgst/onyx/einvoice/verifySignature`,
      { jwt: req.body.jwt },
      { headers: { ...authHeaders(req), "Content-Type": "application/json" } }
    )
  )
);

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
   3. E-WAY BILL (TOPAZ)
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

// Common PDF printer for EWB
const printEWB = async (endpoint, req, res, filename) => {
  try {
    const response = await axios.post(
      `${BASE_URL}${endpoint}`,
      req.body,
      {
        headers: {
          ...authHeaders(req),
          product: "TOPAZ",
          Accept: "application/pdf",
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${filename}`,
    });
    res.send(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data);
  }
};

// 6. GET E-WAY BILL BY IRN (GetEWBForm)
app.get('/proxy/irn/getEwbByIrn', async (req, res) => {
  console.log('Query params:', req.query); // DEBUG

  const { irn, userGstin, updateFlag } = req.query; // <-- MUST BE req.query for GET

  if (!irn || !userGstin) {
    return res.status(400).json({ error: 'Missing irn or userGstin in query' });
  }

  const targetUrl = `https://stage-api.irisgst.com/irisgst/onyx/irn/getEwbByIrn?` +
    `irn=${encodeURIComponent(irn)}&userGstin=${encodeURIComponent(userGstin)}&updateFlag=${updateFlag || 'true'}`;

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
});

// 10. CANCEL E-WAY BILL (CancelEWB)
app.put('/proxy/irn/cancelEwb', async (req, res) => {
  try {
    const { ewbNo, cnlRsn, cnlRem, userGstin } = req.body;

    if (!ewbNo || !cnlRsn || !userGstin || cnlRem) {
      return res.status(400).json({
        error: 'Missing required fields: ewbNo, cnlRsn, userGstin'
      });
    }

    const response = await axios.put(
      `${BASE_URL}/irisgst/onyx/irn/cancelEwb`,
      req.body,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...authHeaders(req),
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response ? error.response.status : 500).json(
      error.response ? error.response.data : { error: 'Failed to cancel E-Way Bill' }
    );
  }
});


app.post("/proxy/topaz/ewb/printDetails", (req, res) =>
  printEWB("/irisgst/topaz/ewb/print/details", req, res, "ewb-details.pdf")
);

app.post("/proxy/topaz/ewb/printSummary", (req, res) =>
  printEWB("/irisgst/topaz/ewb/print/summary", req, res, "ewb-summary.pdf")
);

/* =====================================================
   4. DOWNLOADS
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

/* =====================================================
   5. UPLOAD (CSV / ZIP)
   ===================================================== */

app.post(
  "/proxy/onyx/upload/invoices",
  upload.single("file"),
  async (req, res) => {
    try {
      const formData = new FormData();
      formData.append("file", req.file.buffer, req.file.originalname);

      const response = await axios.post(
        `${BASE_URL}/irisgst/onyx/upload/invoices`,
        formData,
        {
          headers: { ...formData.getHeaders(), ...authHeaders(req) },
          params: req.query,
        }
      );

      res.json(response.data);
    } catch (err) {
      res.status(err.response?.status || 500).json(err.response?.data);
    }
  }
);

/* =====================================================
   6. MULTI-VEHICLE (TOPAZ)
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
   START SERVER
   ===================================================== */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
});
