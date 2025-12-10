import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  // Sidebar menu sections - Paths are synchronized with your App.js routes
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

    // EWB Core (Matches placeholder routes defined in App.js)
    {
      title: "EWB Core",
      items: [
        { path: "/ewb-generate-print", label: "EWB Generate & Print" },
        { path: "/ewb-print", label: "E-waybill Print" },
        { path: "/ewb-print-summary", label: "EWB Print Summary" },
      ],
    },
    
    // EWB by IRN (Synchronized with the routes pointing to components in E-invoice/E-waybill)
    {
      title: "EWB Actions",
      items: [
        { path: "/Ewaybill Actions", label: "Ewaybill Actions" },
        { path: "/UpdateTransporterId", label: "UpdateTransporterId" },
      ],
    },

    // Fetch Ewaybill (Matches placeholder routes defined in App.js)
    {
      title: "Fetch Ewaybill",
      items: [
        { path: "/consinee Ewaybill", label: "consinee Ewaybill" },
        { path: "/FetchByDate", label: "EWB DetailByDate" },
        { path: "/Ttransporterewaybill", label: "Ttransporterewaybill" },
      ],
    },
     // Fetch Ewaybill (Matches placeholder routes defined in App.js)
    {
      title: "Get Ewaybill By Document Number & Type",
      items: [
        { path: "/EwaybillbyDocNumAndType", label: "EwaybillbyDocNumAndType" },
        { path: "/Generated Ewaybydate", label: "Generated Ewaybydate" },
        { path: "/GetewbbydocNum", label: "GetewbbydocNum" },
        { path: "/GetewbdocNumdownload", label: "GetewbdocNumdownload" },
        { path: "/GetewbdocNumstatus", label: "GetewbdocNumstatus" },
      ],
    },
     {
      title: "Multi-Vehicle",
      items: [
        { path: "/MultiVehicleInitiate", label: "MultiVehicleInitiate" },
        { path: "/MultiVehicleAdd", label: "MultiVehicleAdd" },
        { path: "/MultiVehicleEdit", label: "MultiVehicleEdit" },
        { path: "/MultiVehicleGroupDetails", label: "MultiVehicleGroupDetails" },
        { path: "/MultiVehicleRequests", label: "MultiVehicleRequests" },
      ],
    },

    // --- E-INVOICE SEPARATOR ---
    {
      separator: true,
      heading: "E-Invoice Modules",
    },
    
    // E-INVOICE SECTIONS (All paths match App.js exactly)

    // CORE: Generation, Cancellation, and Fetching IRN (Matches E-invoice/E-invoice&IRN/)
    {
      title: "E-Invoice Core",
      items: [
        { path: "/einvoice-generate", label: "Add/Generate E-Invoice" },
        { path: "/einvoice-cancel-irn", label: "Cancel IRN" },
        { path: "/einvoice-get-by-irn", label: "Get E-Invoice by IRN" },
        { path: "/einvoice-get-by-doc", label: "Get IRN by Doc Details" },
      ],
    },
     {
      title: "E-way bill from IRN",
      items: [
        { path: "/einvoice-generate", label: "cancel E-way bill" },
        { path: "/einvoice-cancel-irn", label: "Generate E-way bill by irn" },
        { path: "/einvoice-get-by-irn", label: "Get e-way billby irn" },
      ],
    },

    // PRINT: Printing (Matches E-invoice/print/)
    {
      title: "Print E-Invoice",
      items: [
        { path: "/print-e-invoice-irn", label: "Print E-Invoice by IRN" },
      ],
    },

    // UPLOAD (Matches E-invoice/Upload invoice/)
    {
      title: "Upload Invoice",
      items: [
        { path: "/upload-invoices", label: "Upload Invoices" },
        { path: "/uploaded-file-status", label: "Uploaded File Status" },
      ],
    },

    // VIEW (Matches E-invoice/Viewinvoice/)
    {
      title: "View Invoice",
      items: [
        { path: "/single-invoice-details", label: "Details of Single Invoice" },
        { path: "/list-of-invoices", label: "List of Invoices" },
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
        position: 'sticky', 
        top: 0,
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
        const isSectionActive = section.items.some(item => location.pathname === item.path);
        
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
                padding: "8px 0",
                backgroundColor: isSectionActive ? '#2c84f8' : 'transparent',
                borderRadius: '6px',
              }}
            >
              <span style={{ paddingRight: '8px', paddingLeft: '8px', flexGrow: 1 }}>{section.title}</span>
              <span style={{ paddingRight: '8px' }}>{openSection === section.title ? "▲" : "▼"}</span>
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
                    marginTop: "2px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: "14px",
                    display: "block",
                    transition: 'background-color 0.2s',
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