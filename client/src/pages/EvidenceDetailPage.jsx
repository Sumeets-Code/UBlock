import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastProvider.jsx';
import { useAuth } from '../context/AuthProvider.jsx';
import { fmt, formatFileSize, getCategoryIcon } from '../utils/api.js';
import API from '../utils/api.js';
import { MOCK_EVIDENCE } from '../utils/mockData.js';


function EvidenceDetailPage({ id, setPage }) {
  const { user } = useAuth();
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const toast = useToast();
  const [statusUpdate, setStatusUpdate] = useState({ 
    status: '', 
    notes: '', 
    officer: user?.name || '', 
  });




  // useEffect(() => {
  //   const e = MOCK_EVIDENCE.find(x => x._id === id);
  //   if (e) { setEvidence({ ...e }); setStatusUpdate(s => ({ ...s, status: e.status })); }
  // }, [id]);

  // const handleStatusUpdate = () => {
  //   if (!statusUpdate.officer) return toast("Officer name required", "error");
  //   setEvidence(ev => ({
  //     ...ev, status: statusUpdate.status,
  //     chainOfCustody: [...(ev.chainOfCustody || []), { action: `Status changed to ${statusUpdate.status}`, officer: statusUpdate.officer, timestamp: new Date().toISOString(), notes: statusUpdate.notes }]
  //   }));
  //   setShowStatusModal(false);
  //   toast("Status updated and logged");
  // };

  // if (!evidence) return <div className="loading"><div className="spinner" /></div>;


  useEffect(() => {
    // GET /api/evidence/:id  →  single evidence object with chainOfCustody
    API.get(`/evidence/${id}`)
      .then(r => {
        setEvidence(r.data);
        setStatusUpdate(s => ({ ...s, status: r.data.status }));
      })
      .catch(() => { toast('Evidence not found', 'error'); setPage('evidence'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!statusUpdate.officer) return toast('Officer name required', 'error');
    try {
      // PATCH /api/evidence/:id/status  →  updated evidence object
      const { data } = await API.patch(`/evidence/${id}/status`, statusUpdate);
      setEvidence(data);
      setShowStatusModal(false);
      toast('Status updated and logged');
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!evidence) return null;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setPage('evidence')} style={{ background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
          ← Back to Evidence Vault
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div className={`evidence-type-icon ${evidence.category}`} style={{ width: 60, height: 60, fontSize: 28 }}>{getCategoryIcon(evidence.category)}</div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>{evidence.title}</h2>
              <span className={`badge badge-${evidence.status}`}>{evidence.status}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>CASE: {evidence.caseNumber}</div>
            {evidence.description && <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{evidence.description}</p>}
            {evidence.tags?.length > 0 && <div className="tags-row" style={{ marginTop: 10 }}>{evidence.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setShowStatusModal(true)}>✏ Update Status</button>
            {/* Download hits the backend file path directly */}
            <a href={evidence.filePath} download={evidence.originalName} className="btn btn-primary">⬇ Download</a>
          </div>
        </div>
      </div>

      <div className="tabs">
        {[['overview', '📋 Overview'], ['preview', '👁 Preview'], ['custody', '🔗 Chain of Custody']].map(([t, label]) => (
          <div key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{label}</div>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            {[
              { title: 'File Information', items: [['Original Filename', evidence.originalName], ['File Size', formatFileSize(evidence.fileSize)], ['MIME Type', evidence.mimeType], ['Category', evidence.category], ['Upload Date', fmt(evidence.createdAt, 'full')]] },
              { title: 'Collection Details', items: [['Collected By', evidence.collectedBy], ['Collection Date', fmt(evidence.collectionDate)], ['Location', evidence.location || 'Not specified'], ['Status', evidence.status], ['Last Updated', fmt(evidence.updatedAt, 'full')]] },
            ].map(({ title, items }) => (
              <div key={title}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>{title}</div>
                {items.map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', marginBottom: 12, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)', minWidth: 140, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 1 }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'preview' && (
        <div className="card">
          {evidence.mimeType?.startsWith('image/') ? (
            <div style={{ textAlign: 'center' }}>
              <img src={evidence.filePath} alt={evidence.title} style={{ maxWidth: '100%', maxHeight: 500, borderRadius: 8, border: '1px solid var(--border)' }} />
            </div>
          ) : evidence.mimeType?.startsWith('audio/') ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 20, fontSize: 64 }}>🎵</div>
              <audio controls style={{ width: '100%' }}><source src={evidence.filePath} type={evidence.mimeType} /></audio>
            </div>
          ) : evidence.mimeType?.startsWith('video/') ? (
            <video controls style={{ width: '100%', borderRadius: 8, maxHeight: 500 }}>
              <source src={evidence.filePath} type={evidence.mimeType} />
            </video>
          ) : evidence.mimeType === 'application/pdf' ? (
            <iframe src={evidence.filePath} style={{ width: '100%', height: 600, border: 'none', borderRadius: 8 }} title="PDF Preview" />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">{getCategoryIcon(evidence.category)}</div>
              <div className="empty-state-title">Preview Unavailable</div>
              <div className="empty-state-sub">This file type cannot be previewed in the browser</div>
              <a href={evidence.filePath} download={evidence.originalName} className="btn btn-primary" style={{ marginTop: 20 }}>⬇ Download to View</a>
            </div>
          )}
        </div>
      )}

      {tab === 'custody' && (
        <div className="card">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 20, textTransform: 'uppercase' }}>
            Chain of Custody — {evidence.chainOfCustody?.length || 0} Events
          </div>
          <div className="custody-timeline">
            {evidence.chainOfCustody?.map((c, i) => (
              <div key={i} className="custody-item">
                <div className="custody-dot" />
                <div className="custody-action">{c.action}</div>
                <div className="custody-meta">{c.officer} · {fmt(c.timestamp, 'full')}</div>
                {c.notes && <div className="custody-note">{c.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-title">Update Evidence Status</div>
              <button className="close-btn" onClick={() => setShowStatusModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select className="form-control" value={statusUpdate.status} onChange={e => setStatusUpdate({ ...statusUpdate, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="pending">Pending Review</option>
                  <option value="archived">Archived</option>
                  <option value="released">Released</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Officer Name *</label>
                <input className="form-control" placeholder="Your name" value={statusUpdate.officer} onChange={e => setStatusUpdate({ ...statusUpdate, officer: e.target.value })} readOnly/>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" placeholder="Reason for status change..." value={statusUpdate.notes} onChange={e => setStatusUpdate({ ...statusUpdate, notes: e.target.value })} rows={3} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStatusUpdate}>Update Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvidenceDetailPage;
