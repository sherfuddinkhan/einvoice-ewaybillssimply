import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

/* ---------------------------
    Storage keys & utils
--------------------------- */
const EWAY_KEY = "iris_eway_session";
const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

const safeParse = (v, fallback = {}) => {
  try {
    return JSON.parse(v ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
};

const GenerateandprintproformoEwaybill = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState("");
  
  // PDF Download States
  const [pdfMessage, setPdfMessage] = useState("");
  const [manualInvoiceId, setManualInvoiceId] = useState("");
  const [lastGeneratedId, setLastGeneratedId] = useState("");

  // Target Storage Hooks switched securely to modern sessionStorage context
  const [authCredentials, setAuthCredentials] = useState({
    token: "YOUR_AUTH_TOKEN",
    companyId: "YOUR_COMPANY_ID"
  });

  const productHeader = "TOPAZ";

  // =========================
  // RECEIVED DATA BOUNDARIES
  // =========================
  const receivedData = location.state || {};
  const invoiceData = receivedData.invoiceData || {};
  const dynamicId = receivedData.id || invoiceData.pid;

  const DEFAULT_FORM = {
    supplyType: "O",
    subSupplyType: "1",
    docType: "INV",
    docNo: "Topaz3402900",
    invType: "B2B",
    docDate: new Date().toLocaleDateString("en-GB"), 
    transactionType: 4,
    referencInum: null,
    referenceIdt: null,

    fromGstin: "01AAACI9260R002",
    fromTrdName: "SWASTIK MACHINERY CORPORATION",
    dispatchFromGstin: "URP",
    dispatchFromTradeName: "PQR",
    fromAddr1: "#11-171/5, Fathenagar,",
    fromAddr2: "",
    fromPlace: "Hyderabad",
    fromPincode: 192233,
    fromStateCode: 36,

    toGstin: "02AAACI9260R002",
    toTrdName: "PROFORMA SOFTWARE",
    shipToGstin: "URP",
    shipToTradeName: "ABC",
    toAddr1: "3rd Floor",
    toAddr2: "",
    toPlace: "KARNATAKA",
    toPincode: 174001,
    toStateCode: 29,

    totInvValue: 3540,
    totalValue: 3000,
    cgstValue: 0,
    sgstValue: 0,
    igstValue: 540,
    cessValue: 0,
    cessNonAdvolValue: 0,
    otherValue: 0,

    transMode: 1,
    transDistance: 420,
    transDocDate: new Date().toLocaleDateString("en-GB"),
    transDocNo: "1212",
    transporterId: "05AAAAT2562R1Z3",
    transporterName: "ACVDF",
    vehicleNo: "AP28BN4797",
    vehicleType: "R",

    actFromStateCode: 36,
    actToStateCode: 29,

    itemList: [
      {
        productName: "Sample Item",
        productDesc: "Description",
        hsnCode: "730411",
        quantity: 10,
        qtyUnit: "NOS",
        taxableAmount: 100,
        sgstRate: 0,
        cgstRate: 0,
        igstRate: 18,
        cessRate: 0,
        cessNonAdvol: 0,
        txp: "T"
      }
    ],
    companyId: null,
    userGstin: "05AAAAU1183B5ZW",
    forceDuplicateCheck: true
  };

  const [formData, setFormData] = useState(DEFAULT_FORM);

  // ===================================
  // RESTORE CREDENTIALS FROM SESSIONSTORAGE
  // ===================================
  useEffect(() => {
    const sessionData = safeParse(sessionStorage.getItem(EWAY_KEY));
    
    const parsedToken = sessionData.token || "YOUR_AUTH_TOKEN";
    const parsedCompanyId = sessionData.companyId || "4";
    const parsedGstin = sessionData.userGstin || "01AAACI9260R002";

    setAuthCredentials({
      token: parsedToken,
      companyId: String(parsedCompanyId)
    });

    // Mirror updates into default payload bindings instantly
    setFormData((prev) => ({
      ...prev,
      companyId: Number(parsedCompanyId) || prev.companyId,
      userGstin: parsedGstin || prev.userGstin
    }));
  }, []);

  // ===================================
  // FETCH & BIND FETCHED DATA CORRECTLY
  // ===================================
  useEffect(() => {
    if (!dynamicId) return;
    fetchInvoiceData();
  }, [dynamicId]);

  const fetchInvoiceData = async () => {
    try {
      setLoadingInvoice(true);
      const res = await axios.get(
        `https://einvoice.fcssoftwares.com/api/gst/ewaybill/generate/${dynamicId}`
      );
      
      const invoice = res.data?.data?.response || res.data?.data || res.data || {};
      const clientNode = invoice?.clients || invoice?.buyerClients || {};
      
      setFormData((prev) => {
        const targetStateCode = clientNode?.masterStateNames?.stateCode 
          ? Number(clientNode.masterStateNames.stateCode) 
          : prev.toStateCode;

        let calculatedTotalTaxable = 0;
        let calculatedTotalInvValue = 0;
        let calculatedTotalIgst = 0;

        const formattedItems = Array.isArray(invoice?.invoiceProductDetails)
          ? invoice.invoiceProductDetails.map((item) => {
              const qty = item?.quantity ? Number(item.quantity) : 0;
              const amt = item?.totalAmount ? Number(item.totalAmount) : 0;
              const gst = item?.gstPer ? Number(item.gstPer) : 18;
              const igstAmt = item?.igstAmount ? Number(item.igstAmount) : 0;
              const totalWithTax = item?.afterGSTAmount ? Number(item.afterGSTAmount) : 0;

              calculatedTotalTaxable += amt;
              calculatedTotalIgst += igstAmt;
              calculatedTotalInvValue += totalWithTax;

              return {
                productName: item?.description || "Line Item Data", 
                productDesc: item?.description || "Line Item Data",
                hsnCode: item?.hsncode || "998313",
                quantity: qty,
                qtyUnit: item?.uom || "NOS",
                taxableAmount: amt,
                sgstRate: item?.sgstPer ? Number(item.sgstPer) : 0,
                cgstRate: item?.cgstPer ? Number(item.cgstPer) : 0,
                igstRate: gst, 
                cessRate: 0,
                cessNonAdvol: 0,
                txp: "T"
              };
            })
          : prev.itemList;

        return {
          ...prev,
          vehicleNo: invoice?.vehicleNo || prev.vehicleNo,
          userGstin: invoice?.gstin || prev.userGstin,
          
          // From (Seller Side Bindings)
          fromGstin: invoice?.gstin || prev.fromGstin,
          fromTrdName: invoice?.company_Name || prev.fromTrdName,
          fromAddr1: invoice?.company_Address || prev.fromAddr1,
          fromPlace: invoice?.company_City || prev.fromPlace,
          fromPincode: invoice?.company_PINCode ? Number(invoice.company_PINCode) : prev.fromPincode,

          // To (Client Side Bindings)
          toGstin: clientNode?.gstin || prev.toGstin,
          toTrdName: clientNode?.companyName || prev.toTrdName,
          toAddr1: clientNode?.officeAddress || prev.toAddr1,
          toPlace: clientNode?.stateName || prev.toPlace,
          toPincode: clientNode?.poBox ? Number(clientNode.poBox) : prev.toPincode,
          toStateCode: targetStateCode,
          actToStateCode: targetStateCode,

          // Financial Summary Calculations
          totalValue: calculatedTotalTaxable || prev.totalValue,
          igstValue: calculatedTotalIgst || prev.igstValue,
          totInvValue: calculatedTotalInvValue || prev.totInvValue,

          itemList: formattedItems
        };
      });
    } catch (err) {
      setError("Failed to fetch dynamic invoice payload baseline: " + err.message);
    } finally {
      setLoadingInvoice(false);
    }
  };

  // =========================
  // FORM MUTATIONS HANDLERS
  // =========================
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const targetValue = type === "number" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: targetValue }));
  };

  const handleItemChange = (index, field, value, isNumber = false) => {
    const updatedItems = [...formData.itemList];
    updatedItems[index][field] = isNumber ? Number(value) : value;
    setFormData((prev) => ({ ...prev, itemList: updatedItems }));
  };

  // =========================
  // GENERATE E-WAY BILL DATA
  // =========================
  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setApiResponse(null);
    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:3001/proxy/topaz/ewb/generate",
        formData,
        { 
          headers: { 
            "Content-Type": "application/json",
            "X-Auth-Token": authCredentials.token,
            "companyId": authCredentials.companyId,
            "product": productHeader
          } 
        }
      );
      setApiResponse(res.data);
      
      if (res.data?.id || res.data?.response?.id) {
         setLastGeneratedId(res.data?.id || res.data?.response?.id);
         localStorage.setItem(LATEST_EWB_KEY, JSON.stringify(res.data));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===================================
  // DOWNLOAD INVOICE PDF API LOGIC
  // ===================================
  const downloadPDF = async () => {
    const finalInvoiceId =
      manualInvoiceId.trim() ||
      lastGeneratedId ||
      apiResponse?.response?.id ||
      apiResponse?.response?.Id ||
      apiResponse?.id ||
      dynamicId ||
      "1001";

    if (!authCredentials.token || !authCredentials.companyId) {
      setPdfMessage("❌ Error: Missing validation credentials inside sessionStorage context.");
      return;
    }

    try {
      setPdfMessage("Processing PDF download...");

      const url = `https://einvoice.fcssoftwares.com/api/gst/einvoice/print?id=${finalInvoiceId}&product=${productHeader}&companyId=${authCredentials.companyId}`;

      const resp = await axios.get(url, {
        headers: {
          "X-Auth-Token": authCredentials.token,
          "companyId": authCredentials.companyId,
          "product": productHeader,
        },
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(
        new Blob([resp.data], { type: "application/pdf" })
      );

      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `EInvoice_${finalInvoiceId}.pdf`);

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      // Log download to tracking history list
      const trackingHistory = safeParse(localStorage.getItem(EWB_HISTORY_KEY), []);
      if (!trackingHistory.includes(finalInvoiceId)) {
        localStorage.setItem(EWB_HISTORY_KEY, JSON.stringify([...trackingHistory, finalInvoiceId]));
      }

      setPdfMessage("✅ PDF downloaded successfully.");
    } catch (error) {
      console.error(error);
      setPdfMessage("❌ Failed to download PDF.");
    }
  };

  // Preview Headers Setup for UI component parsing inspection block
  const requestHeadersPreview = {
    "X-Auth-Token": authCredentials.token,
    "companyId": authCredentials.companyId,
    "product": productHeader,
    "Content-Type": "application/json"
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }} className="no-print">
      <h2>Generate & Print Proforma E-Way Bill UI</h2>
      
      {loadingInvoice && <p style={{ color: "blue" }}>Synchronizing input data fields dynamically...</p>}
      {error && <div style={{ color: "red", padding: "10px", border: "1px solid red", marginBottom: "15px" }}>{error}</div>}

      {/* Configuration Header Diagnostics Panel */}
      <div style={{ marginBottom: "20px", padding: "12px", background: "#f1f2f6", borderRadius: "6px" }}>
        <strong>Current Loaded Active Session Headers Preview:</strong>
        <pre style={{ margin: "5px 0", background: "#dfe4ea", padding: "10px", borderRadius: "4px", fontSize: "12px" }}>
          {JSON.stringify(requestHeadersPreview, null, 2)}
        </pre>
      </div>

      <form onSubmit={handleGenerate} style={{ background: "#f9f9f9", padding: "20px", borderRadius: "8px" }}>
        
        {/* Section 1: Core Transaction Headers */}
        <h3>1. Transaction & Document Metadata</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
          <label>Doc Number: <input type="text" name="docNo" value={formData.docNo} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Doc Date: <input type="text" name="docDate" value={formData.docDate} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Supply Type: <input type="text" name="supplyType" value={formData.supplyType} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Sub Supply Type: <input type="text" name="subSupplyType" value={formData.subSupplyType} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Doc Type: <input type="text" name="docType" value={formData.docType} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Invoice Type: <input type="text" name="invType" value={formData.invType} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Transaction Type: <input type="number" name="transactionType" value={formData.transactionType} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Company ID: <input type="number" name="companyId" value={formData.companyId} onChange={handleInputChange} style={inputStyle} /></label>
          <label>User GSTIN: <input type="text" name="userGstin" value={formData.userGstin} onChange={handleInputChange} style={inputStyle} /></label>
        </div>

        {/* Section 2: Consignor & Dispatch Origin */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "15px" }}>
          <div style={boxStyle}>
            <h4>FROM (Transactional Consignor)</h4>
            <label>GSTIN: <input type="text" name="fromGstin" value={formData.fromGstin} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Trade Name: <input type="text" name="fromTrdName" value={formData.fromTrdName} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Address 1: <input type="text" name="fromAddr1" value={formData.fromAddr1} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Address 2: <input type="text" name="fromAddr2" value={formData.fromAddr2} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Place: <input type="text" name="fromPlace" value={formData.fromPlace} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Pincode: <input type="number" name="fromPincode" value={formData.fromPincode} onChange={handleInputChange} style={inputStyle} /></label>
            <label>State Code: <input type="number" name="fromStateCode" value={formData.fromStateCode} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Act From State: <input type="number" name="actFromStateCode" value={formData.actFromStateCode} onChange={handleInputChange} style={inputStyle} /></label>
          </div>

          <div style={boxStyle}>
            <h4>DISPATCH FROM (Shipping Origin)</h4>
            <label>Dispatch GSTIN: <input type="text" name="dispatchFromGstin" value={formData.dispatchFromGstin} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Dispatch Trade Name: <input type="text" name="dispatchFromTradeName" value={formData.dispatchFromTradeName} onChange={handleInputChange} style={inputStyle} /></label>
          </div>
        </div>

        {/* Section 3: Consignee & Destination */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "15px" }}>
          <div style={boxStyle}>
            <h4>TO (Consignee)</h4>
            <label>GSTIN: <input type="text" name="toGstin" value={formData.toGstin} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Trade Name: <input type="text" name="toTrdName" value={formData.toTrdName} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Address 1: <input type="text" name="toAddr1" value={formData.toAddr1} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Address 2: <input type="text" name="toAddr2" value={formData.toAddr2} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Place: <input type="text" name="toPlace" value={formData.toPlace} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Pincode: <input type="number" name="toPincode" value={formData.toPincode} onChange={handleInputChange} style={inputStyle} /></label>
            <label>State Code: <input type="number" name="toStateCode" value={formData.toStateCode} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Act To State: <input type="number" name="actToStateCode" value={formData.actToStateCode} onChange={handleInputChange} style={inputStyle} /></label>
          </div>

          <div style={boxStyle}>
            <h4>SHIP TO (Delivery Destination)</h4>
            <label>Ship To GSTIN: <input type="text" name="shipToGstin" value={formData.shipToGstin} onChange={handleInputChange} style={inputStyle} /></label>
            <label>Ship To Trade Name: <input type="text" name="shipToTradeName" value={formData.shipToTradeName} onChange={handleInputChange} style={inputStyle} /></label>
          </div>
        </div>

        {/* Section 4: Value and Tax Sub-Calculations */}
        <h3>2. Financial Summary Valuation Blocks</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
          <label>Total Inv Value (totInvValue): <input type="number" name="totInvValue" value={formData.totInvValue} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Total Taxable (totalValue): <input type="number" name="totalValue" value={formData.totalValue} onChange={handleInputChange} style={inputStyle} /></label>
          <label>CGST Value: <input type="number" name="cgstValue" value={formData.cgstValue} onChange={handleInputChange} style={inputStyle} /></label>
          <label>SGST Value: <input type="number" name="sgstValue" value={formData.sgstValue} onChange={handleInputChange} style={inputStyle} /></label>
          <label>IGST Value: <input type="number" name="igstValue" value={formData.igstValue} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Cess Value: <input type="number" name="cessValue" value={formData.cessValue} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Cess Non Advol Value: <input type="number" name="cessNonAdvolValue" value={formData.cessNonAdvolValue} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Other Charges Value: <input type="number" name="otherValue" value={formData.otherValue} onChange={handleInputChange} style={inputStyle} /></label>
        </div>

        {/* Section 5: Item List Modification */}
        <h3>3. Item Line Specifications ({formData.itemList.length} items mapped)</h3>
        {formData.itemList.map((item, index) => (
          <div key={index} style={{ background: "#eee", padding: "15px", borderRadius: "4px", marginBottom: "15px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
              <label>Product Name: <input type="text" value={item.productName} onChange={(e) => handleItemChange(index, "productName", e.target.value)} style={inputStyle} /></label>
              <label>Description: <input type="text" value={item.productDesc} onChange={(e) => handleItemChange(index, "productDesc", e.target.value)} style={inputStyle} /></label>
              <label>HSN Code: <input type="text" value={item.hsnCode} onChange={(e) => handleItemChange(index, "hsnCode", e.target.value)} style={inputStyle} /></label>
              <label>Quantity: <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value, true)} style={inputStyle} /></label>
              <label>Qty Unit: <input type="text" value={item.qtyUnit} onChange={(e) => handleItemChange(index, "qtyUnit", e.target.value)} style={inputStyle} /></label>
              <label>Taxable Amt: <input type="number" value={item.taxableAmount} onChange={(e) => handleItemChange(index, "taxableAmount", e.target.value, true)} style={inputStyle} /></label>
              <label>SGST Rate (%): <input type="number" value={item.sgstRate} onChange={(e) => handleItemChange(index, "sgstRate", e.target.value, true)} style={inputStyle} /></label>
              <label>CGST Rate (%): <input type="number" value={item.cgstRate} onChange={(e) => handleItemChange(index, "cgstRate", e.target.value, true)} style={inputStyle} /></label>
              <label>IGST Rate (%): <input type="number" value={item.igstRate} onChange={(e) => handleItemChange(index, "igstRate", e.target.value, true)} style={inputStyle} /></label>
              <label>Cess Rate (%): <input type="number" value={item.cessRate} onChange={(e) => handleItemChange(index, "cessRate", e.target.value, true)} style={inputStyle} /></label>
              <label>Cess Non Advol: <input type="number" value={item.cessNonAdvol} onChange={(e) => handleItemChange(index, "cessNonAdvol", e.target.value, true)} style={inputStyle} /></label>
              <label>TXP Status: <input type="text" value={item.txp} onChange={(e) => handleItemChange(index, "txp", e.target.value)} style={inputStyle} /></label>
            </div>
          </div>
        ))}

        {/* Section 6: Logistics Routing */}
        <h3>4. Transport Logistics Configurations</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "15px", marginBottom: "20px" }}>
          <label>Trans Mode: <input type="number" name="transMode" value={formData.transMode} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Trans Distance (KM): <input type="number" name="transDistance" value={formData.transDistance} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Trans Doc No: <input type="text" name="transDocNo" value={formData.transDocNo} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Trans Doc Date: <input type="text" name="transDocDate" value={formData.transDocDate} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Transporter ID: <input type="text" name="transporterId" value={formData.transporterId} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Transporter Name: <input type="text" name="transporterName" value={formData.transporterName} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Vehicle Number: <input type="text" name="vehicleNo" value={formData.vehicleNo} onChange={handleInputChange} style={inputStyle} /></label>
          <label>Vehicle Type: <input type="text" name="vehicleType" value={formData.vehicleType} onChange={handleInputChange} style={inputStyle} /></label>
        </div>

        <button type="submit" disabled={loading} style={{ padding: "12px 24px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "16px" }}>
          {loading ? "Generating Payload Processing..." : "Generate E-Way Bill JSON Action"}
        </button>
      </form>

      {/* Document PDF Section */}
      <div style={{ marginTop: "25px", padding: "20px", border: "1px dashed #6c757d", borderRadius: "6px", background: "#f8f9fa" }}>
        <h3>5. Document Output Download Engine</h3>
        
        <div style={{ display: "flex", gap: "15px", alignItems: "flex-end", marginBottom: "10px" }}>
          <label style={{ fontSize: "14px" }}>
            Manual Invoice ID Override reference:
            <input 
              type="text" 
              placeholder="Defaults to API values cascade" 
              value={manualInvoiceId} 
              onChange={(e) => setManualInvoiceId(e.target.value)}
              style={{ display: "block", padding: "8px", marginTop: "5px", borderRadius: "4px", border: "1px solid #ccc", width: "250px" }} 
            />
          </label>
          
          <button 
            type="button" 
            onClick={downloadPDF} 
            style={{ padding: "10px 20px", background: "#6f42c1", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
          >
            Download Invoice PDF
          </button>
        </div>

        {pdfMessage && (
          <p style={{ fontWeight: "bold", color: pdfMessage.includes("✅") ? "green" : "#333", marginTop: "10px" }}>
            {pdfMessage}
          </p>
        )}
      </div>
    </div>
  );
};

const inputStyle = { width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" };
const boxStyle = { border: "1px solid #ddd", padding: "15px", borderRadius: "4px" };

export default GenerateandprintproformoEwaybill;