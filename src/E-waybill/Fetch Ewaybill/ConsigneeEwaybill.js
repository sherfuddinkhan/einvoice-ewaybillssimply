import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../components/AuthContext";

const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

const ConsigneeEwaybill = () => {
  const { token, companyId } = useAuth();

  const [payload, setPayload] = useState({
    fromPlace: "",
    fromState: "",
    vehicleNo: "",
    transMode: 1,
    transDocNo: "",
    transDocDate: "",
    tripSheetEwbBills: [],
    companyId: null,
    userGstin: "",
  });

  const [requestPreview, setRequestPreview] = useState(null);
  const [responsePreview, setResponsePreview] = useState(null);
      // Read latest values from localStorage
    const currentConnectionType =
      localStorage.getItem("connectionType") || "DEFAULT";

  const headers = {
    accept: "application/json",
    product: "TOPAZ",
    companyId,
    "X-Auth-Token": token,
    "Content-Type": "application/json",
    ConnectionType: currentConnectionType,
  };

  const resetPreviews = () => {
    setRequestPreview(null);
    setResponsePreview(null);
  };

  useEffect(() => {
    const lastEwb = JSON.parse(
      localStorage.getItem(LATEST_EWB_KEY) || "{}"
    );

    const history = JSON.parse(
      localStorage.getItem(EWB_HISTORY_KEY) || "[]"
    );

    const latestHistory =
      Array.isArray(history) && history.length > 0
        ? history[0]
        : {};

    const lastResponse =
      lastEwb?.response || latestHistory?.response || {};

    setPayload({
      fromPlace: lastResponse?.fromPlace || "",
      fromState: lastResponse?.fromStateCode || "",
      vehicleNo: lastResponse?.vehicleNo || "",
      transMode: lastResponse?.transMode || 1,
      transDocNo: lastResponse?.transDocNo || "",
      transDocDate: lastResponse?.transDocDate || "",
      tripSheetEwbBills: lastResponse?.ewbNo
        ? [String(lastResponse.ewbNo)]
        : [],
      companyId:
        lastResponse?.companyId ||
        companyId ||
        null,
      userGstin:
        lastResponse?.fromGstin ||
        latestHistory?.userGstin ||
        "",
    });
  }, [companyId]);

  const handlePayloadChange = (key, value) => {
    resetPreviews();

    setPayload((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const generateCEWB = async () => {
    if (!token || !companyId) {
      alert("Token or Company ID not available");
      return;
    }

        // Read latest values from localStorage
    const currentConnectionType =
      localStorage.getItem("connectionType") || "DEFAULT";

    const requestBody = {
      ...payload,
      companyId,
    };

    const url =
      "https://einvoice.fcssoftwares.com/api/gst/ewaybill/cewb-generate";

    setRequestPreview({
      url,
      headers,
      body: requestBody,
    });

    try {
      const { data } = await axios.post(
        url,
        requestBody,
        { headers }
      );

      setResponsePreview(data);

      const latestEwbData = {
        response: data?.response || {},
        fromPlace: requestBody.fromPlace,
        fromStateCode: requestBody.fromState,
        vehicleNo: requestBody.vehicleNo,
        transMode: requestBody.transMode,
        transDocNo: requestBody.transDocNo,
        transDocDate: requestBody.transDocDate,
        tripSheetEwbBills:
          requestBody.tripSheetEwbBills,
        companyId,
        userGstin: requestBody.userGstin,
      };

      localStorage.setItem(
        LATEST_EWB_KEY,
        JSON.stringify(latestEwbData)
      );

      const history = JSON.parse(
        localStorage.getItem(EWB_HISTORY_KEY) || "[]"
      );

      history.unshift({
        time: new Date().toLocaleString(),
        ...latestEwbData,
      });

      localStorage.setItem(
        EWB_HISTORY_KEY,
        JSON.stringify(history.slice(0, 10))
      );
    } catch (err) {
      setResponsePreview(
        err.response?.data || {
          error: err.message,
        }
      );
    }
  };

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 900,
        margin: "auto",
        fontFamily: "Arial",
      }}
    >
      <h2>📄 Generate Consolidated E-Waybill</h2>

      <h3>🔹 Edit Payload</h3>

      {Object.keys(payload).map((key) => {
        if (key === "tripSheetEwbBills") {
          return (
            <div
              key={key}
              style={{ marginBottom: 10 }}
            >
              <label>
                {key} (comma separated):
              </label>

              <input
                type="text"
                value={payload[key].join(", ")}
                onChange={(e) =>
                  handlePayloadChange(
                    key,
                    e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean)
                  )
                }
                style={{
                  width: "100%",
                  padding: 8,
                }}
              />
            </div>
          );
        }

        return (
          <div
            key={key}
            style={{ marginBottom: 10 }}
          >
            <label>{key}:</label>

            <input
              type={
                key === "transMode" ||
                key === "fromState"
                  ? "number"
                  : "text"
              }
              value={
                payload[key] ?? ""
              }
              onChange={(e) =>
                handlePayloadChange(
                  key,
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: 8,
              }}
            />
          </div>
        );
      })}

      <button
        onClick={generateCEWB}
        style={{
          padding: "10px 20px",
          backgroundColor: "black",
          color: "white",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {responsePreview
          ? "Submitted ✔"
          : "Generate CEWB"}
      </button>

      <hr />

      <h3>📌 Request Preview</h3>
      <pre
        style={{
          background: "#f4f4f4",
          padding: 10,
          overflow: "auto",
        }}
      >
        {JSON.stringify(
          requestPreview,
          null,
          2
        )}
      </pre>

      <h3>📌 Response Preview</h3>
      <pre
        style={{
          background: "#e8ffe8",
          padding: 10,
          overflow: "auto",
        }}
      >
        {JSON.stringify(
          responsePreview,
          null,
          2
        )}
      </pre>
    </div>
  );
};

export default ConsigneeEwaybill;

