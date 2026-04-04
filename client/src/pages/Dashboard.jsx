import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthProvider.jsx';
import { useToast } from '../context/ToastProvider.jsx';
import { getCategoryIcon, fmt } from '../utils/api.js';
import API from '../utils/api.js';


function DashboardPage({ setPage }) {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // GET /api/evidence/stats/overview  →  { total, byCategory, byStatus, recentUploads }
    API.get('/evidence/stats/overview')
      .then(r => setStats(r.data))
      .catch(() => toast('Failed to load dashboard stats', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const getCatCount = (cat) => stats?.byCategory?.find(c => c._id === cat)?.count || 0;
  const getStatusCount = (s) => stats?.byStatus?.find(c => c._id === s)?.count || 0;

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>WELCOME BACK, OFFICER</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{user?.name || 'Officer'}</h2>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {user?.department && <span>{user.department} · </span>}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{user?.role?.toUpperCase()} ACCESS</span>
        </div>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Evidence', value: stats?.total || 0, sub: 'Items in vault', cls: '' },
          { label: 'Active Cases', value: getStatusCount('active'), sub: 'Currently active', cls: ' orange' },
          { label: 'Documents', value: getCatCount('document'), sub: 'Files & docs', cls: ' green' },
          { label: 'Pending Review', value: getStatusCount('pending'), sub: 'Needs attention', cls: ' warning' },
        ].map(({ label, value, sub, cls }) => (
          <div key={label} className={`stat-card${cls}`}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Evidence by Category</div></div>
          {['image', 'document', 'audio', 'video', 'other'].map(cat => {
            const count = getCatCount(cat);
            const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>{getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{count}</span>
                </div>
                <div className="progress-bar-wrap"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Uploads</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage('evidence')}>View All</button>
          </div>
          {stats?.recentUploads?.map(e => (
            <div key={e._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{getCategoryIcon(e.category)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{e.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{e.caseNumber} · {e.collectedBy}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{fmt(e.createdAt, 'short')}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><div className="card-title">Quick Actions</div></div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setPage('upload')}>⬆ Upload Evidence</button>
          <button className="btn btn-secondary" onClick={() => setPage('evidence')}>🗂 Browse Vault</button>
          <button className="btn btn-secondary" onClick={() => setPage('reports')}>📊 Generate Report</button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
