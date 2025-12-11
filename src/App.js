import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./components/AuthContext";
// AuthProvider is usually imported in index.js to wrap the entire app
// import { AuthProvider } from "./components/AuthContext"; 
import RequireAuth from "./components/RequireAuth";


/* ─────────── LOGIN ─────────── */
import EWayBillLoginPage from "./loginAuthentication/EWayBillLoginPage";
import EInvoiceLoginPage from "./loginAuthentication/EInvoiceLoginPage";

/* ─────────── LAYOUT ─────────── */
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";

/* ─────────── E-INVOICE CORE ─────────── */
import GenerateAndPrintEinvoice from "./E-invoice/E-invoice&IRN/GenerateAndPrintEinvoice";
import CancelIRN from "./E-invoice/E-invoice&IRN/CancelIRN";
import GetInvByIrn from "./E-invoice/E-invoice&IRN/GetInvByIrn";
import GetIrnByDocDetailsForm from "./E-invoice/E-invoice&IRN/GetIrnByDocDetails";

/* ─────────── E-WAY BILL FROM IRN ─────────── */
import GenerateEwbByIrn from "./E-invoice/E-waybill/GenerateEwbByIrn";
import CancelEwb from "./E-invoice/E-waybill/CancelEwb";
import GetEwbByIrn from "./E-invoice/E-waybill/GetEwbByIrn";

/* ─────────── PRINT / UPLOAD / VIEW (E-INVOICE) ─────────── */
import PrintEInvoice from "./E-invoice/print/PrintEInvoice";
import UploadInvoice from "./E-invoice/Upload invoice/UploadInvoice";
import UploadStatus from "./E-invoice/Upload invoice/UploadStatus";
import InvoiceDetails from "./E-invoice/Viewinvoice/InvoiceDetails";
import ListEInvoices from "./E-invoice/Viewinvoice/ListEInvoices";

import EwbGenerateAndPrint from "./E-waybill/Ewaybill Core/EwbGenerateAndPrint";

import
const App = () => {
  // Removed unused state variables: allowEwayLogin, allowEinvoiceLogin
  
  // 1. CALL ALL HOOKS AT THE TOP LEVEL (Fixed React Hooks Error)
  const { isAuthReady, isLoggedIn, product } = useAuth(); 

  // 2. Perform conditional rendering based on the hook values
  if (!isAuthReady) {
    // Blocks rendering until AuthContext confirms session status, fixing redirect inconsistency.
    return <div>Loading authentication state...</div>; 
  }

  return (
    <Router>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />

        <div style={{ flex: 1, padding: 20, background: "#F5F5F7" }}>
          <Routes>

            {/* ───────── Dashboard ───────── */}
            <Route
              path="/"
              element={<Dashboard />} 
            />

            {/* ───────── Login (Always Unprotected, but redirects if logged in) ───────── */}
            <Route 
              path="/ewaybill-login" 
              element={
                isLoggedIn && product === "EWAY" ? 
                (<Navigate to="/ewb-generate-print" replace />) : 
                (<EWayBillLoginPage />)
              }
            />
            <Route 
              path="/einvoice-login" 
              element={
                isLoggedIn && product === "EINVOICE" ? 
                (<Navigate to="/einvoice-generate-print" replace />) : 
                (<EInvoiceLoginPage/>)
              }
            />

            {/* ───────── EWB CORE (Fully Protected) ───────── */}
            {/**************************************************************************************
             * 🛑 FIX: ALL EWB routes are now wrapped with RequireAuth to ensure security. 
             * This prevents logged-in E-INVOICE users (or logged-out users) from seeing EWB content.
             **************************************************************************************/}
            <Route path="/ewb-generate-print" element={<RequireAuth product="EWAY"><EwbGenerateAndPrint/></RequireAuth>}/>
            <Route path="/ewb-print" element={<RequireAuth product="EWAY"><EwaybillPrint /></RequireAuth>} />
            <Route path="/ewb-print-summary" element={<RequireAuth product="EWAY"><EwaybillPrintSummary /></RequireAuth>} />

            {/* ───────── EWB ACTIONS ───────── */}
            <Route path="/ewaybill-actions" element={<RequireAuth product="EWAY"><EwaybillActions /></RequireAuth>} />
            <Route path="/update-transporter-id" element={<RequireAuth product="EWAY"><UpdateTransporterId /></RequireAuth>} />

            {/* ───────── FETCH EWB ───────── */}
            <Route path="/consignee-ewaybill" element={<RequireAuth product="EWAY"><ConsigneeEwaybill /></RequireAuth>} />
            <Route path="/fetch-ewb-by-date" element={<RequireAuth product="EWAY"><FetchEwbByDate /></RequireAuth>} />
            <Route path="/transporter-ewaybill" element={<RequireAuth product="EWAY"><TransporterEwaybill /></RequireAuth>} />

            {/* ───────── EWB BY DOC ───────── */}
            <Route path="/ewaybill-by-doc-type" element={<RequireAuth product="EWAY"><EwaybillByDocType /></RequireAuth>} />
            <Route path="/generated-ewb-by-date" element={<RequireAuth product="EWAY"><GeneratedEwbByDate /></RequireAuth>} />
            <Route path="/get-ewb-by-doc-no" element={<RequireAuth product="EWAY"><GetEwbByDocNo /></RequireAuth>} />
            <Route path="/get-ewb-doc-download" element={<RequireAuth product="EWAY"><GetEwbDocDownload /></RequireAuth>} />
            <Route path="/get-ewb-doc-status" element={<RequireAuth product="EWAY"><GetEwbDocStatus /></RequireAuth>} />

            {/* ───────── MULTI VEHICLE ───────── */}
            <Route path="/multi-vehicle-initiate" element={<RequireAuth product="EWAY"><MultiVehicleInitiate /></RequireAuth>} />
            <Route path="/multi-vehicle-add" element={<RequireAuth product="EWAY"><MultiVehicleAdd /></RequireAuth>} />
            <Route path="/multi-vehicle-edit" element={<RequireAuth product="EWAY"><MultiVehicleEdit /></RequireAuth>} />
            <Route path="/multi-vehicle-group-details" element={<RequireAuth product="EWAY"><MultiVehicleGroupDetails /></RequireAuth>} />
            <Route path="/multi-vehicle-requests" element={<RequireAuth product="EWAY"><MultiVehicleRequests /></RequireAuth>} />


            {/* ───────── E-INVOICE CORE (Fully Protected) ───────── */}
            {/**************************************************************************************
             * 🛑 FIX: ALL EINVOICE routes are now wrapped with RequireAuth to ensure security. 
             **************************************************************************************/}
            <Route
              path="/einvoice-generate-print"
              element={<RequireAuth product="EINVOICE"><GenerateAndPrintEinvoice /></RequireAuth>}
            />
            <Route path="/einvoice-cancel-irn" element={<RequireAuth product="EINVOICE"><CancelIRN /></RequireAuth>} />
            <Route path="/einvoice-get-by-irn" element={<RequireAuth product="EINVOICE"><GetInvByIrn /></RequireAuth>} />
            <Route path="/einvoice-get-by-doc" element={<RequireAuth product="EINVOICE"><GetIrnByDocDetailsForm /></RequireAuth>} />

            {/* ───────── EWB FROM IRN ───────── */}
            <Route path="/generate-ewb-by-irn" element={<RequireAuth product="EINVOICE"><GenerateEwbByIrn /></RequireAuth>} />
            <Route path="/cancel-ewb-by-irn" element={<RequireAuth product="EINVOICE"><CancelEwb /></RequireAuth>} />
            <Route path="/get-ewb-by-irn" element={<RequireAuth product="EINVOICE"><GetEwbByIrn /></RequireAuth>} />

            {/* ───────── PRINT / UPLOAD / VIEW ───────── */}
            <Route path="/print-e-invoice-irn" element={<RequireAuth product="EINVOICE"><PrintEInvoice /></RequireAuth>} />
            <Route path="/upload-invoices" element={<RequireAuth product="EINVOICE"><UploadInvoice /></RequireAuth>} />
            <Route path="/uploaded-file-status" element={<RequireAuth product="EINVOICE"><UploadStatus /></RequireAuth>} />
            <Route path="/single-invoice-details" element={<RequireAuth product="EINVOICE"><InvoiceDetails /></RequireAuth>} />
            <Route path="/list-of-invoices" element={<RequireAuth product="EINVOICE"><ListEInvoices /></RequireAuth>} />

            {/* ───────── 404 ───────── */}
            <Route path="*" element={<h2>404 | Page Not Found</h2>} />

          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;