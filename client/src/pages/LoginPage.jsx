import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider.jsx';
import { useToast } from '../context/ToastProvider.jsx';
import API from '../utils/api.js';

function LoginPage({ goRegister }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data } = await API.post('/auth/login', form);
      login(data.token, data.user);
      toast(`Welcome back, ${data.user.name}`);
    } catch (err) {
      toast(err.response?.data?.message || 'Authentication failed', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #00d4ff, #0099bb)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px', boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}>🛡</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: 4, color: 'var(--accent)', textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>UBlock</div>
          <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 3, marginTop: 4 }}>EVIDENCE PROTECTION SYSTEM</span>
        </div>
        <h2 className="auth-title">Secure Access</h2>
        <p className="auth-sub">Authorized personnel only. All access is monitored and logged.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Officer Email</label>
            <input className="form-control" type="email" placeholder="badge@department.gov" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 14, marginTop: 8 }}>
            {loading ? 'Authenticating...' : '🔐  Authenticate'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 24, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          No account?{' '}
          <button onClick={goRegister} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>REQUEST ACCESS →</button>
        </div>
        <div style={{ marginTop: 28, padding: '12px 16px', background: 'rgba(255,82,82,0.05)', border: '1px solid rgba(255,82,82,0.15)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>
          ⚠ UNAUTHORIZED ACCESS IS A FEDERAL OFFENSE
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
