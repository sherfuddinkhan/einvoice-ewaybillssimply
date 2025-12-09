// src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

/* ─────────── Login Pages ─────────── */
import EWayBillLoginPage from "./loginAuthentication/EWayBillLoginPage";
import EInvoiceLoginPage from "./loginAuthentication/EInvoiceLoginPage";

/* ─────────── Layout ─────────── */
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";

/* ─────────── E-INVOICE CORE ─────────── */
import GenerateAndPrintEinvoice from "./E-invoice/Einvoice Core/GenerateAndPrintEinvoice";
import CancelIRN from "./E-invoice/Einvoice Core/CancelIRN";
import GetInvByIrn from "./E-invoice/Einvoice Core/GetInvByIrn";
import GetIrnByDocDetails from "./E-invoice/Einvoice Core/GetIrnByDocDetails";

/* ─────────── printE-invoice ─────────── */
// 🌟 NEW IMPORT ADDED FOR E-invoice print.js 🌟
import EInvoicePrintByIRN from "./E-invoice/printE-invoice/E-invoice print"; 

/* ─────────── Upload Invoice ─────────── */
import UploadInvoices from "./E-invoice/Upload Invoice/uploadinvoices";
import UploadedFileStatus from "./E-invoice/Upload Invoice/uploadedfilestatus";

/* ─────────── View Invoice ─────────── */
import Detailsofsingleinvoice from "./E-invoice/View Invoice/Detailsofsingleinvoice";
import ListOfInvoices from "./E-invoice/View Invoice/listofinvoices";

/* ─────────── E-WAYBILL CORE ─────────── */
import EwbGenerateAndPrint from "./E-invoice/Ewaybill Core/EwbGenerateAndPrint";
import EwaybillPrint from "./E-invoice/Ewaybill Core/E-waybill print";
import EwbDetails from "./E-invoice/Ewaybill Core/EwbDetails";
import EwbDetailsbyEwbNo from "./E-invoice/Ewaybill Core/EwbDetailsbyEwbNo";

/* ─────────── EWAYBILL BY IRN ─────────── */
import GenerateEwbByIrn from "./E-invoice/EwaybillBYIRN/GenerateEwbByIrn";
import CancelEwb from "./E-invoice/EwaybillBYIRN/CancelEwb";

/* ─────────── Helpers ─────────── */
// The original EInvoicePrint helper is commented/removed as we now have the actual component.
// const EInvoicePrint = () => <h2>E-Invoice Print</h2>; 
const EwaybillPrintSummary = () => <h2>EWB Print Summary</h2>;

const ProtectedRoute = ({ isAllowed, children }) =>
  isAllowed ? children : <Navigate to="/" replace />;

const App = () => {
  const [allowEwayLogin, setAllowEwayLogin] = useState(false);
  const [allowEinvoiceLogin, setAllowEinvoiceLogin] = useState(false);

  return (
    <Router>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />

        <div style={{ flex: 1, padding: 20, background: "#F5F5F7" }}>
          <Routes>

            {/* ───────── Dashboard ───────── */}
            <Route
              path="/"
              element={
                <Dashboard
                  setAllowEwayLogin={setAllowEwayLogin}
                  setAllowEinvoiceLogin={setAllowEinvoiceLogin}
                />
              }
            />

            {/* ───────── Login ───────── */}
            <Route path="/ewaybill-login" element={<EWayBillLoginPage />} />
            <Route path="/einvoice-login" element={<EInvoiceLoginPage />} />

            {/* ───────── EWB Core ───────── */}
            <Route path="/ewb-generate-print" element={
              <ProtectedRoute isAllowed={allowEwayLogin}>
                <EwbGenerateAndPrint />
              </ProtectedRoute>
            } />
            <Route path="/ewb-print" element={<EwaybillPrint />} />
            <Route path="/ewb-print-summary" element={<EwaybillPrintSummary />} />

            {/* ───────── Fetch EWB ───────── */}
            <Route path="/ewb-details" element={<EwbDetails />} />
            <Route path="/ewb-details-by-no" element={<EwbDetailsbyEwbNo />} />

            {/* ───────── EWB by IRN ───────── */}
            <Route path="/ewb-by-irn-generate" element={
              <ProtectedRoute isAllowed={allowEwayLogin}>
                <GenerateEwbByIrn />
              </ProtectedRoute>
            } />
            <Route path="/ewb-by-irn-cancel" element={
              <ProtectedRoute isAllowed={allowEwayLogin}>
                <CancelEwb />
              </ProtectedRoute>
            } />

            {/* ───────── E-Invoice Core ───────── */}
            <Route path="/einvoice-generate" element={
              <ProtectedRoute isAllowed={allowEinvoiceLogin}>
                <GenerateAndPrintEinvoice />
              </ProtectedRoute>
            } />
            <Route path="/einvoice-cancel-irn" element={<CancelIRN />} />
            <Route path="/einvoice-get-by-irn" element={<GetInvByIrn />} />
            <Route path="/einvoice-get-by-doc" element={<GetIrnByDocDetails />} />

            {/* ───────── Print E-Invoice ───────── */}
            <Route path="/print-e-invoice-irn" element={<EInvoicePrintByIRN />} />
            
            {/* ───────── Upload Invoice ───────── */}
            <Route path="/upload-invoices" element={<UploadInvoices />} />
            <Route path="/uploaded-file-status" element={<UploadedFileStatus />} />

            {/* ───────── View Invoice ───────── */}
            <Route path="/single-invoice-details" element={<Detailsofsingleinvoice />} />
            <Route path="/list-of-invoices" element={<ListOfInvoices />} />

            {/* ───────── Print ───────── */}
            {/* The previous /einvoice-print route using the helper EInvoicePrint is removed/updated.
            If you want to keep the old path, you can map it to the new component: */}
            <Route path="/einvoice-print" element={<EInvoicePrintByIRN />} />

            {/* ───────── 404 ───────── */}
            <Route path="*" element={<h2>404 | Page Not Found</h2>} />

          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;