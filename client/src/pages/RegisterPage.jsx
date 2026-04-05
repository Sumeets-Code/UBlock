import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider.jsx';
import { useToast } from '../context/ToastProvider.jsx';
import API from '../utils/api.js';
import FaceCapture from '../components/FaceCapture.jsx';

const REQUIRED_SAMPLES = 3; // match ENCODINGS_PER_USER in Python config

function RegisterPage({ goLogin }) {
  const [step,     setStep]     = useState(1);  // 1 | 2 | 3
  const [form,     setForm]     = useState({
    name: '', email: '', password: '', role: 'investigator', badgeNumber: '', department: '',
  });
  const [loading,      setLoading]      = useState(false);
  const [enrolling,    setEnrolling]    = useState(false);
  const [samplesCount, setSamplesCount] = useState(0);
  const [tempToken,    setTempToken]    = useState(null); // JWT from step 1, used for enroll
  const [tempUser,     setTempUser]     = useState(null);

  const { login } = useAuth();
  const toast      = useToast();

  // ── Step 1: register account details ──────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register', form);
      // Store token temporarily — used for face enroll in step 2
      setTempToken(data.token);
      setTempUser(data.user);
      setStep(2);
    } catch (err) {
      toast(err.response?.data?.message || 'Registration failed', 'error');
      setLoading(false);
    }
  };

  // ── Step 2: enroll face sample ────────────────────────────────────────────
  const handleFaceSample = async (base64) => {
    setEnrolling(true);
    try {
      const { data } = await API.post(
        '/auth/face/enroll',
        { imageData: base64 },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );

      const count = data.encodings_stored;
      setSamplesCount(count);
      toast(`Sample ${count}/${REQUIRED_SAMPLES} captured`);

      if (count >= REQUIRED_SAMPLES) {
        // All samples collected — complete login
        toast('Face enrollment complete!');
        login(tempToken, { ...tempUser, faceEnrolled: true });
        setStep(3);
      }
      // Otherwise stay on step 2 so user can capture more
    } catch (err) {
      toast(err.response?.data?.message || 'Face sample failed — try again', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  // ── Skip face enroll — log in without biometrics ──────────────────────────
  const handleSkipEnroll = () => {
    login(tempToken, tempUser);
    toast(`Welcome, ${tempUser.name}`);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: step === 2 ? 620 : 560 }}>

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

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
          {[
            { n: 1, label: 'Details' },
            { n: 2, label: 'Face ID' },
            { n: 3, label: 'Done'    },
          ].map((s, i, arr) => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                  background: step > s.n ? 'var(--success)' : step === s.n ? 'var(--accent)' : 'var(--bg-card)',
                  color:      step >= s.n ? 'var(--bg-primary)' : 'var(--text-muted)',
                  border:     step < s.n ? '1px solid var(--border)' : 'none',
                  transition: 'all 0.3s',
                }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1,
                  color: step === s.n ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                  {s.label.toUpperCase()}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div style={{
                  flex: 1, height: 1, marginBottom: 18,
                  background: step > s.n ? 'var(--success)' : 'var(--border)',
                  transition: 'background 0.3s',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step 1: account form ─────────────────────────────────────── */}
        {step === 1 && (
          <>
            <h2 className="auth-title">Request Access</h2>
            <p className="auth-sub">Complete your officer profile to gain system access.</p>
            <form onSubmit={handleRegister}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" placeholder="Det. John Smith"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Badge Number</label>
                  <input className="form-control" placeholder="B-4821"
                    value={form.badgeNumber} onChange={e => setForm({ ...form, badgeNumber: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Official Email</label>
                <input className="form-control" type="email" placeholder="name@department.gov"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-control" placeholder="Homicide Division"
                    value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Access Level</label>
                  <select className="form-control" value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="viewer">Viewer</option>
                    <option value="investigator">Investigator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" placeholder="Min 8 characters"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  required minLength={8} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: 14, marginTop: 8 }}>
                {loading ? 'Creating Account...' : '✦  Create Secure Account'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              Already registered?{' '}
              <button onClick={goLogin} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                SIGN IN →
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: face enrollment ──────────────────────────────────── */}
        {step === 2 && (
          <>
            {/* Sample progress */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: 1, fontSize: 10 }}>
                  SAMPLES CAPTURED
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 11 }}>
                  {samplesCount} / {REQUIRED_SAMPLES}
                </span>
              </div>
              <div className="progress-bar-wrap">
                <div
                  className="progress-bar"
                  style={{ width: `${(samplesCount / REQUIRED_SAMPLES) * 100}%` }}
                />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                {samplesCount === 0
                  ? 'Capture 3 samples for best accuracy — try different angles and lighting.'
                  : samplesCount < REQUIRED_SAMPLES
                  ? `${REQUIRED_SAMPLES - samplesCount} more sample(s) needed. Slightly adjust your angle.`
                  : 'All samples captured!'}
              </div>
            </div>

            <FaceCapture
              title="Enroll Face ID"
              subtitle={`Sample ${samplesCount + 1} of ${REQUIRED_SAMPLES} — face the camera directly.`}
              captureLabel={`Capture Sample ${samplesCount + 1}`}
              processing={enrolling}
              onCapture={handleFaceSample}
              onCancel={handleSkipEnroll}
            />
{/* 
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
              onClick={handleSkipEnroll}
              disabled={enrolling}
            >
              Skip — enroll face later
            </button>
*/}
          </>
        )}

        {/* ── Step 3: success ───────────────────────────────────────────── */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: 1, marginBottom: 8, color: 'var(--success)' }}>
              Account Created
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Face ID enrolled with {samplesCount} sample(s). You can now log in with your face or password.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegisterPage;
