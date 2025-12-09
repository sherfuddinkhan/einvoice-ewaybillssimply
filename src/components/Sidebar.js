import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
 const location = useLocation();

 // Sidebar menu sections
const menuSections = [
 {
 title: "Dashboard",
 items: [{ path: "/", label: "Dashboard" }],
 },
 {
 title: "Login",
 items: [
 { path: "/ewaybill-login", label: "E-Way Bill Login" },
 { path: "/einvoice-login", label: "E-Invoice Login" },
 ],
 },

 // --- E-WAY BILL SEPARATOR ---
 {
 separator: true,
 heading: "E-Way Bill Modules",
 },
 // E-WAY BILL SECTIONS

 {
 title: "EWB Core",
 items: [
 { path: "/ewb-generate-print", label: "EWB Generate & Print" },
 { path: "/ewb-print", label: "E-waybill Print" },
 { path: "/ewb-print-summary", label: "EWB Print Summary" },
 ],
 },
 {
 title: "Ewaybill Actions",
 items: [
 { path: "/ewaybill-actions", label: "Ewaybill Actions" },
 { path: "/update-transporter-id", label: "Update Transporter ID" },
 ],
},
{
 title: "Fetch Ewaybill",
 items: [
 { path: "/consignee-ewb", label: "Consignee Ewaybill" },
 { path: "/get-ewb-generator-ewbs-date", label: "Get EWB Generator Ewbs by Date" },
 { path: "/itransporter-ewaybill", label: "Transporter Ewaybill" },
 ],
 },
 {
 title: "Consolidate Ewaybill",
 items: [
 { path: "/generated-ewby-date", label: "Consolidated Ewaybill" },
 ],
 },
 {
 title: "Multi Vehicle",
 items: [
 { path: "/ewb-multi-vehicle", label: "Multi Vehicle EWB" },
 { path: "/ewb-multi-vehicle-add", label: "Add Multi Vehicle" },
{ path: "/ewb-multi-vehicle-edit", label: "Edit Multi Vehicle" },
 { path: "/ewb-multi-vehicle-details", label: "Multi Vehicle Details" },
 { path: "/get-ewb-multi-veh-details", label: "Get Multi Vehicle Details" },
 { path: "/get-ewb-multi-veh-reg", label: "Get Multi Vehicle Registration" },
 ],
 },

 // --- E-INVOICE SEPARATOR ---
 {
 separator: true,
heading: "E-Invoice Modules",
 },
 // E-INVOICE SECTIONS

 {
 title: "E-Invoice",
 items: [
 { path: "/einvoice-generate-print", label: "Generate & Print E-Invoice" },
 { path: "/einvoice-print", label: "E-Invoice Print" },
 ],
 },
// E-INVOICE Core
 {
 title: "E-Invoice Core",
 items: [
 { path: "/einvoice-generate", label: "Add/Generate E-Invoice (addInvoice.js)" },
 { path: "/einvoice-cancel-irn", label: "Cancel IRN (CancelIRN.js)" },
 { path: "/einvoice-get-by-irn", label: "Get E-Invoice by IRN (GetInvByIrn.js)" },
 { path: "/einvoice-get-by-doc", label: "Get IRN by Doc Details (GetIrnByDocDetails.js)" },
 ],
 },

{
 title: "Print E-Invoice",
 items: [
 { path: "/print-e-invoice-irn", label: "Print E-Invoice by IRN (E-invoice print.js)" },
 ],
 },

// UPLOAD INVOICE
 {
 title: "Upload Invoice",
 items: [
 { path: "/upload-invoices", label: "Upload Invoices (uploadinvoices.js)" },
 { path: "/uploaded-file-status", label: "Uploaded File Status (uploadedfilestatus.js)" },
 ],
 },

 // VIEW INVOICE
 {
 title: "View Invoice",
 items: [
 { path: "/single-invoice-details", label: "Details of Single Invoice (Detailsofsingleinvoice.js)" },
 { path: "/list-of-invoices", label: "List of Invoices (listofinvoices.js)" },
 ],
 },
 ];

 // State to track which section is open (only one open at a time)
 const [openSection, setOpenSection] = useState(null);

 const toggleSection = (title) => {
 setOpenSection((prev) => (prev === title ? null : title));
};

 return (
 <div
 style={{
 width: "240px",
 background: "#1A73E8",
 color: "#fff",
 display: "flex",
 flexDirection: "column",
 padding: "20px",
 overflowY: "auto",
 }}
>
{menuSections.map((section, index) => {
 // Check for the separator object and render the divider
if (section.separator) {
 return (
 <div key={index} style={{ margin: "2px 0" }}>
 <hr style={{ border: "0", height: "1px", background: "#fff", margin: "5px 0" }} />
<div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>
{section.heading}
 </div>
 </div>
 );
 }

 // Render a normal section
 return (
 <div key={section.title} style={{ marginBottom: "5px" }}>
 {/* Section header */}
 <div
 onClick={() => toggleSection(section.title)}
 style={{
 cursor: "pointer",
 fontWeight: "bold",
 fontSize: "16px",
 marginBottom: "2px",
display: "flex",
 alignItems: "center",
 }}
 >
 <span style={{ paddingRight: '8px', flexGrow: 1 }}>{section.title}</span>
 <span>{openSection === section.title ? "▲" : "▼"}</span>
 </div>

 {/* Section items */}
 {openSection === section.title &&
 section.items.map((item) => (
 <Link
key={item.path}
 to={item.path}
 style={{
 color: location.pathname === item.path ? "#1A73E8" : "#fff",
 backgroundColor:
 location.pathname === item.path ? "#fff" : "transparent",
 padding: "8px 15px",
 marginBottom: "4px",
 borderRadius: "6px",
 textDecoration: "none",
 fontWeight: "bold",
 fontSize: "14px",
display: "block",
 }}
 >
 {item.label}
 </Link>
 ))}
 </div>
 );
 })}
 </div>
 );
};

export default Sidebar;