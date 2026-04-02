import React, { useState } from 'react';
import { formatFileSize } from '../utils/api.js';
import { useAuth } from '../context/AuthProvider.jsx';
import { useToast } from '../context/ToastProvider.jsx';
import API from '../utils/api.js';

function UploadPage({ setPage }) {
  const { user } = useAuth();
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({
    caseNumber: '', title: '', description: '',
    collectedBy: user?.name || '', collectionDate: new Date().toISOString().split('T')[0], location: '', tags: ''
  });
  const [dragging, setDragging] = useState(false);

  const getFileIcon = (f) => {
    if (!f) return '📁';
    if (f.type.startsWith('image/')) return '🖼️';
    if (f.type.startsWith('audio/')) return '🎵';
    if (f.type.startsWith('video/')) return '🎬';
    if (f.type.includes('pdf')) return '📑';
    return '📄';
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.size <= 100 * 1024 * 1024) setFile(f);
    else toast('File too large (max 100MB)', 'error');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast('Please select a file to upload', 'error');
    if (!form.caseNumber || !form.title || !form.collectedBy || !form.collectionDate)
      return toast('Please fill in all required fields', 'error');

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));

    try {
      // POST /api/evidence/upload  (multipart/form-data)  →  created evidence object
      await API.post('/evidence/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      });
      toast('Evidence uploaded and secured successfully');
      setPage('evidence');
    } catch (err) {
      toast(err.response?.data?.message || 'Upload failed', 'error');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 6 }}>SECURE UPLOAD</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Upload evidence files with full chain of custody documentation.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
          <div>
            <div
              className={`dropzone${dragging ? ' active' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input id="file-input" type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) setFile(e.target.files[0]); }} />
              <span className="dropzone-icon">{file ? getFileIcon(file) : '📁'}</span>
              {file ? (
                <>
                  <div className="dropzone-title" style={{ color: 'var(--accent)' }}>{file.name}</div>
                  <div className="dropzone-sub">{formatFileSize(file.size)} · Click or drag to replace</div>
                </>
              ) : (
                <>
                  <div className="dropzone-title">Drop Evidence File Here</div>
                  <div className="dropzone-sub">or click to browse files</div>
                  <div style={{ marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, lineHeight: 1.8 }}>
                    IMAGES · DOCUMENTS · AUDIO · VIDEO<br />PDFs · SPREADSHEETS · ARCHIVES<br />MAX SIZE: 100MB
                  </div>
                </>
              )}
            </div>
            {file && (
              <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>File Details</div>
                {[['Name', file.name], ['Size', formatFileSize(file.size)], ['Type', file.type || 'unknown']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', maxWidth: 200, textAlign: 'right', wordBreak: 'break-all' }}>{val}</span>
                  </div>
                ))}
                <button type="button" className="btn btn-danger btn-sm" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={() => setFile(null)}>✕ Remove File</button>
              </div>
            )}
            {uploading && (
              <div className="upload-progress">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Encrypting & uploading...</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{progress}%</span>
                </div>
                <div className="progress-bar-wrap"><div className="progress-bar" style={{ width: `${progress}%` }} /></div>
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 20, textTransform: 'uppercase' }}>Evidence Metadata</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Case Number *</label>
                <input className="form-control" placeholder="CASE-2024-001" value={form.caseNumber} onChange={e => setForm({ ...form, caseNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Evidence Title *</label>
                <input className="form-control" placeholder="Enter descriptive title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" placeholder="Describe the evidence, how it was found, its relevance..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Collected By *</label>
                <input className="form-control" placeholder="Officer name" value={form.collectedBy} onChange={e => setForm({ ...form, collectedBy: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Collection Date *</label>
                <input className="form-control" type="date" value={form.collectionDate} onChange={e => setForm({ ...form, collectionDate: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Collection Location</label>
              <input className="form-control" placeholder="e.g., 123 Main St, Scene B, Room 4" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input className="form-control" placeholder="e.g., weapon, fingerprint, digital" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div style={{ padding: '12px 16px', background: 'rgba(0,212,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 20, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              ⚡ All uploads are encrypted and immutably logged with timestamp, officer ID, and chain of custody record.
            </div>
            <button type="submit" className="btn btn-primary" disabled={uploading || !file} style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
              {uploading ? `Uploading ${progress}%...` : '🔒  Secure Upload Evidence'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UploadPage;
