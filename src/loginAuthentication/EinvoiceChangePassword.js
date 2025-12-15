// ChangePasswordForm.js - FULLY AUTO-POPULATED from Login Response
import React, { useState, useEffect } from 'react';

 const STORAGE_KEY = "iris_einvoice_response";

const EinvoiceChangePassword = () => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const [auth, setAuth] = useState({
    token: '',
    companyId: '',
    username: '',
    email: '',
    companyName: '',
    loaded: false
  });

  // Auto-load login data from shared storage (populated by LoginForm)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.token && data.companyId) {
          setAuth({
            token: data.token,
            companyId: data.companyId,
            username: data.username || 'User',
            email: data.email || '',
            companyName: data.companyName || 'Company',
            loaded: true
          });
        }
      } catch (e) {
        console.warn('Failed to parse login data');
      }
    }
  }, []);

  const handleChange = async () => {
    if (newPass !== confirmPass) {
      setResponse({ error: 'New passwords do not match!' });
      return;
    }
    if (newPass.length < 6) {
      setResponse({ error: 'New password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    setResponse(null);

    const payload = { oldPassword: oldPass, newPassword: newPass };

    try {
      const res = await fetch('http://localhost:3001/proxy/EIchange-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': auth.token,
          'companyId': auth.companyId,
          'product': 'ONYX'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const result = {
        status: res.status,
        body: data,
        time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      };
      setResponse(result);

      if (res.ok && data.status === 'SUCCESS') {
        alert('Password changed successfully!');
        setOldPass('');
        setNewPass('');
        setConfirmPass('');
      }
    } catch (err) {
      setResponse({ error: 'Network error or server unreachable' });
    } finally {
      setLoading(false);
    }
  };

  const isReady = auth.loaded && oldPass && newPass && confirmPass && newPass === confirmPass;

  return (
    <div style={{
      padding: '30px',
      background: '#fff3e0',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#e67e22', marginBottom: '10px', fontSize: '42px', textAlign: 'center' }}>
        Change Password
      </h1>
      <p style={{ color: '#666', fontSize: '18px', textAlign: 'center', marginBottom: '40px' }}>
        Securely update password for your IRIS GST ONYX account
      </p>

      {/* ==================== USER INFO CARD ==================== */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        maxWidth: '600px',
        margin: '0 auto 40px',
        border: '4px solid #f39c12'
      }}>
        <h2 style={{ color: '#d35400', margin: '0 0 20px 0', fontSize: '28px', textAlign: 'center' }}>
          Logged in as
        </h2>
        <div style={{ fontSize: '20px', lineHeight: '2' }}>
          <div><strong>User:</strong> {auth.username}</div>
          <div><strong>Email:</strong> {auth.email}</div>
          <div><strong>Company:</strong> {auth.companyName} (ID: {auth.companyId})</div>
          <div style={{ marginTop: '15px', padding: '15px', background: '#e8f5e9', borderRadius: '12px', fontFamily: 'monospace', fontSize: '14px', wordBreak: 'break-all' }}>
            <strong>Token Loaded:</strong> {auth.token ? auth.token.slice(0, 40) + '...' : 'Not loaded'}
          </div>
        </div>
      </div>

      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '24px',
        boxShadow: '0 16px 60px rgba(0,0,0,0.18)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>

        {/* ==================== AUTH STATUS ==================== */}
        <div style={{
          background: auth.loaded ? '#e8f5e9' : '#fadbd8',
          padding: '20px',
          borderRadius: '16px',
          border: '3px solid ' + (auth.loaded ? '#66bb6a' : '#e74c3c'),
          marginBottom: '30px',
          textAlign: 'left',
          fontSize: '20px',
          fontWeight: 'bold',
          color: auth.loaded ? '#2e7d32' : '#c0392b'
        }}>
          {auth.loaded 
            ? 'Authentication Loaded • Ready to Change Password' 
            : 'Not logged in • Please login first'}
        </div>

        {/* ==================== PASSWORD FIELDS ==================== */}
        <h2 style={{ color: '#e67e22', marginTop: '30px', fontSize: '28px' }}>Update Password</h2>

        <div style={{ margin: '35px 0', position: 'relative' }}>
          <strong style={{ fontSize: '18px' }}>Current Password:</strong>
          <div style={{ position: 'relative' }}>
            <input
              type={showOld ? 'text' : 'password'}
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              placeholder="Enter your current password"
              style={{
                width: '40%',
                padding:'10px 40px 10px 10px',
                marginTop: '10px',
                borderRadius: '14px',
                border: '3px solid #f39c12',
                fontSize: '18px',
                backgroundColor: '#fff8e1'
              }}
            />
            <button
              onClick={() => setShowOld(!showOld)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-30%)',
                background: 'none',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                color: '#d35400'
              }}
            >
              {showOld ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div style={{ margin: '35px 0', position: 'relative' }}>
          <strong style={{ fontSize: '18px' }}>New Password:</strong>
          <div style={{ position: 'relative' }}>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
              style={{
                width: '40%',
                padding: '10px 40px 10px 10px',
                marginTop: '10px',
                borderRadius: '14px',
                border: '3px solid #f39c12',
                fontSize: '18px',
                backgroundColor: '#fff8e1'
              }}
            />
            <button
              onClick={() => setShowNew(!showNew)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-30%)',
                background: 'none',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                color: '#d35400'
              }}
            >
              {showNew ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div style={{ margin: '35px 0', position: 'relative' }}>
          <strong style={{ fontSize: '18px' }}>Confirm New Password:</strong>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Re-type new password"
              style={{
                width: '40%',
                padding: '10px 40px 10px 10px',
                marginTop: '10px',
                borderRadius: '14px',
                border: newPass && confirmPass && newPass !== confirmPass ? '3px solid #e74c3c' : '3px solid #f39c12',
                fontSize: '18px',
                backgroundColor: '#fff8e1'
              }}
            />
            <button
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-30%)',
                background: 'none',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                color: '#d35400'
              }}
            >
              {showConfirm ? 'Hide' : 'Show'}
            </button>
          </div>
          {newPass && confirmPass && newPass !== confirmPass && (
            <div style={{ color: '#c0392b', fontSize: '14px', marginTop: '8px' }}>
              Passwords do not match
            </div>
          )}
        </div>

        <button
          onClick={handleChange}
          disabled={loading || !isReady}
          style={{
            width: '40%',
            padding: '20px',
            marginTop: '20px',
            background: (!isReady || loading) ? '#999' : '#e67e22',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: (!isReady || loading) ? 'not-allowed' : 'pointer',
            boxShadow: '0 16px 60px rgba(230,126,34,0.5)',
            transition: 'all 0.3s'
          }}
        >
          {loading ? 'Changing Password...' : 'CHANGE PASSWORD'}
        </button>

        {/* ==================== RESPONSE ==================== */}
        {response && (
          <div style={{ marginTop: '60px' }}>
            <h2 style={{
              color: response.body?.status === 'SUCCESS' ? '#2e7d32' : '#c0392b',
              borderBottom: '4px solid ' + (response.body?.status === 'SUCCESS' ? '#66bb6a' : '#e74c3c'),
              paddingBottom: '12px',
              fontSize: '28px'
            }}>
              RESPONSE ({response.time || 'Now'} IST)
            </h2>
            <pre style={{
              background: '#1e1e1e',
              color: response.body?.status === 'SUCCESS' ? '#69f0ae' : '#e74c3c',
              padding: '35px',
              borderRadius: '18px',
              fontSize: '16px',
              marginTop: '25px',
              border: '3px solid ' + (response.body?.status === 'SUCCESS' ? '#66bb6a' : '#e74c3c'),
              whiteSpace: 'pre-wrap'
            }}>
              {JSON.stringify(response.body || response, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <footer style={{
        marginTop: '90px',
        textAlign: 'center',
        color: '#888',
        fontSize: '16px'
      }}>
        IRIS GST ONYX • Change Password • November 17, 2025 • {new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </footer>
    </div>
  );
};

export default EinvoiceChangePassword;