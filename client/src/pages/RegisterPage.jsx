import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider.jsx';
import { useToast } from '../context/ToastProvider.jsx';
import API from '../utils/api.js';


function RegisterPage({ goLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'investigator', badgeNumber: '', department: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await API.post('/auth/register', form);
      login(data.token, data.user);
      toast('Account created successfully');
    } catch (err) {
      console.log(err);
      toast(err.response?.data?.message || 'Registration failed', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <div className="auth-logo">
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #00d4ff, #0099bb)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px', boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}>🛡</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: 4, color: 'var(--accent)' }}>UBlock</div>
          <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 3, marginTop: 4 }}>EVIDENCE PROTECTION SYSTEM</span>
        </div>
        <h2 className="auth-title">Request Access</h2>
        <p className="auth-sub">Complete your officer profile to gain system access.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-control" placeholder="Det. John Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Badge Number</label><input className="form-control" placeholder="B-4821" value={form.badgeNumber} onChange={e => setForm({ ...form, badgeNumber: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Official Email</label><input className="form-control" type="email" placeholder="name@department.gov" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Department</label><input className="form-control" placeholder="Homicide Division" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
            <div className="form-group">
              <label className="form-label">Access Level</label>
              <select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="viewer">Viewer</option>
                <option value="investigator">Investigator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Password</label><input className="form-control" type="password" placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} /></div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 14, marginTop: 8 }}>
            {loading ? 'Creating Account...' : '✦  Create Secure Account'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <button onClick={goLogin} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>SIGN IN →</button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
