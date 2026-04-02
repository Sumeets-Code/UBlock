import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastProvider.jsx';
import { fmt, formatFileSize, getCategoryIcon } from '../utils/api.js';
import API from '../utils/api.js';
import { MOCK_EVIDENCE } from '../utils/mockData.js';


function EvidencePage({ setPage, setDetailId }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState('grid');
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();




  // useEffect(() => {
  //   let filtered = MOCK_EVIDENCE;
  //   if (search) filtered = filtered.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.caseNumber.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase()));
  //   if (category) filtered = filtered.filter(e => e.category === category);
  //   if (status) filtered = filtered.filter(e => e.status === status);
  //   setEvidence(filtered);
  // }, [search, category, status]);

  // const handleDelete = (id, e) => {
  //   e.stopPropagation();
  //   if (!window.confirm("Permanently delete this evidence record?")) return;
  //   setEvidence(ev => ev.filter(x => x._id !== id));
  //   toast("Evidence deleted");
  // };







  const fetchEvidence = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (status) params.status = status;
    // GET /api/evidence?search=&category=&status=  →  array of evidence objects
    API.get('/evidence', { params })
      .then(r => setEvidence(r.data))
      .catch(() => toast('Failed to load evidence', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvidence(); }, [search, category, status]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Permanently delete this evidence record?')) return;
    try {
      // DELETE /api/evidence/:id
      await API.delete(`/evidence/${id}`);
      toast('Evidence deleted');
      fetchEvidence();
    } catch {
      toast('Delete failed', 'error');
    }
  };

  return (

    // <div>
    //   <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
    //     <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
    //       <span className="search-icon">🔍</span>
    //       <input placeholder="Search evidence, case numbers, descriptions..." value={search} onChange={e => setSearch(e.target.value)} />
    //     </div>
    //     <div className="filters">
    //       <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
    //         <option value="">All Types</option>
    //         <option value="image">🖼️ Images</option>
    //         <option value="document">📄 Documents</option>
    //         <option value="audio">🎵 Audio</option>
    //         <option value="video">🎬 Video</option>
    //         <option value="other">📦 Other</option>
    //       </select>
    //       <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
    //         <option value="">All Status</option>
    //         <option value="active">Active</option>
    //         <option value="pending">Pending</option>
    //         <option value="archived">Archived</option>
    //         <option value="released">Released</option>
    //       </select>
    //     </div>
    //     <div style={{ display: "flex", gap: 4, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 4 }}>
    //       {["grid", "list"].map(v => (
    //         <button key={v} onClick={() => setView(v)} style={{ padding: "6px 12px", border: "none", borderRadius: 6, background: view === v ? "var(--accent)" : "transparent", color: view === v ? "var(--bg-primary)" : "var(--text-muted)", cursor: "pointer", fontSize: 16, transition: "all 0.2s" }}>
    //           {v === "grid" ? "⊞" : "≡"}
    //         </button>
    //       ))}
    //     </div>
    //     <button className="btn btn-primary btn-sm" onClick={() => setPage("upload")}>⬆ Upload</button>
    //   </div>

    //   <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 16 }}>
    //     {evidence.length} ITEM{evidence.length !== 1 ? "S" : ""} FOUND
    //   </div>

    //   {evidence.length === 0 ? (
    //     <div className="empty-state">
    //       <div className="empty-state-icon">🗂</div>
    //       <div className="empty-state-title">No Evidence Found</div>
    //       <div className="empty-state-sub">Try adjusting filters or upload new evidence</div>
    //       <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setPage("upload")}>Upload Evidence</button>
    //     </div>
    //   ) : view === "grid" ? (
    //     <div className="evidence-grid">
    //       {evidence.map(e => (
    //         <div key={e._id} className="evidence-card" onClick={() => { setDetailId(e._id); setPage("detail"); }}>
    //           <div className="evidence-card-header">
    //             <div className={`evidence-type-icon ${e.category}`}>{getCategoryIcon(e.category)}</div>
    //             <div style={{ flex: 1, minWidth: 0 }}>
    //               <div className="evidence-card-title">{e.title}</div>
    //               <div className="evidence-case-number">{e.caseNumber}</div>
    //             </div>
    //             <span className={`badge badge-${e.status}`}>{e.status}</span>
    //           </div>
    //           <div className="evidence-card-body">
    //             <div className="evidence-meta">
    //               <div className="evidence-meta-item"><span className="evidence-meta-label">Officer</span><span>{e.collectedBy}</span></div>
    //               <div className="evidence-meta-item"><span className="evidence-meta-label">Date</span><span>{fmt(e.collectionDate)}</span></div>
    //               {e.location && <div className="evidence-meta-item"><span className="evidence-meta-label">Location</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{e.location}</span></div>}
    //               <div className="evidence-meta-item"><span className="evidence-meta-label">Size</span><span>{formatFileSize(e.fileSize)}</span></div>
    //             </div>
    //             {e.tags?.length > 0 && (
    //               <div className="tags-row">{e.tags.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}{e.tags.length > 3 && <span className="tag">+{e.tags.length - 3}</span>}</div>
    //             )}
    //           </div>
    //           <div className="evidence-card-footer">
    //             <span className={`badge badge-${e.category}`}>{getCategoryIcon(e.category)} {e.category}</span>
    //             <div style={{ display: "flex", gap: 6 }}>
    //               <button className="btn btn-secondary btn-sm btn-icon" onClick={ev => { ev.stopPropagation(); setDetailId(e._id); setPage("detail"); }}>👁</button>
    //               <button className="btn btn-danger btn-sm btn-icon" onClick={ev => handleDelete(e._id, ev)}>🗑</button>
    //             </div>
    //           </div>
    //         </div>
    //       ))}
    //     </div>
    //   ) : (
    //     <div className="card" style={{ padding: 0, overflow: "hidden" }}>
    //       <table className="data-table">
    //         <thead>
    //           <tr><th>Type</th><th>Title</th><th>Case #</th><th>Officer</th><th>Date</th><th>Size</th><th>Status</th><th>Actions</th></tr>
    //         </thead>
    //         <tbody>
    //           {evidence.map(e => (
    //             <tr key={e._id} style={{ cursor: "pointer" }} onClick={() => { setDetailId(e._id); setPage("detail"); }}>
    //               <td style={{ fontSize: 20 }}>{getCategoryIcon(e.category)}</td>
    //               <td>
    //                 <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
    //                 {e.tags?.length > 0 && <div className="tags-row" style={{ marginTop: 4 }}>{e.tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}</div>}
    //               </td>
    //               <td><span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{e.caseNumber}</span></td>
    //               <td style={{ fontSize: 13 }}>{e.collectedBy}</td>
    //               <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{fmt(e.collectionDate)}</td>
    //               <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{formatFileSize(e.fileSize)}</td>
    //               <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
    //               <td>
    //                 <div style={{ display: "flex", gap: 6 }} onClick={ev => ev.stopPropagation()}>
    //                   <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { setDetailId(e._id); setPage("detail"); }}>👁</button>
    //                   <button className="btn btn-danger btn-sm btn-icon" onClick={ev => handleDelete(e._id, ev)}>🗑</button>
    //                 </div>
    //               </td>
    //             </tr>
    //           ))}
    //         </tbody>
    //       </table>
    //     </div>
    //   )}
    // </div>

    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <span className="search-icon">🔍</span>
          <input placeholder="Search evidence, case numbers, descriptions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filters">
          <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Types</option>
            <option value="image">🖼️ Images</option>
            <option value="document">📄 Documents</option>
            <option value="audio">🎵 Audio</option>
            <option value="video">🎬 Video</option>
            <option value="other">📦 Other</option>
          </select>
          <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="archived">Archived</option>
            <option value="released">Released</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
          {['grid', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 12px', border: 'none', borderRadius: 6, background: view === v ? 'var(--accent)' : 'transparent', color: view === v ? 'var(--bg-primary)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 16, transition: 'all 0.2s' }}>
              {v === 'grid' ? '⊞' : '≡'}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setPage('upload')}>⬆ Upload</button>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 16 }}>
        {evidence.length} ITEM{evidence.length !== 1 ? 'S' : ''} FOUND
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : evidence.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗂</div>
          <div className="empty-state-title">No Evidence Found</div>
          <div className="empty-state-sub">Try adjusting filters or upload new evidence</div>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setPage('upload')}>Upload Evidence</button>
        </div>
      ) : view === 'grid' ? (
        <div className="evidence-grid">
          {evidence.map(e => (
            <div key={e._id} className="evidence-card" onClick={() => { setDetailId(e._id); setPage('detail'); }}>
              <div className="evidence-card-header">
                <div className={`evidence-type-icon ${e.category}`}>{getCategoryIcon(e.category)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="evidence-card-title">{e.title}</div>
                  <div className="evidence-case-number">{e.caseNumber}</div>
                </div>
                <span className={`badge badge-${e.status}`}>{e.status}</span>
              </div>
              <div className="evidence-card-body">
                <div className="evidence-meta">
                  <div className="evidence-meta-item"><span className="evidence-meta-label">Officer</span><span>{e.collectedBy}</span></div>
                  <div className="evidence-meta-item"><span className="evidence-meta-label">Date</span><span>{fmt(e.collectionDate)}</span></div>
                  {e.location && <div className="evidence-meta-item"><span className="evidence-meta-label">Location</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{e.location}</span></div>}
                  <div className="evidence-meta-item"><span className="evidence-meta-label">Size</span><span>{formatFileSize(e.fileSize)}</span></div>
                </div>
                {e.tags?.length > 0 && (
                  <div className="tags-row">{e.tags.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}{e.tags.length > 3 && <span className="tag">+{e.tags.length - 3}</span>}</div>
                )}
              </div>
              <div className="evidence-card-footer">
                <span className={`badge badge-${e.category}`}>{getCategoryIcon(e.category)} {e.category}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={ev => { ev.stopPropagation(); setDetailId(e._id); setPage('detail'); }}>👁</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={ev => handleDelete(e._id, ev)}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr><th>Type</th><th>Title</th><th>Case #</th><th>Officer</th><th>Date</th><th>Size</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {evidence.map(e => (
                <tr key={e._id} style={{ cursor: 'pointer' }} onClick={() => { setDetailId(e._id); setPage('detail'); }}>
                  <td style={{ fontSize: 20 }}>{getCategoryIcon(e.category)}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
                    {e.tags?.length > 0 && <div className="tags-row" style={{ marginTop: 4 }}>{e.tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}</div>}
                  </td>
                  <td><span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{e.caseNumber}</span></td>
                  <td style={{ fontSize: 13 }}>{e.collectedBy}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{fmt(e.collectionDate)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{formatFileSize(e.fileSize)}</td>
                  <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }} onClick={ev => ev.stopPropagation()}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { setDetailId(e._id); setPage('detail'); }}>👁</button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={ev => handleDelete(e._id, ev)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EvidencePage;
