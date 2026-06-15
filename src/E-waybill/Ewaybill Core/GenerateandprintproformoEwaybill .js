import React, { useState} from "react";
import { useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
/* ---------------------------
   LocalStorage keys
--------------------------- */
const STORAGE_KEY00 = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

/* ---------------------------
   Utils
--------------------------- */
const safeParse = (v, fallback = {}) => {
  try {
    return JSON.parse(v ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
};

const getLS = (k, fb = {}) => safeParse(localStorage.getItem(k), fb);
const setLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));
/* ---------------------------
   Component
--------------------------- */
const GenerateandprintproformoEwaybill  = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false); // ✅ FIX HERE
  // =========================
  // RECEIVED DATA
  // =========================
  const receivedData = location.state || {};
  const invoiceData = receivedData.invoiceData || {};
  const dynamicId = receivedData.id || invoiceData.pid;

  console.log("Received Data:", receivedData);
  console.log("invoiceData:", invoiceData);

  // =========================
  // DEFAULT FORM
  // =========================
  const DEFAULT_FORM = {
    supplyType: "O",
    subSupplyType: "1",
    docType: "INV",

    docNo: invoiceData?.invoiceNumber || invoiceData?.billNo || "Topaz340290",

    invType: "B2B",

    docDate: new Date().toLocaleDateString("en-GB"),

    transactionType: 1,

    fromGstin: invoiceData?.companyGstin || "05AAAAU1183B5ZW",
    fromTrdName: invoiceData?.companyName || "ABC",

    dispatchFromGstin: invoiceData?.companyGstin || "05AAAAU1183B5ZW",
    dispatchFromTradeName: invoiceData?.companyName || "PQR",

    fromAddr1: invoiceData?.companyAddress || "T231",
    fromAddr2: invoiceData?.companyAddress2 || "IIP",
    fromPlace: invoiceData?.companyCity || "Akodiya",
    fromPincode: invoiceData?.companyPincode || 248001,
    fromStateCode: invoiceData?.companyStateCode || 5,

    toGstin: invoiceData?.clientGstin || "05AAAAU1183B1Z0",
    toTrdName: invoiceData?.clientCompanyName || receivedData?.invoiceData?.clientCompanyName || "",
    toAddr1: invoiceData?.clientAddress1 || "S531",
    toAddr2: invoiceData?.clientAddress2 || "MG Road",
    toPlace: invoiceData?.clientCity || "Dehradun",
    toPincode: invoiceData?.clientPincode || 248002,
    toStateCode: invoiceData?.clientStateCode || 5,

    totInvValue: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.afterGSTAmount || 21000,
    totalValue: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.totalAmount || 20000,
    cgstValue: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.cgstAmount || 500,
    sgstValue: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.sgstAmount || 500,
    igstValue: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.igstAmount || 0,

    cessValue: 0,
    cessNonAdvolValue: 0,
    otherValue: 0,

    transMode: 1,
    transDistance: 10,
    transDocNo: "1212",
    transDocDate: new Date().toLocaleDateString("en-GB"),

    transporterId: invoiceData?.transporterId || "05AAAAU1183B1Z0",
    transporterName: invoiceData?.transporterName || "ACVDF",

    vehicleNo: invoiceData?.vehicleNo || receivedData?.invoiceData?.vehicleNo || "RJ14CA9999",
    vehicleType: "R",

    actFromStateCode: invoiceData?.companyStateCode || "5",
    actToStateCode: invoiceData?.clientStateCode || "5",

    itemList: [
      {
        productName: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.itemName || "",
        productDesc: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.description || "",
        hsnCode: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.hsncode || "",

        quantity: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.quantity || 1,
        qtyUnit: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.uom || "",

        taxableAmount: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.totalAmount || 20000,

        sgstRate: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.sgstPer || 2.5,
        cgstRate: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.cgstPer || 2.5,
        igstRate: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.igstPer || 0,

        iamt: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.igstAmount || 0,
        camt: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.cgstAmount || 500,
        samt: receivedData?.invoiceData?.invoiceProductDetails?.[0]?.sgstAmount || 500,

        csamt: 0,
        txp: "T",
      },
    ],

    companyId: "",
    userGstin: invoiceData?.companyGstin || "05AAAAU1183B5ZW",
    forceDuplicateCheck: true,
  };

  // =========================
  // STATE
  // =========================
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState("");

  // =========================
  // FETCH INVOICE
  // =========================
  useEffect(() => {
    if (!dynamicId) return;
    fetchInvoiceData();
  }, [dynamicId]);

  const fetchInvoiceData = async () => {
    try {
      setLoadingInvoice(true);

      const res = await axios.get(
        `https://einvoice.fcssoftwares.com/api/gst/ewaybill/generate/${dynamicId}`
      );
    console.log("response",res)
      const apiData = res.data?.data;
      const invoice = apiData?.response || apiData || {};
      const item = invoice?.invoiceProductDetails?.[0] || {};

      // =========================
      // MERGE FORM DATA (FIX HERE)
      // =========================
      const mergedForm = {
        ...DEFAULT_FORM,

        docNo: invoice?.invoiceNumber || invoice?.billNo || DEFAULT_FORM.docNo,
        fromGstin: invoice?.companyGstin || DEFAULT_FORM.fromGstin,
        fromTrdName: invoice?.companyName || DEFAULT_FORM.fromTrdName,

        toGstin: invoice?.clientGstin || DEFAULT_FORM.toGstin,
        toTrdName:
          invoice?.clientCompanyName ||
          receivedData?.invoiceData?.clientCompanyName ||
          DEFAULT_FORM.toTrdName,

        vehicleNo:
          invoice?.vehicleNo ||
          receivedData?.invoiceData?.vehicleNo ||
          DEFAULT_FORM.vehicleNo,

        totInvValue: item?.afterGSTAmount || DEFAULT_FORM.totInvValue,
        totalValue: item?.totalAmount || DEFAULT_FORM.totalValue,
        cgstValue: item?.cgstAmount || DEFAULT_FORM.cgstValue,
        sgstValue: item?.sgstAmount || DEFAULT_FORM.sgstValue,
        igstValue: item?.igstAmount || DEFAULT_FORM.igstValue,

        itemList: [
          {
            ...DEFAULT_FORM.itemList[0],
            productName: item?.itemName || "",
            productDesc: item?.description || "",
            hsnCode: item?.hsncode || "",
            quantity: item?.quantity || 1,
            qtyUnit: item?.uom || "",
            taxableAmount: item?.totalAmount || 0,
            iamt: item?.igstAmount || 0,
            camt: item?.cgstAmount || 0,
            samt: item?.sgstAmount || 0,
          },
        ],
      };

      setFormData(mergedForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingInvoice(false);
    }
  };

  // =========================
  // GENERATE EWB
  // =========================
  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:3001/proxy/topaz/ewb/generate",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setApiResponse(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>EWB Generator</h1>
    </div>
  );
};

export default GenerateandprintproformoEwaybill ;
