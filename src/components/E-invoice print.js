// PrintEinvoice.js

import React, { useState } from "react";
import axios from "axios";

const PrintEinvoice = () => {
  const [template, setTemplate] = useState("STANDARD");
  const [id, setId] = useState("");
  const [message, setMessage] = useState("");

  const downloadPDF = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/proxy/einvoice/print?template=${template}&id=${id}`,
        {
          headers: {
            "X-Auth-Token": localStorage.getItem("token"),
            companyId: "24",
            product: "ONYX",
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `EInvoice_${id}.pdf`);
      document.body.appendChild(link);
      link.click();

      setMessage("PDF downloaded successfully.");

    } catch (error) {
      setMessage("Failed to download PDF.");
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Print E-Invoice (PDF)</h2>

      <input
        placeholder="Template (STANDARD)"
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
      />

      <input
        placeholder="Invoice ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />

      <button onClick={downloadPDF}>Download PDF</button>

      {message && <p>{message}</p>}
    </div>
  );
};

export default PrintEinvoice;




