import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./components/AuthContext";
import { AuthProvider } from "./components/AuthContext";
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

/* ─────────── PRINT ─────────── */
import PrintEInvoice from "./E-invoice/print/PrintEInvoice";

/* ─────────── UPLOAD ─────────── */
import UploadInvoice from "./E-invoice/Upload invoice/UploadInvoice";
import UploadStatus from "./E-invoice/Upload invoice/UploadStatus";

/* ─────────── VIEW ─────────── */
import InvoiceDetails from "./E-invoice/Viewinvoice/InvoiceDetails";
import ListEInvoices from "./E-invoice/Viewinvoice/ListEInvoices";

/* ─────────── E-WAY BILL (PLACEHOLDERS) ─────────── */
const EwbGenerateAndPrint = () => <h2>EWB Generate & Print</h2>;
const EwaybillPrint = () => <h2>E-Way Bill Print</h2>;
const EwaybillPrintSummary = () => <h2>EWB Print Summary</h2>;

const EwaybillActions = () => <h2>E-Way Bill Actions</h2>;
const UpdateTransporterId = () => <h2>Update Transporter ID</h2>;

const ConsigneeEwaybill = () => <h2>Consignee E-Way Bill</h2>;
const FetchEwbByDate = () => <h2>Fetch EWB By Date</h2>;
const TransporterEwaybill = () => <h2>Transporter E-Way Bill</h2>;

const EwaybillByDocType = () => <h2>EWB by Doc Number & Type</h2>;
const GeneratedEwbByDate = () => <h2>Generated EWB By Date</h2>;
const GetEwbByDocNo = () => <h2>Get EWB by Doc No</h2>;
const GetEwbDocDownload = () => <h2>EWB Document Download</h2>;
const GetEwbDocStatus = () => <h2>EWB Document Status</h2>;

const MultiVehicleInitiate = () => <h2>Multi-Vehicle Initiate</h2>;
const MultiVehicleAdd = () => <h2>Multi-Vehicle Add</h2>;
const MultiVehicleEdit = () => <h2>Multi-Vehicle Edit</h2>;
const MultiVehicleGroupDetails = () => <h2>Multi-Vehicle Group Details</h2>;
const MultiVehicleRequests = () => <h2>Multi-Vehicle Requests</h2>;



const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/" />;
};

const App = () => {
  const [allowEwayLogin, setAllowEwayLogin] = useState(false);
  const [allowEinvoiceLogin, setAllowEinvoiceLogin] = useState(false);



  // ⬇️ ADD THIS — FIXES ESLINT ERROR
  const { isLoggedIn, product } = useAuth();

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
{/* Note: with this routing ? no need of login ones we are logged in with (<Navigate to="/ewb-generate-print" replace />) : (<EWayBillLoginPage />) and next one is  even if we logged with one  say E-waybill its showing it is logged in as E-invoice so avoid we are using Product based login like{isLoggedIn && product === "EWAY" ?} and {isLoggedIn && product === "EINVOICE" ? product */}
<Route path="/ewaybill-login" element={isLoggedIn && product === "EWAY" ? (<Navigate to="/ewb-generate-print" replace />) : (<EWayBillLoginPage />)}/>
<Route path="/einvoice-login" element={isLoggedIn && product === "EINVOICE" ? (<Navigate to="/einvoice-generate-print" replace />) : (<EInvoiceLoginPage/>)}/>

            {/* ───────── EWB CORE ───────── */}
   {/*ProtectedRoute checks only isLoggedIn but NOT which product(E-way or E-Invoice) is logged in.So even if you're logged in as E-INVOICE, when you try to open an E-WAY BILL route, it still allows routing OR still shows login because logic is mixed. so by sending product e-way or E-invoice as props to RequireAuth  component we are differentiating whether the protected route is E-invoice or E-way else one logic route in protected is shared with other to overcome we did this */}    
  <Route path="/ewb-generate-print" element={<RequireAuth product="EWAY"><EwbGenerateAndPrint/></RequireAuth>}/>
 
     
           
            <Route path="/ewb-print" element={<EwaybillPrint />} />
            <Route path="/ewb-print-summary" element={<EwaybillPrintSummary />} />

            {/* ───────── EWB ACTIONS ───────── */}
            <Route path="/ewaybill-actions" element={<EwaybillActions />} />
            <Route path="/update-transporter-id" element={<UpdateTransporterId />} />

            {/* ───────── FETCH EWB ───────── */}
            <Route path="/consignee-ewaybill" element={<ConsigneeEwaybill />} />
            <Route path="/fetch-ewb-by-date" element={<FetchEwbByDate />} />
            <Route path="/transporter-ewaybill" element={<TransporterEwaybill />} />

            {/* ───────── EWB BY DOC ───────── */}
            <Route path="/ewaybill-by-doc-type" element={<EwaybillByDocType />} />
            <Route path="/generated-ewb-by-date" element={<GeneratedEwbByDate />} />
            <Route path="/get-ewb-by-doc-no" element={<GetEwbByDocNo />} />
            <Route path="/get-ewb-doc-download" element={<GetEwbDocDownload />} />
            <Route path="/get-ewb-doc-status" element={<GetEwbDocStatus />} />

            {/* ───────── MULTI VEHICLE ───────── */}
            <Route path="/multi-vehicle-initiate" element={<MultiVehicleInitiate />} />
            <Route path="/multi-vehicle-add" element={<MultiVehicleAdd />} />
            <Route path="/multi-vehicle-edit" element={<MultiVehicleEdit />} />
            <Route path="/multi-vehicle-group-details" element={<MultiVehicleGroupDetails />} />
            <Route path="/multi-vehicle-requests" element={<MultiVehicleRequests />} />
 {/*ProtectedRoute checks only isLoggedIn but NOT which product(E-way or E-Invoice) is logged in.So even if you're logged in as E-INVOICE, when you try to open an E-WAY BILL route, it still allows routing OR still shows login because logic is mixed. so by sending product e-way or E-invoice as props to RequireAuth  component we are differentiating whether the protected route is E-invoice or E-way else one logic route in protected is shared with other to overcome we did this */}    

            {/* ───────── E-INVOICE CORE ───────── */}
            <Route
              path="/einvoice-generate-print"
              element={<RequireAuth product="EINVOICE">
                  <GenerateAndPrintEinvoice />
                </RequireAuth>
              }
            />
            <Route path="/einvoice-cancel-irn" element={<CancelIRN />} />
            <Route path="/einvoice-get-by-irn" element={<GetInvByIrn />} />
            <Route path="/einvoice-get-by-doc" element={<GetIrnByDocDetailsForm />} />

            {/* ───────── EWB FROM IRN ───────── */}
            <Route path="/generate-ewb-by-irn" element={<GenerateEwbByIrn />} />
            <Route path="/cancel-ewb-by-irn" element={<CancelEwb />} />
            <Route path="/get-ewb-by-irn" element={<GetEwbByIrn />} />

            {/* ───────── PRINT / UPLOAD / VIEW ───────── */}
            <Route path="/print-e-invoice-irn" element={<PrintEInvoice />} />
            <Route path="/upload-invoices" element={<UploadInvoice />} />
            <Route path="/uploaded-file-status" element={<UploadStatus />} />
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
