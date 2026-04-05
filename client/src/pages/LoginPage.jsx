import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider.jsx';
import { useToast } from '../context/ToastProvider.jsx';
import API from '../utils/api.js';
import FaceCapture from '../components/FaceCapture.jsx';

function LoginPage({ goRegister }) {
  const [mode,    setMode]    = useState('password'); // 'password' | 'face'
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showCam, setShowCam] = useState(false);
  const { login } = useAuth();
  const toast      = useToast();

  // ── Password login ────────────────────────────────────────────────────────
  const handlePasswordLogin = async (e) => {
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

  // ── Face login — step 1: user enters email, then opens camera ─────────────
  const handleOpenFaceLogin = (e) => {
    e.preventDefault();
    if (!form.email) return toast('Enter your email first', 'error');
    setShowCam(true);
  };

  // ── Face login — step 2: frame captured, call /auth/face/login ─────────────
  const handleFaceCapture = async (base64) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/face/login', {
        email:     form.email,
        imageData: base64,
      });
      login(data.token, data.user);
      toast(`Welcome back, ${data.user.name}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Face authentication failed';
      toast(msg, 'error');
      setShowCam(false);
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: showCam ? 400 : 480 }}>

        {/* Logo */}
        <div className="auth-logo">
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #00d4ff, #0099bb)',
            borderRadius: 12, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 28,
            margin: '0 auto 12px', boxShadow: '0 0 30px rgba(0,212,255,0.3)',
          }}>🛡</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: 4, color: 'var(--accent)' }}>
            UBlock
          </div>
          <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 3, marginTop: 4 }}>
            EVIDENCE PROTECTION SYSTEM
          </span>
        </div>

        {/* ── Webcam capture overlay ───────────────────────────────────── */}
        {showCam ? (
          <FaceCapture
            title="Face ID Login"
            subtitle="Centre your face and click Capture to authenticate."
            captureLabel="Authenticate"
            processing={loading}
            onCapture={handleFaceCapture}
            onCancel={() => { setShowCam(false); setLoading(false); }}
          />
        ) : (
          <>
            <h2 className="auth-title">Secure Access</h2>
            <p className="auth-sub">Authorized personnel only. All access is monitored and logged.</p>

            {/* Mode tabs */}
            <div style={{
              display: 'flex', gap: 0,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 10, padding: 4,
              marginBottom: 28,
            }}>
              {[
                { id: 'password', icon: '🔐', label: 'Password' },
                { id: 'face',     icon: '👤', label: 'Face ID'  },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id)}
                  style={{
                    flex: 1, padding: '9px 0',
                    border: 'none', borderRadius: 7,
                    background: mode === tab.id ? 'var(--accent)' : 'transparent',
                    color:      mode === tab.id ? 'var(--bg-primary)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    letterSpacing: 1, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.icon} {tab.label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* ── Password form ─────────────────────────────────────────── */}
            {mode === 'password' && (
              <form onSubmit={handlePasswordLogin}>
                <div className="form-group">
                  <label className="form-label">Officer Email</label>
                  <input
                    className="form-control" type="email"
                    placeholder="badge@department.gov"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-control" type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
                <button
                  className="btn btn-primary" type="submit"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', padding: 14, marginTop: 8 }}
                >
                  {loading ? 'Authenticating...' : '🔐  Authenticate'}
                </button>
              </form>
            )}

            {/* ── Face ID form ──────────────────────────────────────────── */}
            {mode === 'face' && (
              <form onSubmit={handleOpenFaceLogin}>
                <div className="form-group">
                  <label className="form-label">Officer Email</label>
                  <input
                    className="form-control" type="email"
                    placeholder="badge@department.gov"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                {/* Face ID info box */}
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(0,212,255,0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 8, marginBottom: 20,
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--text-muted)', lineHeight: 1.8,
                }}>
                  👤 Your face will be scanned and matched against your enrolled biometric. Ensure good lighting and a clear view of your face.
                </div>

                <button
                  className="btn btn-primary" type="submit"
                  style={{ width: '100%', justifyContent: 'center', padding: 14 }}
                >
                  👤  Open Face Scanner
                </button>
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: 24, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              No account?{' '}
              <button onClick={goRegister} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                REQUEST ACCESS →
              </button>
            </div>
            <div style={{ marginTop: 28, padding: '12px 16px', background: 'rgba(255,82,82,0.05)', border: '1px solid rgba(255,82,82,0.15)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>
              ⚠ UNAUTHORIZED ACCESS IS A FEDERAL OFFENSE
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
