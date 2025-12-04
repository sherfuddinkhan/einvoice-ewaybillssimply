import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'iris_ewaybill_shared_config';

/* -------------------------- COLORS -------------------------- */
const colors = {
    primary: '#1A73E8',
    primaryDark: '#0B4F9C',
    primaryLight: '#E8F0FE',
    success: '#34A853',
    danger: '#EA4335',
    background: '#F5F5F7',
    cardBackground: '#FFFFFF',
    textDark: '#333333',
    textLight: '#707070',
    codeBg: '#263238',
    codeText: '#A8FFBF',
};

/* -------------------------- STYLES -------------------------- */
const styles = {
    container: {
        padding: '40px',
        background: colors.background,
        minHeight: '100vh',
        fontFamily: 'Roboto, Arial, sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        background: colors.cardBackground,
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        width: '450px',
    },
    header: {
        textAlign: 'center',
        color: colors.primaryDark,
        fontSize: '32px',
        marginBottom: '30px',
        fontWeight: 500,
    },
    label: {
        fontWeight: 600,
        color: colors.textDark,
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
    },
    input: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: `1px solid ${colors.textLight}`,
        fontSize: '16px',
        marginBottom: '20px',
    },
    btnPrimary: (loading) => ({
        width: '100%',
        padding: '15px',
        background: loading ? '#BDBDBD' : colors.primary,
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
        fontSize: '20px',
        marginTop: '20px',
        transition: 'all 0.3s',
        boxShadow: loading ? 'none' : `0 4px 15px rgba(26, 115, 232, 0.3)`,
    }),
    btnProceed: {
        width: '100%',
        padding: '12px',
        background: colors.success,
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '16px',
        marginTop: '20px',
    },
    responseBox: (status) => ({
        marginTop: '30px',
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: status === 'SUCCESS' ? colors.success + '1A' : colors.danger + '1A',
        border: `2px solid ${status === 'SUCCESS' ? colors.success : colors.danger}`,
    }),
    codeBox: {
        background: colors.codeBg,
        color: colors.codeText,
        padding: '10px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        marginTop: '10px',
        border: `1px solid ${colors.primaryDark}`,
        fontSize: '13px',
    },
};

/* ============================================================
   EWB LOGIN (TOPAZ)
   ============================================================ */
const EWayBillLoginPage = () => {
    const [email, setEmail] = useState('eway@gmail.com');
    const [password, setPassword] = useState('Abcd@12345');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const endpoint = "http://localhost:3001/proxy/ewaybill/login";

    const handleLogin = async () => {
        setLoading(true);
        setResponse(null);

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            setResponse(data);

            if (data.status === "SUCCESS" && data.response?.token) {
                const token = data.response.token;
                const companyId = data.response.companyId;

                login(token);

                const updatedStore = {
                    token,
                    companyId,
                    email,
                    fullResponse: data,
                    product: "TOPAZ",
                    lastLogin: new Date().toISOString(),
                };

                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStore));
                setLoginSuccess(true);
            }
        } catch (err) {
            setResponse({ status: "ERROR", message: err.message });
        }

        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.header}>🔓 TOPAZ E-Way Bill Login</h2>

                <label style={styles.label}>Email</label>
                <input
                    style={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <label style={styles.label}>Password</label>
                <input
                    type="password"
                    style={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    style={styles.btnPrimary(loading)}
                    disabled={loading}
                    onClick={handleLogin}
                >
                    {loading ? "Logging In..." : "LOGIN & SHOW RESPONSE"}
                </button>

                {response && (
                    <div style={styles.responseBox(response.status)}>
                        <h3 style={{ color: response.status === "SUCCESS" ? colors.success : colors.danger }}>
                            Status: {response.status}
                        </h3>

                        <pre style={styles.codeBox}>
                            {JSON.stringify(response, null, 2)}
                        </pre>

                        {loginSuccess && (
                            <button
                                style={styles.btnProceed}
                                onClick={() => navigate("/ewb-generate-print")}
                            >
                                Proceed
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EWayBillLoginPage;
