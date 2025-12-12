import React from "react";
// Import necessary React Router components
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom"; 
// Import custom context and HOC
import { useAuth } from "./components/AuthContext";
import RequireAuth from "./components/RequireAuth";

// ------------------------------------------------
// 1. IMPORT COMPONENTS
// ------------------------------------------------

/* ─────────── LOGIN & LAYOUT ─────────── */
import EWayBillLoginPage from "./loginAuthentication/EWayBillLoginPage";
import EInvoiceLoginPage from "./loginAuthentication/EInvoiceLoginPage";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";

/* ─────────── E-INVOICE CORE ─────────── */
import GenerateAndPrintEinvoice from "./E-invoice/E-invoice&IRN/GenerateAndPrintEinvoice";
import CancelIRN from "./E-invoice/E-invoice&IRN/CancelIRN";
import GetInvByIrn from "./E-invoice/E-invoice&IRN/GetInvByIrn";
import GetIrnByDocDetailsForm from "./E-invoice/E-invoice&IRN/GetIrnByDocDetails";

/* ─────────── E-WAY BILL FROM IRN (E-INVOICE MODULE) ─────────── */
import GenerateEwbByIrn from "./E-invoice/E-waybill/GenerateEwbByIrn";
import CancelEwb from "./E-invoice/E-waybill/CancelEwb";
import GetEwbByIrn from "./E-invoice/E-waybill/GetEwbByIrn";

/* ─────────── E-INVOICE AUXILIARY ─────────── */
import PrintEInvoice from "./E-invoice/print/PrintEInvoice";
import UploadInvoice from "./E-invoice/Upload invoice/UploadInvoice";
import UploadStatus from "./E-invoice/Upload invoice/UploadStatus";
import InvoiceDetails from "./E-invoice/Viewinvoice/InvoiceDetails";
import ListEInvoices from "./E-invoice/Viewinvoice/ListEInvoices";

/* ─────────── EWAYBILL CORE ─────────── */
import EwbGenerateAndPrint from "./E-waybill/Ewaybill Core/EwbGenerateAndPrint";
import FetchEWBbyNumber from "./E-waybill/Ewaybill Core/FetchEWBbyNumber";
import GetEwbDetails from "./E-waybill/Ewaybill Core/GetEwbDetails";
import PrintEwaybill from "./E-waybill/Print Ewaybill summary/Print Ewaybill"; // Correct usage of PrintEwaybill
import EwaybillPrintSummary from "./E-waybill/Print Ewaybill summary/Ewbprintsummary";
import CEWBDetails from "./E-waybill/Consolidate Ewaybill/consolidated ewaybill details";
import ByDocNumType from "./E-waybill/Consolidate Ewaybill/consolidate ewaybill";
import EwaybillActions from "./E-waybill/Ewaybill Actions/EwaybillActions";
import UpdateTransporterId from "./E-waybill/Ewaybill Actions/UpdateTransporterId";

/* ─────────── EWAYBILL FETCH / DOC TYPE / MULTI-VEHICLE ─────────── */
import AssignedEwbTransporter from "./E-waybill/Fetch Ewaybill/Ttransporterewaybill";
import ConsigneeEwaybill from "./E-waybill/Fetch Ewaybill/ConsigneeEwaybill";
import FetchByDate from "./E-waybill/Fetch Ewaybill/FetchByDate";
import FetchByDocNumType from "./E-waybill/Get Ewaybill By Document Number & Type/EwaybillbyDocNumAndType";
import FetchEWBByDate from "./E-waybill/Get Ewaybill By Document Number & Type/Generated Ewaybydate";
import GetewbbydocNum from "./E-waybill/Get Ewaybill By Document Number & Type/GetewbbydocNum";
import BulkDownload from "./E-waybill/Get Ewaybill By Document Number & Type/GetewbdocNumdownload";
import GetewbdocNumstatus from "./E-waybill/Get Ewaybill By Document Number & Type/GetewbdocNumstatus";
import MultiVehicleInitiate from "./E-waybill/Multi-Vehicle/MultiVehicleInitiate";
import MultiVehicleAdd from "./E-waybill/Multi-Vehicle/MultiVehicleAdd";
import MultiVehicleRequests from "./E-waybill/Multi-Vehicle/MultiVehicleRequests";
import MultiVehicleEdit from "./E-waybill/Multi-Vehicle/MultiVehicleEdit";
import MultiVehicleGroupDetails from "./E-waybill/Multi-Vehicle/MultiVehicleGroupDetails";


// ------------------------------------------------
// 2. LAYOUT COMPONENT
// Wraps Sidebar, content container, and Outlet for nested routes
// ------------------------------------------------
const Layout = () => (
    <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div style={{ flex: 1, padding: 20, background: "#F5F5F7" }}>
            {/* The Outlet renders the component for the current nested route */}
            <Outlet /> 
        </div>
    </div>
);


// ------------------------------------------------
// 3. MAIN APP COMPONENT
// ------------------------------------------------
const App = () => {
    const { isAuthReady, isLoggedIn, product } = useAuth();

    if (!isAuthReady) {
        return <div>Loading authentication...</div>;
    }
    
    // Define default landing pages based on product
    const EWAY_DEFAULT_ROUTE = "/ewaybill/ewb-generate-print";
    const EINVOICE_DEFAULT_ROUTE = "/einvoice/generate-print";

    return (
        <Router>
            <Routes>
                
                {/* -------------------- 1. PUBLIC ROUTES (Login, Dashboard) -------------------- */}
                
                {/* Root Route */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} /> 
                </Route>

                {/* E-Way Bill Login */}
                <Route 
                    path="/ewaybill-login"
                    element={
                        isLoggedIn && product === "EWAY" 
                        ? <Navigate to={EWAY_DEFAULT_ROUTE} replace /> 
                        : <EWayBillLoginPage />
                    }
                />

                {/* E-Invoice Login */}
                <Route 
                    path="/einvoice-login"
                    element={
                        isLoggedIn && product === "EINVOICE" 
                        ? <Navigate to={EINVOICE_DEFAULT_ROUTE} replace /> 
                        : <EInvoiceLoginPage />
                    }
                />

                {/* -------------------- 2. E-WAY BILL PROTECTED ROUTES -------------------- */}
                {/* All routes prefixed with /ewaybill/* */}
                <Route path="/ewaybill" element={<RequireAuth product="EWAY"><Layout /></RequireAuth>}>
                    
                    {/* CORE */}
                    <Route path="ewb-generate-print" element={<EwbGenerateAndPrint/>} />
                    <Route path="fetch-ewb" element={<FetchEWBbyNumber/>} />
                    <Route path="ewb-details" element={<GetEwbDetails/>} />
                    
                    {/* PRINT */}
                    <Route path="ewb-print" element={<PrintEwaybill/>} /> 
                    <Route path="ewb-print-summary" element={<EwaybillPrintSummary/>} />

                    {/* CONSOLIDATED */}
                    <Route path="consolidated-ewb-details" element={<CEWBDetails/>} />
                    <Route path="consolidate-ewb" element={<ByDocNumType/>} />
                    
                    {/* ACTIONS */}
                    <Route path="ewb-action/:ewbNo" element={<EwaybillActions/>} />
                    <Route path="update-transporter-id" element={<UpdateTransporterId/>} />
                    
                    {/* FETCH */}
                    <Route path="assigned-ewb" element={<AssignedEwbTransporter/>} />
                    <Route path="consignee-ewb" element={<ConsigneeEwaybill/>} />
                    <Route path="fetch-by-date" element={<FetchByDate/>} />

                    {/* DOC TYPE ROUTES */}
                    <Route path="by-doc-type" element={<FetchByDocNumType/>} />
                    <Route path="generated-by-date" element={<FetchEWBByDate/>} />
                    <Route path="get-by-doc-no" element={<GetewbbydocNum/>} />
                    <Route path="download-doc" element={<BulkDownload/>} />
                    <Route path="get-doc-status" element={<GetewbdocNumstatus/>} />

                    {/* MULTI VEHICLE */}
                    <Route path="multi-vehicle-initiate" element={<MultiVehicleInitiate/>} />
                    <Route path="multi-vehicle-add" element={<MultiVehicleAdd/>} />
                    <Route path="multi-vehicle-edit" element={<MultiVehicleEdit/>} />
                    <Route path="multi-vehicle-group-details" element={<MultiVehicleGroupDetails/>} />
                    <Route path="multi-vehicle-requests" element={<MultiVehicleRequests/>} />
                </Route>


                {/* -------------------- 3. E-INVOICE PROTECTED ROUTES -------------------- */}
                {/* All routes prefixed with /einvoice/* */}
                <Route path="/einvoice" element={<RequireAuth product="EINVOICE"><Layout /></RequireAuth>}>
                    
                    {/* CORE */}
                    <Route path="generate-print" element={<GenerateAndPrintEinvoice/>} />
                    <Route path="cancel-irn" element={<CancelIRN/>} />
                    <Route path="get-by-irn" element={<GetInvByIrn/>} />
                    <Route path="get-by-doc" element={<GetIrnByDocDetailsForm/>} />

                    {/* EWB FROM IRN */}
                    <Route path="generate-ewb-by-irn" element={<GenerateEwbByIrn/>} />
                    <Route path="cancel-ewb-by-irn" element={<CancelEwb/>} />
                    <Route path="get-ewb-by-irn" element={<GetEwbByIrn/>} />
                    
                    {/* AUXILIARY */}
                    <Route path="print-irn" element={<PrintEInvoice/>} />
                    <Route path="upload-invoices" element={<UploadInvoice/>} />
                    <Route path="uploaded-file-status" element={<UploadStatus/>} />
                    <Route path="single-invoice-details" element={<InvoiceDetails/>} />
                    <Route path="list-of-invoices" element={<ListEInvoices/>} />

                </Route>

                {/* -------------------- 4. FALLBACK ROUTE -------------------- */}
                <Route path="*" element={<h2>404 | Page Not Found</h2>} />
            </Routes>
        </Router>
    );
};

export default App;