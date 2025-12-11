import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

/* -----------------------------------------------------
 * 1. Constants and Utilities (No change needed here, keeping for completeness)
 * ----------------------------------------------------- */

const STORAGE_KEY = 'iris_ewaybill_shared_config';
const LATEST_EWB_KEY = 'latestEwbData';
const EWB_HISTORY_KEY = 'ewbHistory';
const BASE_URL = 'http://localhost:3001/proxy/topaz/ewb';
const PRODUCT_NAME = 'TOPAZ';
console.log("STORAGE_KEY",STORAGE_KEY)

// --- Styling ---
const COLORS = {
    primary: '#1A73E8',
    success: '#34A853',
    danger: '#EA4335',
    background: '#F5F5F7',
    warning: '#FBBC05',
};

const containerStyle = {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    background: COLORS.background,
    borderRadius: '10px',
};

const previewBox = {
    margin: '30px 0',
    padding: '20px',
    background: '#f1f2f6',
    borderRadius: '10px',
    border: `1px solid ${COLORS.primary}`,
};

const sectionHeaderStyle = {
    color: COLORS.primary, 
    borderBottom: `2px solid ${COLORS.primary}`, 
    paddingBottom: '5px', 
    marginTop: '30px'
};

const formGroupStyle = { 
    margin: '10px 0', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '15px' 
};

const labelStyle = { 
    width: '220px', 
    fontWeight: 'bold', 
    minWidth: '150px' 
};

const inputStyle = { 
    flex: 1, 
    padding: '8px', 
    borderRadius: '4px', 
    border: '1px solid #ccc' 
};

// --- EWB Data Structures ---
const DEFAULT_ITEM = {
    productName: "Sugar", productDesc: "Sugar", hsnCode: "8517", quantity: 10, qtyUnit: "KGS",
    taxableAmount: 20000.00, sgstRate: 2.50, cgstRate: 2.50, igstRate: 0.00, cessRate: 0.00,
    cessNonAdvol: 0.00, iamt: 0.00, camt: 500.00, samt: 500.00, csamt: 0.00, txp: "T"
};

const DEFAULT_FORM = {
    supplyType: "O", subSupplyType: "1", docType: "INV", docNo: "Topaz340290", invType: "B2B",
    docDate: "15/11/2025", transactionType: 1, fromGstin: "", fromTrdName: "ABC",
    dispatchFromGstin: "", dispatchFromTradeName: "PQR", fromAddr1: "T231", fromAddr2: "IIP",
    fromPlace: "Akodiya", fromPincode: 248001, fromStateCode: 5, toGstin: "05AAAAU1183B1Z0",
    toTrdName: "RJ-Rawat Foods", toAddr1: "S531, SSB Towers", toAddr2: "MG Road",
    toPlace: "Dehradun", toPincode: 248002, toStateCode: 5, totInvValue: 21000.00,
    totalValue: 20000.00, cgstValue: 500.00, sgstValue: 500.00, igstValue: 0.00, cessValue: 0.00,
    cessNonAdvolValue: 0.00, otherValue: 0.00, transMode: 1, transDistance: 10,
    transDocDate: "15/11/2025", transDocNo: "1212", transporterId: "", transporterName: "ACVDF",
    vehicleNo: "RJ14CA9999", vehicleType: "R", actFromStateCode: "5", actToStateCode: "5",
    itemList: [DEFAULT_ITEM], companyId: "", userGstin: "", forceDuplicateCheck: true
};

// --- Local Storage & Auth Utils ---
const safeParse = (v, fallback = {}) => {
    try {
        return JSON.parse(v || 'null') ?? fallback;
    } catch (e) {
        console.error("Parsing failed:", e);
        return fallback;
    }
};

const getAuthDetails = () => {
    const login = safeParse(localStorage.getItem(STORAGE_KEY), {});
    const token = login?.token || login?.fullResponse?.response?.token || '';
    const companyId = login?.companyId || login?.fullResponse?.response?.companyId || '';
    const userGstin = login?.userGstin || login?.fullResponse?.response?.userGstin || login?.fullResponse?.response?.user?.gstin || '';
    
    return { token, companyId, userGstin };
};

const getAuthHeaders = (token, companyId) => ({
    "X-Auth-Token": token,
    companyId: companyId,
    product: PRODUCT_NAME,
    "Content-Type": "application/json",
});

/* -----------------------------------------------------
 * 2. Component: EwbGenerateAndPrint (The combined component)
 * ----------------------------------------------------- */

const EwbGenerateAndPrint = () => {
    // --- Generation State ---
    const [formData, setFormData] = useState(DEFAULT_FORM);
    const [authData] = useState(getAuthDetails()); // Using a stable reference is fine
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [apiResponse, setApiResponse] = useState(null);
    const [activeTab, setActiveTab] = useState('doc'); // New state for tabs

    // --- Printing State ---
    const [ewbNosInput, setEwbNosInput] = useState('');
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState('');
    const [pdfMessage, setPdfMessage] = useState('');

    // --- Tab Data Mapping ---
    const tabSections = {
        'doc': {
            title: 'Document & Supply Details',
            fields: ['supplyType', 'subSupplyType', 'docType', 'docNo', 'invType', 'docDate', 'transactionType', 'forceDuplicateCheck']
        },
        'from': {
            title: 'Supplier (From) Details',
            fields: ['fromGstin', 'fromTrdName', 'fromAddr1', 'fromAddr2', 'fromPlace', 'fromPincode', 'fromStateCode', 'dispatchFromGstin', 'dispatchFromTradeName']
        },
        'to': {
            title: 'Recipient (To) Details',
            fields: ['toGstin', 'toTrdName', 'toAddr1', 'toAddr2', 'toPlace', 'toPincode', 'toStateCode']
        },
        'value': {
            title: 'Value & Tax Details',
            fields: ['totInvValue', 'totalValue', 'cgstValue', 'sgstValue', 'igstValue', 'cessValue', 'cessNonAdvolValue', 'otherValue']
        },
        'transport': {
            title: 'Transport Details',
            fields: ['transMode', 'transDistance', 'transDocDate', 'transDocNo', 'transporterId', 'transporterName', 'vehicleNo', 'vehicleType', 'actFromStateCode', 'actToStateCode']
        }
    };


    // --- Initial Setup (Auth & Form Pre-fill) ---
    useEffect(() => {
        const { companyId, userGstin } = authData;

        // Pre-fill form details from auth data
        setFormData(prev => ({
            ...prev,
            companyId,
            userGstin,
            fromGstin: userGstin || prev.fromGstin,
            dispatchFromGstin: userGstin || prev.dispatchFromGstin,
            // Only set transporterId if it's currently empty, otherwise user may have a custom ID
            transporterId: prev.transporterId || userGstin, 
        }));

        // Set initial EWB number for printing if one exists in local storage
        const latestEwb = safeParse(localStorage.getItem(LATEST_EWB_KEY), {}).ewbNo;
        if (latestEwb) {
            setEwbNosInput(latestEwb.toString());
        }
    }, [authData]);

    // --- Local Storage Logic (Keeping original logic) ---
    const saveToLocalStorage = useCallback((fullResponse) => {
        const resp = fullResponse.response || {};
        const ewbData = {
            generatedAt: new Date().toISOString(),
            ewbNo: resp.ewbNo || resp.ewb_number || null,
            validUpto: resp.validUpto || null,
            fullApiResponse: fullResponse,
            payloadUsed: formData,
        };

        localStorage.setItem(LATEST_EWB_KEY, JSON.stringify(ewbData));
        setEwbNosInput(ewbData.ewbNo.toString());
        
        const rawHistory = safeParse(localStorage.getItem(EWB_HISTORY_KEY), []);
        const deduped = rawHistory.filter(h => h.ewbNo !== ewbData.ewbNo);
        deduped.unshift(ewbData);
        if (deduped.length > 20) deduped.pop();
        localStorage.setItem(EWB_HISTORY_KEY, JSON.stringify(deduped));
    }, [formData]);

    // --- Form Handlers (Keeping original logic) ---
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    }, []);

    const handleItemChange = useCallback((index, e) => {
        const { name, value, type } = e.target;
        setFormData(prev => {
            const newItems = [...prev.itemList];
            // Convert to number for numerical fields
            const finalValue = type === 'number' ? parseFloat(value) || 0 : value;
            newItems[index] = { ...newItems[index], [name]: finalValue };
            return { ...prev, itemList: newItems };
        });
    }, []);

    const addItem = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            itemList: [...prev.itemList, DEFAULT_ITEM]
        }));
    }, []);

    const removeItem = useCallback((index) => {
        setFormData(prev => ({ 
            ...prev, 
            itemList: prev.itemList.filter((_, i) => i !== index) 
        }));
    }, []);

    // --- EWB Generation (Submit) Logic (Keeping original logic) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setApiResponse(null);

        const { token, companyId } = authData;

        if (!token || !companyId) {
            setError("Authentication details (token/companyId) are missing. Please log in.");
            setLoading(false);
            return;
        }

        const headers = getAuthHeaders(token, companyId);
        
        try {
            const res = await axios.post(
                `${BASE_URL}/generate`,
                formData,
                { headers }
            );

            if (res.data?.status === "SUCCESS" && res.data?.response) {
                setApiResponse(res.data);
                saveToLocalStorage(res.data);
            } else {
                throw new Error(res.data?.message || res.data?.error || "E-Way Bill generation failed");
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown API error';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // --- EWB Printing (PDF Download) Logic (Keeping original logic) ---
    const ewbNosArray = ewbNosInput
        .split(',')
        .map(n => n.trim())
        .filter(n => n);

    const handleDownloadPDF = async (e) => {
        e.preventDefault();
        setPdfLoading(true);
        setPdfError('');
        setPdfMessage('');

        if (ewbNosArray.length === 0) {
            setPdfError('No EWB number available to print.');
            setPdfLoading(false);
            return;
        }
        
        const { token, companyId } = authData;
        if (!token || !companyId) {
            setPdfError("Authentication details are missing. Cannot download PDF.");
            setPdfLoading(false);
            return;
        }

        const headers = { ...getAuthHeaders(token, companyId), Accept: "application/pdf" };
        const payload = { ewbNo: ewbNosArray };

        try {
            const res = await axios.post(
                `${BASE_URL}/printDetails`,
                payload,
                { headers, responseType: 'blob' }
            );

            if (res.data.type !== 'application/pdf') {
                const errorText = await new Response(res.data).text();
                const errorJson = safeParse(errorText, { message: 'Print request failed unexpectedly.' });
                throw new Error(errorJson.message || 'Print failed: non-PDF response received.');
            }

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            
            const filename = ewbNosArray.length === 1 
                ? `EWB-${ewbNosArray[0]}.pdf` 
                : `EWB_Batch_${new Date().toISOString().slice(0, 10)}.pdf`;
                
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            
            link.remove();
            window.URL.revokeObjectURL(url);

            setPdfMessage(`PDF for EWB(s) ${ewbNosArray.join(', ')} downloaded successfully.`);
        } catch (err) {
            setPdfError(err.message || 'Print failed due to an unexpected error.');
        } finally {
            setPdfLoading(false);
        }
    };

    const generatedEwbNo = apiResponse?.response?.ewbNo;

    // --- Render ---
    return (
        <div style={containerStyle}>
            <h1 style={{ textAlign: 'center', color: COLORS.primary }}>📝 Generate & Print E-Way Bill</h1>

            {/* Request Preview */}
            <div style={previewBox}>
                <h2>🔍 Request Preview</h2>
                {/* Authorization Preview */}
                <h3 style={{ marginTop: 15 }}>Headers (Key Auth Data)</h3>
                <pre style={{ background: '#dfe4ea', padding: 15, borderRadius: 8, overflowX: 'auto', fontSize: 14 }}>
                    {JSON.stringify({ 
                        "X-Auth-Token": authData.token ? "Present" : "Missing", 
                        companyId: authData.companyId || "Missing", 
                        product: PRODUCT_NAME 
                    }, null, 2)}
                </pre>
            </div>
            
            <hr/>

            {/* Generation Form */}
            <form onSubmit={handleSubmit}>
                {/* Tabs Navigation */}
                <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '2px solid #ccc' }}>
                    {Object.entries(tabSections).map(([key, section]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key)}
                            style={{
                                padding: '10px 15px',
                                border: 'none',
                                borderBottom: activeTab === key ? `3px solid ${COLORS.primary}` : 'none',
                                background: activeTab === key ? '#E0E7FF' : 'transparent',
                                color: activeTab === key ? COLORS.primary : '#555',
                                fontWeight: activeTab === key ? 'bold' : 'normal',
                                cursor: 'pointer',
                                transition: 'all 0.1s'
                            }}
                        >
                            {section.title}
                        </button>
                    ))}
                     <button
                        type="button"
                        onClick={() => setActiveTab('items')}
                        style={{
                            padding: '10px 15px',
                            border: 'none',
                            borderBottom: activeTab === 'items' ? `3px solid ${COLORS.primary}` : 'none',
                            background: activeTab === 'items' ? '#E0E7FF' : 'transparent',
                            color: activeTab === 'items' ? COLORS.primary : '#555',
                            fontWeight: activeTab === 'items' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            transition: 'all 0.1s'
                        }}
                    >
                        Item List
                    </button>
                </div>

                {/* Tab Content */}
                <div style={{ padding: '15px' }}>
                    {/* Render fields for the active tab */}
                    {Object.entries(tabSections).map(([key, section]) => (
                        activeTab === key && (
                            <div key={key}>
                                <h2 style={sectionHeaderStyle}>{section.title}</h2>
                                {section.fields.map(fieldKey => {
                                    const isCheckbox = fieldKey === 'forceDuplicateCheck';
                                    return (
                                        <div key={fieldKey} style={formGroupStyle}>
                                            <label style={labelStyle}>{fieldKey}:</label>
                                            {isCheckbox ? (
                                                <input
                                                    type="checkbox"
                                                    name={fieldKey}
                                                    checked={formData[fieldKey]}
                                                    onChange={handleChange}
                                                    style={{ width: 'auto' }}
                                                    disabled={loading}
                                                />
                                            ) : (
                                                <input
                                                    name={fieldKey}
                                                    value={formData[fieldKey] ?? ''}
                                                    type={['Date', 'Value', 'Distance'].some(s => fieldKey.includes(s)) ? 'number' : 'text'}
                                                    onChange={handleChange}
                                                    style={inputStyle}
                                                    disabled={loading}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ))}

                    {/* Item List Tab */}
                    {activeTab === 'items' && (
                        <div>
                            <h2 style={sectionHeaderStyle}>📦 Item List</h2>
                            {formData.itemList.map((item, idx) => (
                                <div key={idx} style={{ border: `2px dashed ${COLORS.primary}`, padding: 15, margin: '15px 0', borderRadius: 8, background: '#ecf0f1' }}>
                                    <h4 style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        Item #{idx + 1}
                                        {formData.itemList.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeItem(idx)} 
                                                style={{ padding: '6px 12px', background: COLORS.danger, color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                                                Remove
                                            </button>
                                        )}
                                    </h4>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                                        {Object.keys(DEFAULT_ITEM).map(attr => (
                                            <div key={attr} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <label style={{ width: 100, fontWeight: 'bold', fontSize: '13px' }}>{attr}:</label>
                                                <input
                                                    name={attr}
                                                    value={item[attr] ?? ''}
                                                    type={['quantity', 'Amount', 'Rate', 'Value'].some(s => attr.includes(s)) ? 'number' : 'text'}
                                                    onChange={(e) => handleItemChange(idx, e)}
                                                    style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
                                                    disabled={loading}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <button 
                                type="button" 
                                onClick={addItem} 
                                style={{ padding: '12px 24px', background: COLORS.warning, color: 'white', border: 'none', borderRadius: 6, margin: '15px 0' }}>
                                + Add New Item
                            </button>
                        </div>
                    )}
                </div>
                
                <hr style={{ marginTop: 30 }}/>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '18px',
                        fontSize: 20,
                        background: loading ? '#95a5a6' : COLORS.success,
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Generating E-Way Bill...' : 'Generate E-Way Bill'}
                </button>
            </form>

            {/* Error Display */}
            {error && <p style={{ marginTop: 20, color: COLORS.danger, fontWeight: 'bold' }}>❌ Generation Error: {error}</p>}

            {/* API Response & Print Section */}
            {apiResponse && apiResponse.status === "SUCCESS" && (
                <>
                    <div style={{ marginTop: 50, padding: 30, background: '#f8f9fa', border: `3px solid ${COLORS.success}`, borderRadius: 12 }}>
                        <h2 style={{ textAlign: 'center', color: COLORS.success }}>🎉 E-Way Bill Generated Successfully!</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 15, margin: '20px 0', fontSize: 16 }}>
                            <div><strong>EWB No:</strong> <span style={{ fontSize: 22, color: COLORS.primary, fontWeight: 'bold' }}>{generatedEwbNo}</span></div>
                            <div><strong>Valid Upto:</strong> <span style={{ color: COLORS.danger }}>{apiResponse.response.validUpto}</span></div>
                            <div><strong>Status:</strong> <span style={{ color: COLORS.success, fontWeight: 'bold' }}>{apiResponse.response.status}</span></div>
                        </div>
                        <details style={{ padding: 15, background: '#fff', borderRadius: 8 }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Full API Response (Click to Expand)</summary>
                            <pre style={{ overflowX: 'auto', marginTop: 10 }}>{JSON.stringify(apiResponse, null, 2)}</pre>
                        </details>
                    </div>

                    {/* Printing Section */}
                    <div style={{ maxWidth: '600px', margin: '30px auto', padding: 20, border: '1px solid #ccc', borderRadius: '8px', background: '#fff' }}>
                        <h2 style={{ color: COLORS.primary }}>📥 Download EWB PDF</h2>
                        <p style={{ marginBottom: 15 }}>Enter EWB numbers below (comma-separated if multiple):</p>
                        
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                placeholder="EWB Nos (e.g., 1234567890, 1234567891)"
                                value={ewbNosInput}
                                onChange={(e) => setEwbNosInput(e.target.value)}
                                required
                                style={{ flex: 1, padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
                            />
                            <button
                                onClick={handleDownloadPDF}
                                disabled={pdfLoading || ewbNosArray.length === 0 || !authData.token || !authData.companyId}
                                style={{
                                    padding: '10px 20px',
                                    background: (pdfLoading || ewbNosArray.length === 0) ? '#95a5a6' : COLORS.primary,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: (pdfLoading || ewbNosArray.length === 0) ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                }}
                            >
                                {pdfLoading ? 'Downloading...' : 'Download PDF'}
                            </button>
                        </div>

                        {pdfError && <p style={{ color: COLORS.danger, marginTop: 10 }}>🚨 {pdfError}</p>}
                        {pdfMessage && <p style={{ color: COLORS.success, marginTop: 10 }}>✅ {pdfMessage}</p>}
                    </div>
                </>
            )}
        </div>
    );
};

export default EwbGenerateAndPrint;