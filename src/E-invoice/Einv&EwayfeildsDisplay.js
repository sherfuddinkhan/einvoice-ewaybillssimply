// Einv&EwayfeildsDisplay.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EinvEwayfeildsDisplay = () => {

  // =========================
  // NAVIGATION
  // =========================

  const navigate = useNavigate();

  // =========================
  // STATES
  // =========================

  const [loading, setLoading] = useState(false);

  const [invoiceData, setInvoiceData] = useState([]);

  // =========================
  // FETCH INVOICE DATA
  // =========================

 const getInvoiceData = async () => {

  try {

    setLoading(true);

    const response = await axios.get(
      "http://localhost:3001/api/invoices"
    );

    console.log(
      "API Response:",
      response.data
    );

    // Ensure Array Response

    if (Array.isArray(response.data)) {

      setInvoiceData(response.data);

    } else {

      setInvoiceData([]);

      console.log(
        "Response is not array"
      );
    }

  } catch (error) {

    console.log(
      "Fetch Error:",
      error
    );

    alert(
      "Failed to fetch invoice data"
    );

  } finally {

    setLoading(false);
  }
};

  // =========================
  // USE EFFECT
  // =========================

  useEffect(() => {

    getInvoiceData();

  }, []);

  // =========================
  // E-WAY BILL BUTTON
  // =========================

  const handleGenerateEway = (row) => {

    navigate("/ewaybill", {
      state: row
    });
  };

  // =========================
  // E-INVOICE BUTTON
  // =========================

  const handleGenerateEinvoice = (row) => {

    navigate("/einvoice", {
      state: row
    });
  };

  // =========================
  // UI
  // =========================

  return (

    <div style={styles.container}>

      {/* ========================= */}
      {/* PAGE TITLE */}
      {/* ========================= */}

      <div style={styles.header}>

        <h2 style={styles.heading}>
          Invoice List
        </h2>

      </div>

      {/* ========================= */}
      {/* LOADING */}
      {/* ========================= */}

      {
        loading && (
          <div style={styles.loading}>
            Loading...
          </div>
        )
      }

      {/* ========================= */}
      {/* TABLE */}
      {/* ========================= */}

      <div style={styles.tableWrapper}>

        <table style={styles.table}>

          {/* ========================= */}
          {/* TABLE HEADER */}
          {/* ========================= */}

          <thead>

            <tr>

              <th style={styles.th}>
                #
              </th>

              <th style={styles.th}>
                Action
              </th>

              <th style={styles.th}>
                Customer Name
              </th>

              <th style={styles.th}>
                Mobile No
              </th>

              <th style={styles.th}>
                Purchase Order
              </th>

              <th style={styles.th}>
                Purchase Order Date
              </th>

              <th style={styles.th}>
                Invoice Created On
              </th>

              <th style={styles.th}>
                Created On
              </th>

              <th style={styles.th}>
                GSTIN
              </th>

              <th style={styles.th}>
                Vehicle No
              </th>

              <th style={styles.th}>
                E-Way Bill No
              </th>

              <th style={styles.th}>
                Transaction Status
              </th>

            </tr>

          </thead>

          {/* ========================= */}
          {/* TABLE BODY */}
          {/* ========================= */}

          <tbody>

            {
              invoiceData.length > 0 ? (

                invoiceData.map((row, index) => (

                  <tr key={index}>

                    {/* SERIAL NUMBER */}

                    <td style={styles.td}>
                      {index + 1}
                    </td>

                    {/* ACTION BUTTONS */}

                    <td style={styles.td}>

                      <div style={styles.buttonContainer}>

                        <button
                          style={styles.ewayBtn}
                          onClick={() =>
                            handleGenerateEway(row)
                          }
                        >
                          Generate E-Way
                        </button>

                        <button
                          style={styles.einvoiceBtn}
                          onClick={() =>
                            handleGenerateEinvoice(row)
                          }
                        >
                          Generate E-Invoice
                        </button>

                      </div>

                    </td>

                    {/* CUSTOMER NAME */}

                    <td style={styles.td}>
                      {
                        row.clientCompanyName || "-"
                      }
                    </td>

                    {/* MOBILE */}

                    <td style={styles.td}>
                      {row.mobileNo || "-"}
                    </td>

                    {/* PURCHASE ORDER */}

                    <td style={styles.td}>
                      {
                        row.purchaseOrder || "-"
                      }
                    </td>

                    {/* PURCHASE ORDER DATE */}

                    <td style={styles.td}>
                      {
                        row.purchaseOrderDate
                          ? new Date(
                              row.purchaseOrderDate
                            ).toLocaleDateString()
                          : "-"
                      }
                    </td>

                    {/* INVOICE CREATED */}

                    <td style={styles.td}>
                      {
                        row.invoiceCreatedOn
                          ? new Date(
                              row.invoiceCreatedOn
                            ).toLocaleString()
                          : "-"
                      }
                    </td>

                    {/* CREATED ON */}

                    <td style={styles.td}>
                      {
                        row.createdOn
                          ? new Date(
                              row.createdOn
                            ).toLocaleString()
                          : "-"
                      }
                    </td>

                    {/* GSTIN */}

                    <td style={styles.td}>
                      {row.gstin || "-"}
                    </td>

                    {/* VEHICLE NUMBER */}

                    <td style={styles.td}>
                      {row.vehicleNo || "-"}
                    </td>

                    {/* EWAY BILL NUMBER */}

                    <td style={styles.td}>
                      {
                        row.eWayBillNumber || "-"
                      }
                    </td>

                    {/* TRANSACTION STATUS */}

                    <td style={styles.td}>
                      {
                        row.transactionStatusXid
                      }
                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="12"
                    style={styles.noData}
                  >
                    No Invoice Data Found
                  </td>

                </tr>
              )
            }

          </tbody>

        </table>

      </div>

      {/* ========================= */}
      {/* PRODUCT DETAILS */}
      {/* ========================= */}

      {
        invoiceData.map((invoice, index) => (

          <div
            key={index}
            style={styles.productSection}
          >

            <h3>
              Product Details -
              {" "}
              {
                invoice.clientCompanyName
              }
            </h3>

            <div style={styles.tableWrapper}>

              <table style={styles.table}>

                <thead>

                  <tr>

                    <th style={styles.th}>
                      Item Name
                    </th>

                    <th style={styles.th}>
                      Description
                    </th>

                    <th style={styles.th}>
                      HSN Code
                    </th>

                    <th style={styles.th}>
                      Quantity
                    </th>

                    <th style={styles.th}>
                      GST %
                    </th>

                    <th style={styles.th}>
                      Total Amount
                    </th>

                    <th style={styles.th}>
                      After GST Amount
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {
                    invoice.invoiceProductDetails
                      ?.length > 0 ? (

                      invoice.invoiceProductDetails.map(
                        (
                          product,
                          productIndex
                        ) => (

                          <tr
                            key={productIndex}
                          >

                            <td style={styles.td}>
                              {
                                product.itemName
                              }
                            </td>

                            <td style={styles.td}>
                              {
                                product.description
                              }
                            </td>

                            <td style={styles.td}>
                              {
                                product.hsncode
                              }
                            </td>

                            <td style={styles.td}>
                              {
                                product.quantity
                              }
                            </td>

                            <td style={styles.td}>
                              {
                                product.gstPer
                              }
                            </td>

                            <td style={styles.td}>
                              {
                                product.totalAmount
                              }
                            </td>

                            <td style={styles.td}>
                              {
                                product.afterGSTAmount
                              }
                            </td>

                          </tr>

                        )
                      )

                    ) : (

                      <tr>

                        <td
                          colSpan="7"
                          style={styles.noData}
                        >
                          No Product Details
                        </td>

                      </tr>
                    )
                  }

                </tbody>

              </table>

            </div>

          </div>

        ))
      }

    </div>
  );
};

// =========================
// STYLES
// =========================

const styles = {

  container: {
    padding: "20px",
    fontFamily: "Arial",
    backgroundColor: "#f4f6f9",
    minHeight: "100vh"
  },

  header: {
    marginBottom: "20px"
  },

  heading: {
    margin: 0
  },

  loading: {
    marginBottom: "20px",
    fontWeight: "bold"
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    backgroundColor: "#fff",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.1)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1500px"
  },

  th: {
    backgroundColor: "#1976d2",
    color: "white",
    padding: "12px",
    textAlign: "left",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #ddd"
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #ddd",
    whiteSpace: "nowrap",
    fontSize: "14px"
  },

  buttonContainer: {
    display: "flex",
    gap: "8px"
  },

  ewayBtn: {
    backgroundColor: "green",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },

  einvoiceBtn: {
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },

  noData: {
    textAlign: "center",
    padding: "20px",
    fontWeight: "bold"
  },

  productSection: {
    marginTop: "30px"
  }
};

export default EinvEwayfeildsDisplay;