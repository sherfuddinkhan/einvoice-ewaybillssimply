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

app.post("/proxy/topaz/ewb/printDetails", (req, res) => printEWB("/irisgst/topaz/ewb/print/details", req, res, "ewb-details.pdf"));
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

// -------------------------------
// GET EWB BY DATE - PROXY ROUTE
// -------------------------------
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
        companyId: req.headers.companyid,       // from frontend
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

/* ======================================================================
   6. EWB BY DOC NUM & TYPE
   ====================================================================== */
// -------------------------------
// POST /proxy/topaz/ewb/docNum
// -------------------------------
app.post("/proxy/topaz/ewb/docNum", async (req, res) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/irisgst/topaz/api/v0.3/getewb/docNum`,
      req.body, // payload body
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          companyId: req.headers["companyid"],   // forward companyId header
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


// -------------------------------
// GET /proxy/topaz/ewb/bulkStatus
// -------------------------------
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
