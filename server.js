const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3001;

// ----------------------
// Middleware
// ----------------------
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3002"],
    credentials: true,
  })
);

app.use(bodyParser.json());

// ----------------------
// Constants & Helpers
// ----------------------
const BASE_URL = "https://stage-api.irisgst.com";

const authHeaders = (req) => ({
  "X-Auth-Token":
    req.headers["x-auth-token"] ||
    req.headers["authorization"]?.replace("Bearer ", "") ||
    "",
  companyId: req.headers["companyid"] || req.headers["companyId"] || "",
  product: req.headers["product"] || "",
});

// Generic proxy wrapper
const proxyRequest = async (res, requestFn) => {
  try {
    const response = await requestFn();
    res.json(response.data);
  } catch (error) {
    console.error("Proxy Error:", error.response?.data || error.message);
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Proxy error" });
  }
};

/* ======================================================================
   1. LOGIN (E-INVOICE / TOPAZ)
   ====================================================================== */

app.post("/proxy/einvoice/login", (req, res) => {
  console.log("E-Invoice Login Payload:", req.body);
  proxyRequest(res, () =>
    axios.post(`${BASE_URL}/irisgst/mgmt/login`, req.body, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
  );
});

app.post("/proxy/ewaybill/login", (req, res) => {
  console.log("E-Way Bill Login Payload:", req.body);
  proxyRequest(res, () =>
    axios.post(`${BASE_URL}/irisgst/mgmt/login`, req.body, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
  );
});

/* ======================================================================
   2. IRN (E-INVOICE)
   ====================================================================== */

// Generate IRN
app.post("/proxy/irn/addInvoice", async (req, res) => {
  try {
    const headers = authHeaders(req);

    if (!headers["X-Auth-Token"] || !headers.companyId) {
      return res
        .status(400)
        .json({ error: "Missing required headers: X-Auth-Token or companyId" });
    }

    const response = await axios.post(
      `${BASE_URL}/irisgst/onyx/irn/addInvoice`,
      req.body,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...headers,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("IRN Generation Error:", error.response?.data || error.message);
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Failed to generate IRN" });
  }
});



/* ======================================================================
   3. E-WAY BILL (TOPAZ)
   ====================================================================== */

// Generate EWB
app.post("/proxy/topaz/ewb/generate", (req, res) => {
  proxyRequest(res, () =>
    axios.post(`${BASE_URL}/irisgst/topaz/api/v0.3/ewb`, req.body, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        product: "TOPAZ",
        ...authHeaders(req),
      },
    })
  );
});

/* ======================================================================
   4. PRINT E-INVOICE (PDF)
   ====================================================================== */

app.get("/proxy/einvoice/print", async (req, res) => {
  try {
    const { template = "STANDARD", id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Missing id parameter" });
    }

    const response = await axios.get(
      `${BASE_URL}/irisgst/onyx/einvoice/print`,
      {
        params: { template, id },
        headers: {
          Accept: "*/*",
          ...authHeaders(req),
        },
        responseType: "arraybuffer",
      }
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=einvoice_${id}.pdf`,
    });

    res.send(response.data);
  } catch (error) {
    console.error("E-Invoice Print Error", error.message);
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Print failed" });
  }
});

/* ======================================================================
   5. PRINT E-WAY BILL (PDF)
   ====================================================================== */

const printEWB = async (endpoint, req, res, filename) => {
  try {
    const response = await axios.post(`${BASE_URL}${endpoint}`, req.body, {
      headers: {
        Accept: "application/pdf",
        "Content-Type": "application/json",
        product: "TOPAZ",
        ...authHeaders(req),
      },
      responseType: "arraybuffer",
    });

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename=${filename}`);

    res.send(response.data);
  } catch (error) {
    console.error("EWB Print Error", error.message);
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Print failed" });
  }
};

// Print EWB Details
app.post("/proxy/topaz/ewb/printDetails", (req, res) =>
  printEWB("/irisgst/topaz/ewb/print/details", req, res, "ewb-details.pdf")
);

// Print EWB Summary
app.post("/proxy/topaz/ewb/printSummary", (req, res) =>
  printEWB("/irisgst/topaz/ewb/print/summary", req, res, "ewb-summary.pdf")
);

/* ======================================================================
   6. START SERVER
   ====================================================================== */

app.listen(PORT, () =>
  console.log(`🚀 Proxy server running at http://localhost:${PORT}`)
);
