import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

/* ─────────── Login Pages ─────────── */
import EWayBillLoginPage from "./loginAuthentication/EWayBillLoginPage.js";
import EInvoiceLoginPage from "./loginAuthentication/EInvoiceLoginPage.js";

/* ─────────── Layout ─────────── */
import Sidebar from "./components/Sidebar.js";
import Dashboard from "./components/Dashboard.js";

/* ─────────── E-INVOICE & IRN (CORE) ─────────── */
// Path: ./E-invoice/E-invoice&IRN/ 
// FIX: Corrected import path (removed space from 'CancelIRN .js')
import CancelIRN from "./E-invoice/E-invoice&IRN/CancelIRN.js";
import GenerateAndPrintEinvoice from "./E-invoice/E-invoice&IRN/GenerateAndPrintEinvoice.js";
import GetInvByIrn from "./E-invoice/E-invoice&IRN/GetInvByIrn.js";
import GetIrnByDocDetailsForm from "./E-invoice/E-invoice&IRN/GetIrnByDocDetails.js";

/* ─────────── E-WAYBILL (BY IRN) ─────────── */
// Path: ./E-invoice/E-waybill/
// Using the concise names (assuming physical files are renamed)
import CancelEwb from "./E-invoice/E-waybill/CancelEwb.js";
import GenerateEwbByIrn from "./E-invoice/E-waybill/GenerateEwbByIrn.js";
import GetEwbByIrn from "./E-invoice/E-waybill/GetEwbByIrn.js"; 

/* ─────────── Print ─────────── */
// Path: ./E-invoice/print/ 
// Using PrintEInvoice.js
import PrintEInvoice from "./E-invoice/print/PrintEInvoice.js";

/* ─────────── Upload Invoice ─────────── */
// Path: ./E-invoice/Upload invoice/
import UploadInvoice from "./E-invoice/Upload invoice/UploadInvoice.js";
import UploadStatus from "./E-invoice/Upload invoice/UploadStatus.js";
// NOTE: UploadErrors.js is present but not routed, keeping current structure

/* ─────────── View Invoice ─────────── */
// Path: ./E-invoice/Viewinvoice/ 
// Using the concise names (assuming physical files are renamed from *Form.js)
import InvoiceDetails from "./E-invoice/Viewinvoice/InvoiceDetails.js";
import ListEInvoices from "./E-invoice/Viewinvoice/ListEInvoices.js";

/* ─────────── Helpers (Placeholders for missing EWB Core components) ─────────── */
const EwaybillPrintSummary = () => <h2>EWB Print Summary</h2>;
const EwbGenerateAndPrint = () => <h2>EWB Generate and Print (Placeholder)</h2>;
const EwaybillPrint = () => <h2>Ewaybill Print (Placeholder)</h2>;
const EwbDetails = () => <h2>Ewb Details (Placeholder)</h2>;
const EwbDetailsbyEwbNo = () => <h2>Ewb Details by Ewb No (Placeholder)</h2>;


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
            
            {/* ------------------------------------- E-WAYBILL (CORE & IRN) ------------------------------------- */}
            <Route path="/ewb-generate-print" element={<ProtectedRoute isAllowed={allowEwayLogin}><EwbGenerateAndPrint /></ProtectedRoute>}/>
            <Route path="/ewb-print" element={<EwaybillPrint />} />
            <Route path="/ewb-print-summary" element={<EwaybillPrintSummary />} />
            <Route path="/ewb-details" element={<EwbDetails />} />
            <Route path="/ewb-details-by-no" element={<EwbDetailsbyEwbNo />} />
            
            {/* ───────── EWB by IRN (Actual Components based on folder) ───────── */}
            <Route path="/ewb-by-irn-generate" element={<ProtectedRoute isAllowed={allowEwayLogin}><GenerateEwbByIrn /></ProtectedRoute>} />
            <Route path="/ewb-by-irn-cancel" element={<ProtectedRoute isAllowed={allowEwayLogin}><CancelEwb /></ProtectedRoute>} />
            <Route path="/ewb-by-irn-details" element={<GetEwbByIrn />} />

            {/* ------------------------------------- E-INVOICE ------------------------------------- */}
            
            {/* ───────── E-Invoice Core (Actual Components based on folder) ───────── */}
            <Route path="/einvoice-generate" element={<ProtectedRoute isAllowed={allowEinvoiceLogin}><GenerateAndPrintEinvoice /></ProtectedRoute>} />
            <Route path="/einvoice-cancel-irn" element={<CancelIRN />} />
            <Route path="/einvoice-get-by-irn" element={<GetInvByIrn />} />
            <Route path="/einvoice-get-by-doc" element={<GetIrnByDocDetailsForm />} /> 
            
            {/* ───────── Print E-Invoice (Actual Component based on folder) ───────── */}
            <Route path="/print-e-invoice-irn" element={<PrintEInvoice />} />
            <Route path="/einvoice-print" element={<PrintEInvoice />} /> 

            {/* ───────── Upload Invoice (Actual Components based on folder) ───────── */}
            <Route path="/upload-invoices" element={<UploadInvoice />} />
            <Route path="/uploaded-file-status" element={<UploadStatus />} />

            {/* ───────── View Invoice (Actual Components based on folder) ───────── */}
            <Route path="/single-invoice-details" element={<InvoiceDetails />} />
            <Route path="/list-of-invoices" element={<ListEInvoices />} />

            {/* ───────── 404 ───────── */}
            <Route path="*" element={<h2>404 | Page Not Found</h2>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;