// src/components/EinvoiceLogin.js
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'iris_einvoice_shared_config';

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
    }),
    btnProceed: {
        width: '100%',
        padding: '15px',
        background: colors.success,
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '18px',
        marginTop: '25px',
    },
    responseBox: (status) => ({
        marginTop: '30px',
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: status === 'SUCCESS' ? colors.success + '1A' : colors.danger + '1A',
        border: `2px solid ${status === 'SUCCESS' ? colors.success : colors.danger}`,
    }),
    codeBox: () => ({
        background: colors.codeBg,
        color: colors.codeText,
        padding: '10px',
        borderRadius: '4px',
        whiteSpace: 'pre-wrap',
        marginTop: '10px',
        fontSize: '13px',
    }),
};

const EInvoiceLoginPage = () => {
    const [email, setEmail] = useState('ateeq@calibrecue.com');
    const [password, setPassword] = useState('Abcd@1234567');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async () => {
        setLoading(true);
        setResponse(null);

        try {
            const res = await fetch("http://localhost:3001/proxy/einvoice/login", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            setResponse(data);

            if (data.status === 'SUCCESS' && data.response?.token) {
                const token = data.response.token;
                const companyId = data.response.companyId || '24';

                login(token);

                const newConfig = {
                    token,
                    companyId,
                    lastLogin: new Date().toISOString(),
                };

                localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
                setLoginSuccess(true);
            }

        } catch (err) {
            setResponse({ status: 'ERROR', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleProceed = () => {
        navigate("/einvoice-generate-print");
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.header}>🔓 API Gateway Login</h2>

                {/* Email */}
                <label style={styles.label}>Email</label>
                <input
                    type="email"
                    style={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                {/* Password */}
                <label style={styles.label}>Password</label>
                <input
                    type="password"
                    style={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button 
                    onClick={handleLogin} 
                    disabled={loading}
                    style={styles.btnPrimary(loading)}
                >
                    {loading ? "Logging In..." : "LOGIN & SHOW RESPONSE"}
                </button>

                {response && (
                    <div style={styles.responseBox(response.status)}>
                        <h3>Status: {response.status}</h3>

                        <pre style={styles.codeBox()}>
                            {JSON.stringify(response, null, 2)}
                        </pre>

                        {/* ✅ Show Proceed Button Only on Success */}
                        {loginSuccess && (
                            <button onClick={handleProceed} style={styles.btnProceed}>
                                PROCEED ➜ Generate / Print E-Invoice
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EInvoiceLoginPage;
