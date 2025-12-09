// EwaybillPrint.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

/* ---------------------------
   LocalStorage keys
--------------------------- */
const LOGIN_KEY = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

/* ---------------------------
   Safe JSON parse
--------------------------- */
const safeParse = (v, fallback = null) => {
  try {
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
};

/* ---------------------------
   Build headers safely
--------------------------- */
const buildHeadersFromLogin = (login) => {
  // login may contain different key shapes; handle all common variants
  const token =
    login?.token ||
    login?.fullResponse?.response?.token ||
    login?.fullResponse?.token ||
    "";

  // company id sometimes camelCase or lowercase
  const companyId =
    login?.companyId ||
    login?.companyid ||
    login?.fullResponse?.response?.companyId ||
    login?.fullResponse?.response?.companyid ||
    "";

  return {
    "X-Auth-Token": token,
    companyId: typeof companyId === "number" ? String(companyId) : companyId || "",
    product: "TOPAZ",
    "Content-Type": "application/json",
    Accept: "*/*", // use */* to avoid backend 406 for PDF endpoints
  };
};

/* ---------------------------
   Component
--------------------------- */
const EwaybillPrint = () => {
  const [ewbNos, setEwbNos] = useState([]); // array of ewb numbers
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfMessage, setPdfMessage] = useState("");
  const [headersPreview, setHeadersPreview] = useState({});
  const [payloadPreview, setPayloadPreview] = useState({});
  const [loginRaw, setLoginRaw] = useState({});

  // populate login & latest EWB on mount
  useEffect(() => {
    const login = safeParse(localStorage.getItem(LOGIN_KEY), {}) || {};
    setLoginRaw(login);
    const headers = buildHeadersFromLogin(login);
    setHeadersPreview(headers);

    // Try pulling ewb number from latest stored EWB data
    const latest = safeParse(localStorage.getItem(LATEST_EWB_KEY), {}) || {};
    const maybeEwb =
      latest?.response?.ewbNo || latest?.ewbNo || latest?.response?.ewb_number || null;

    if (maybeEwb) setEwbNos([String(maybeEwb)]);
    // initial payload preview
    setPayloadPreview({ ewbNo: maybeEwb ? [String(maybeEwb)] : [] });
  }, []);

  // keep payloadPreview in sync with ewbNos
  useEffect(() => {
    setPayloadPreview({ ewbNo: ewbNos.filter(Boolean) });
  }, [ewbNos]);

  /* ---------------------------
     Download / Print Handler
  --------------------------- */
  const handlePrint = async (e) => {
    e?.preventDefault();
    setPdfError("");
    setPdfMessage("");

    // Basic validations
    if (!ewbNos.length || !ewbNos[0]) {
      setPdfError("No EWB number provided. Enter or select a valid EWB number to print.");
      return;
    }

    // Build headers each time (in case login changed)
    const login = safeParse(localStorage.getItem(LOGIN_KEY), {}) || loginRaw || {};
    const headers = buildHeadersFromLogin(login);

    // Debugging: show what we're sending
    console.log("EWB Print - Using headers:", headers);
    console.log("EWB Print - Payload:", { ewbNo: ewbNos });

    // Quick header validation
    if (!headers["X-Auth-Token"] || !headers.companyId) {
      setPdfError("Missing authentication headers (token/companyId). Please login again.");
      return;
    }

    setPdfLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:3001/proxy/topaz/ewb/printDetails",
        { ewbNo: ewbNos },
        {
          headers,
          responseType: "blob", // important for PDF
        }
      );

      // create file download
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      // Use the first EWB number in the filename for clarity
      const fileName = `EWB-${ewbNos[0] || "details"}.pdf`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setPdfMessage(`PDF downloaded: ${fileName}`);

      // Optionally, update latest EWB preview / history if response returned JSON in headers
      // (most print endpoints return PDF blob only; this is just a safe attempt)
      try {
        // If backend returns content-disposition or other metadata in headers you could parse it here.
      } catch (innerErr) {
        // ignore
      }
    } catch (err) {
      console.error("EWB Print Error:", err);
      // If the proxy returned JSON with error inside blob or response, try to parse message
      if (err.response) {
        // axios returns err.response when HTTP status is non-2xx
        const status = err.response.status;
        // If response is blob but contains JSON error, try to read it
        if (err.response.data && err.response.data instanceof Blob) {
          try {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const text = reader.result;
                const json = JSON.parse(text);
                setPdfError(json?.message || json?.error || `Print failed (status ${status})`);
              } catch (_) {
                setPdfError(`Print failed (HTTP ${status}).`);
              }
            };
            reader.readAsText(err.response.data);
          } catch (_) {
            setPdfError(`Print failed (HTTP ${status}).`);
          }
        } else {
          setPdfError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              `Print failed (HTTP ${status}).`
          );
        }

        // If 401, suggest re-login
        if (status === 401) {
          setPdfError((prev) => prev + " Unauthorized. Please login again.");
        }
      } else {
        setPdfError(err.message || "Print failed due to network error.");
      }
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "28px auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: 8 }}>Print E-Way Bill (EWB)</h2>
      <form onSubmit={handlePrint} style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>EWB Number(s)</label>
        <input
          placeholder="Enter EWB numbers comma-separated (e.g. 371010573379)"
          value={ewbNos.join(",")}
          onChange={(e) => setEwbNos(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            marginBottom: 10,
            fontSize: 14,
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            disabled={pdfLoading}
            style={{
              padding: "10px 18px",
              borderRadius: 6,
              border: "none",
              background: pdfLoading ? "#9aa7b1" : "#0b66c3",
              color: "white",
              cursor: pdfLoading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {pdfLoading ? "Printing..." : "Print / Download PDF"}
          </button>

          <button
            type="button"
            onClick={() => {
              // quick helper: refill from latest stored EWB
              const latest = safeParse(localStorage.getItem(LATEST_EWB_KEY), {}) || {};
              const maybe = latest?.response?.ewbNo || latest?.ewbNo;
              if (maybe) {
                setEwbNos([String(maybe)]);
                setPayloadPreview({ ewbNo: [String(maybe)] });
              }
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Load latest EWB
          </button>
        </div>
      </form>

      {pdfMessage && <div style={{ color: "#0a6b2e", marginBottom: 8 }}>{pdfMessage}</div>}
      {pdfError && <div style={{ color: "#a22", marginBottom: 8 }}>{pdfError}</div>}

      <div style={{ marginTop: 10, color: "#666", fontSize: 13 }}>
        Tip: Make sure you're logged in and `iris_ewaybill_shared_config` in localStorage contains a valid
        token & companyId. If you get 401, re-login to refresh credentials.
      </div>
    </div>
  );
};

export default EwaybillPrint;
