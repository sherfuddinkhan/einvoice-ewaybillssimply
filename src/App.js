import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "./components/AuthContext";
import RequireAuth from "./components/RequireAuth";

/* =======================
   LOGIN & AUTH
======================= */
import EWayBillLoginPage from "./loginAuthentication/EWayBillLoginPage";
import EInvoiceLoginPage from "./loginAuthentication/EInvoiceLoginPage";
import EwaybillChangePassword from "./loginAuthentication/EwaybillChangePassword";
import EinvoiceChangePassword from "./loginAuthentication/EinvoiceChangePassword";

/* =======================
   COMMON
======================= */
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";

/* =======================
   E-INVOICE
======================= */
import GenerateAndPrintEinvoice from "./E-invoice/E-invoice&IRN/GenerateAndPrintEinvoice";
import CancelIRN from "./E-invoice/E-invoice&IRN/CancelIRN";
import GetInvByIrn from "./E-invoice/E-invoice&IRN/GetInvByIrn";
import GetIrnByDocDetailsForm from "./E-invoice/E-invoice&IRN/GetIrnByDocDetails";

import GenerateEwbByIrn from "./E-invoice/E-waybill/GenerateEwbByIrn";
import CancelEwb from "./E-invoice/E-waybill/CancelEwb";
import GetEwbByIrn from "./E-invoice/E-waybill/GetEwbByIrn";

import PrintEInvoice from "./E-invoice/print/PrintEInvoice";
import UploadInvoice from "./E-invoice/Upload invoice/UploadInvoice";
import UploadStatus from "./E-invoice/Upload invoice/UploadStatus";
import InvoiceDetails from "./E-invoice/Viewinvoice/InvoiceDetails";
import ListEInvoices from "./E-invoice/Viewinvoice/ListEInvoices";

/* =======================
   E-WAY BILL
======================= */
import EwbGenerateAndPrint from "./E-waybill/Ewaybill Core/EwbGenerateAndPrint";
import FetchEWBbyNumber from "./E-waybill/Ewaybill Core/FetchEWBbyNumber";
import GetEwbDetails from "./E-waybill/Ewaybill Core/GetEwbDetails";

import PrintEwaybill from "./E-waybill/Print Ewaybill summary/Print Ewaybill";
import EwaybillPrintSummary from "./E-waybill/Print Ewaybill summary/Ewbprintsummary";

import CEWBDetails from "./E-waybill/Consolidate Ewaybill/consolidated ewaybill details";
import ByDocNumType from "./E-waybill/Consolidate Ewaybill/consolidate ewaybill";

import EwaybillActions from "./E-waybill/Ewaybill Actions/EwaybillActions";
import UpdateTransporterId from "./E-waybill/Ewaybill Actions/UpdateTransporterId";

import AssignedEwbTransporter from "./E-waybill/Fetch Ewaybill/Ttransporterewaybill";
import ConsigneeEwaybill from "./E-waybill/Fetch Ewaybill/ConsigneeEwaybill";
import FetchByDate from "./E-waybill/Fetch Ewaybill/FetchByDate";

import FetchByDocNumType from "./E-waybill/Get Ewaybill By Document Number & Type/EwaybillbyDocNumAndType";
import FetchEWBByDate from "./E-waybill/Get Ewaybill By Document Number & Type/Generated Ewaybydate";
import GetewbbydocNum from "./E-waybill/Get Ewaybill By Document Number & Type/GetewbbydocNum";
import BulkDownload from "./E-waybill/Get Ewaybill By Document Number & Type/GetewbdocNumdownload";
import GetewbdocNumstatus from "./E-waybill/Get Ewaybill By Document Number & Type/GetewbdocNumstatus";

/* =======================
   MULTI VEHICLE
======================= */
import MultiVehicleInitiate from "./E-waybill/Multi-Vehicle/MultiVehicleInitiate";
import MultiVehicleAdd from "./E-waybill/Multi-Vehicle/MultiVehicleAdd";
import MultiVehicleEdit from "./E-waybill/Multi-Vehicle/MultiVehicleEdit";
import MultiVehicleGroupDetails from "./E-waybill/Multi-Vehicle/MultiVehicleGroupDetails";
import MultiVehicleRequests from "./E-waybill/Multi-Vehicle/MultiVehicleRequests";

/* =======================
   LAYOUT
======================= */
const Layout = () => (
  <div style={{ display: "flex", minHeight: "100vh" }}>
    <Sidebar />
    <div style={{ flex: 1, padding: 20, background: "#F5F5F7" }}>
      <Outlet />
    </div>
  </div>
);

/* =======================
   APP
======================= */
const App = () => {
  const { isAuthReady, isLoggedIn, product } = useAuth();

  if (!isAuthReady) return <div>Loading authentication...</div>;

  const EWAY_DEFAULT = "/ewaybill/ewb-generate-print";
  const EINVOICE_DEFAULT = "/einvoice/generate-print";

  return (
    <Router>
      <Routes>

        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
        </Route>

        <Route
          path="/ewaybill-login"
          element={
            isLoggedIn && product === "EWAY"
              ? <Navigate to={EWAY_DEFAULT} />
              : <EWayBillLoginPage />
          }
        />

        <Route
          path="/einvoice-login"
          element={
            isLoggedIn && product === "EINVOICE"
              ? <Navigate to={EINVOICE_DEFAULT} />
              : <EInvoiceLoginPage />
          }
        />

        {/* ================= E-WAY BILL ================= */}
        <Route
          path="/ewaybill"
          element={
            <RequireAuth product="EWAY">
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="ewb-generate-print" element={<EwbGenerateAndPrint />} />
          <Route path="fetch-ewb" element={<FetchEWBbyNumber />} />
          <Route path="ewb-details" element={<GetEwbDetails />} />

          <Route path="ewb-print" element={<PrintEwaybill />} />
          <Route path="ewb-print-summary" element={<EwaybillPrintSummary />} />

          <Route path="ewb-action" element={<EwaybillActions />} />
          <Route path="ewb-action/:ewbNo" element={<EwaybillActions />} />
          <Route path="update-transporter-id" element={<UpdateTransporterId />} />

          <Route path="assigned-ewb" element={<AssignedEwbTransporter />} />
          <Route path="consignee-ewb" element={<ConsigneeEwaybill />} />
          <Route path="fetch-by-date" element={<FetchByDate />} />

          <Route path="by-doc-type" element={<FetchByDocNumType />} />
          <Route path="generated-by-date" element={<FetchEWBByDate />} />
          <Route path="get-by-doc-no" element={<GetewbbydocNum />} />
          <Route path="download-doc" element={<BulkDownload />} />
          <Route path="get-doc-status" element={<GetewbdocNumstatus />} />

          <Route path="multi-vehicle-initiate" element={<MultiVehicleInitiate />} />
          <Route path="multi-vehicle-add" element={<MultiVehicleAdd />} />
          <Route path="multi-vehicle-edit" element={<MultiVehicleEdit />} />
          <Route path="multi-vehicle-group-details" element={<MultiVehicleGroupDetails />} />
          <Route path="multi-vehicle-requests" element={<MultiVehicleRequests />} />

          <Route path="consolidated-ewb-details" element={<CEWBDetails />} />
          <Route path="consolidate-ewb" element={<ByDocNumType />} />

          <Route path="change-password" element={<EwaybillChangePassword />} />
        </Route>

        {/* ================= E-INVOICE ================= */}
        <Route
          path="/einvoice"
          element={
            <RequireAuth product="EINVOICE">
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="generate-print" element={<GenerateAndPrintEinvoice />} />
          <Route path="cancel-irn" element={<CancelIRN />} />
          <Route path="get-by-irn" element={<GetInvByIrn />} />
          <Route path="get-by-doc" element={<GetIrnByDocDetailsForm />} />

          <Route path="generate-ewb-by-irn" element={<GenerateEwbByIrn />} />
          <Route path="cancel-ewb-by-irn" element={<CancelEwb />} />
          <Route path="get-ewb-by-irn" element={<GetEwbByIrn />} />

          <Route path="print-irn" element={<PrintEInvoice />} />
          <Route path="upload-invoices" element={<UploadInvoice />} />
          <Route path="uploaded-file-status" element={<UploadStatus />} />
          <Route path="single-invoice-details" element={<InvoiceDetails />} />
          <Route path="list-of-invoices" element={<ListEInvoices />} />

          <Route path="change-password" element={<EinvoiceChangePassword />} />
        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<h2>404 | Page Not Found</h2>} />

      </Routes>
    </Router>
  );
};

export default App;
