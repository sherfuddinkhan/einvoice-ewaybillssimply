// src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import EWayBillLoginPage from "./components/EWayBillLoginPage";
import EInvoiceLoginPage from "./components/EInvoiceLoginPage";
import EwbGenerateAndPrint from "./components/EwbGenerateAndPrint";
import GenerateAndPrintEinvoice from "./components/GenerateAndPrintEinvoice";
import PrintEinvoice from "./components/E-invoice print";
import Ewaybillprint from "./components/E-waybill print";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";

const App = () => {
  const [allowEwayLogin, setAllowEwayLogin] = useState(false);
  const [allowEinvoiceLogin, setAllowEinvoiceLogin] = useState(false);

  return (
    <Router>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div style={{ flex: 1, padding: "20px", background: "#F5F5F7" }}>
          <Routes>

            {/* Dashboard gives permissions */}
            <Route
              path="/"
              element={
                <Dashboard
                  setAllowEwayLogin={setAllowEwayLogin}
                  setAllowEinvoiceLogin={setAllowEinvoiceLogin}
                />
              }
            />

            {/* ------------------------------ */}
            {/* PROTECTED LOGIN ROUTES         */}
            {/* ------------------------------ */}

            <Route
              path="/ewaybill-login"
              element={
                allowEwayLogin ? (
                  <EWayBillLoginPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/einvoice-login"
              element={
                allowEinvoiceLogin ? (
                  <EInvoiceLoginPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />


            {/* ------------------------------ */}
            {/* PROTECTED GENERATE / PRINT     */}
            {/* ------------------------------ */}

            <Route
              path="/ewb-generate-print"
              element={
                allowEwayLogin ? (
                  <EwbGenerateAndPrint />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/einvoice-generate-print"
              element={
                allowEinvoiceLogin ? (
                  <GenerateAndPrintEinvoice />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* Direct Print Pages (No login needed) */}
            <Route path="/ewb-print" element={<Ewaybillprint />} />
            <Route path="/einvoice-print" element={<PrintEinvoice />} />

            {/* Dashboard direct route */}
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  setAllowEwayLogin={setAllowEwayLogin}
                  setAllowEinvoiceLogin={setAllowEinvoiceLogin}
                />
              }
            />

          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
