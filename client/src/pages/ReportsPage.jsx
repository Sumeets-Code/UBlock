import React, { useState, useEffect, useCallback } from 'react';
import { fmt, formatFileSize, getCategoryIcon } from '../utils/api.js';
import { useToast } from '../context/ToastProvider.jsx';
import { useAuth } from '../context/AuthProvider.jsx';
import API from '../utils/api.js';

function ReportsPage() {
  const { user }  = useAuth();
  const toast     = useToast();

  // ── Generate state ────────────────────────────────────────────────────────
  const [reportType,  setReportType]  = useState('case');
  const [caseNumber,  setCaseNumber]  = useState('');
  const [report,      setReport]      = useState(null);   // live generated report
  const [generating,  setGenerating]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);  // already saved this report
  const [notes,       setNotes]       = useState('');
  const [pdfBusy,     setPdfBusy]     = useState(false);

  // ── Saved reports state ───────────────────────────────────────────────────
  const [savedReports, setSavedReports] = useState([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [filterCase,   setFilterCase]   = useState('');
  const [selectedSaved, setSelectedSaved] = useState(null); // full saved report object
  const [loadingSaved,  setLoadingSaved]  = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);

  // active panel: 'generate' | 'view'
  const [panel, setPanel] = useState('generate');

  // ── Load saved reports list ───────────────────────────────────────────────
  const loadSavedReports = useCallback(async (filter = '') => {
    setSavedLoading(true);
    try {
      const params = filter ? `?caseNumber=${encodeURIComponent(filter)}` : '';
      const { data } = await API.get(`/reports/saved${params}`);
      setSavedReports(data.reports || []);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to load saved reports', 'error');
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => { loadSavedReports(); }, [loadSavedReports]);

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (reportType === 'case' && !caseNumber.trim()) {
      return toast('Enter a case number', 'error');
    }
    setGenerating(true);
    setReport(null);
    setSaved(false);
    setNotes('');
    setPanel('generate');
    setSelectedSaved(null);
    try {
      const endpoint = reportType === 'case'
        ? `/reports/generate/case/${encodeURIComponent(caseNumber.trim())}`
        : '/reports/generate/full';
      const { data } = await API.get(endpoint);
      setReport(data);
      toast('Report generated');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to generate report', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!report) return;
    setSaving(true);
    try {
      await API.post('/reports/saved', { report, notes });
      setSaved(true);
      toast('Report saved');
      loadSavedReports(filterCase);
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Load a saved report ───────────────────────────────────────────────────
  const handleLoadSaved = async (id) => {
    setLoadingSaved(true);
    setPanel('view');
    setReport(null);
    try {
      const { data } = await API.get(`/reports/saved/${id}`);
      setSelectedSaved(data);
    } catch (err) {
      toast('Failed to load report', 'error');
      setPanel('generate');
    } finally {
      setLoadingSaved(false);
    }
  };

  // ── Delete saved ──────────────────────────────────────────────────────────
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved report? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await API.delete(`/reports/saved/${id}`);
      toast('Report deleted');
      if (selectedSaved?._id === id) { setSelectedSaved(null); setPanel('generate'); }
      loadSavedReports(filterCase);
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // ── PDF download (works for both live and saved reports) ──────────────────
  const handleDownloadPDF = async (data) => {
    if (!data) return;
    setPdfBusy(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W   = doc.internal.pageSize.getWidth();

      // Header band
      doc.setFillColor(7, 13, 24);
      doc.rect(0, 0, W, 46, 'F');
      doc.setFillColor(0, 212, 255);
      doc.rect(0, 0, 4, 46, 'F');
      doc.setTextColor(0, 212, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('UBlock', 12, 17);
      doc.setTextColor(180, 200, 220);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('EVIDENCE PROTECTION SYSTEM — OFFICIAL REPORT', 12, 25);
      doc.setTextColor(120, 153, 184);
      doc.text(`Report ID: ${data.reportId}`, 12, 32);
      doc.text(`Generated: ${new Date(data.generatedAt || data.createdAt).toLocaleString()}`, 12, 38);
      if (data.generatedByName) doc.text(`Generated by: ${data.generatedByName}`, 12, 44);

      // Summary stats
      doc.setTextColor(232, 244, 253);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(data.title || (data.caseNumber ? `Case: ${data.caseNumber}` : 'Full Report'), 12, 58);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 153, 184);
      const statLine = [
        `Total items: ${data.totalEvidence}`,
        `Total size: ${formatFileSize(data.totalSize || 0)}`,
        data.totalCases != null ? `Cases: ${data.totalCases}` : '',
      ].filter(Boolean).join('   ·   ');
      doc.text(statLine, 12, 65);

      if (data.notes) {
        doc.setTextColor(120, 153, 184);
        doc.text(`Notes: ${data.notes}`, 12, 71);
      }

      // Evidence table
      const items = data.evidence || [];
      if (items.length > 0) {
        autoTable(doc, {
          startY: data.notes ? 78 : 72,
          head:   [['Type', 'Title', 'Case #', 'Officer', 'Date', 'Status', 'Size', 'IPFS']],
          body:   items.map(e => [
            e.category,
            e.title,
            e.caseNumber || data.caseNumber || '—',
            e.collectedBy,
            fmt(e.collectionDate || e.createdAt),
            e.status,
            formatFileSize(e.fileSize),
            e.ipfsHash ? e.ipfsHash.slice(0, 16) + '...' : '—',
          ]),
          theme: 'grid',
          headStyles:          { fillColor: [0, 80, 110], textColor: [232, 244, 253], fontStyle: 'bold', fontSize: 7.5 },
          bodyStyles:          { fillColor: [7, 13, 24],  textColor: [200, 220, 240], fontSize: 7 },
          alternateRowStyles:  { fillColor: [11, 21, 37] },
          margin: { left: 8, right: 8 },
          columnStyles: { 1: { cellWidth: 35 }, 7: { cellWidth: 22 } },
        });
      }

      // Chain of custody section
      const withCustody = items.filter(e => e.chainOfCustody?.length > 0);
      if (withCustody.length > 0) {
        let y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : 80;
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 212, 255);
        doc.text('Chain of Custody', 12, y);
        y += 6;

        for (const ev of withCustody) {
          if (y > 260) { doc.addPage(); y = 20; }
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(232, 244, 253);
          doc.text(`${ev.title} (${ev.caseNumber || data.caseNumber})`, 12, y);
          y += 5;
          for (const c of ev.chainOfCustody) {
            if (y > 265) { doc.addPage(); y = 20; }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(120, 153, 184);
            doc.text(
              `  ${fmt(c.timestamp, 'full')}  ·  ${c.officer}  ·  ${c.action}${c.notes ? '  —  ' + c.notes : ''}`,
              12, y
            );
            y += 5;
          }
          y += 2;
        }
      }

      // Footer on all pages
      const pages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setFontSize(7);
        doc.setTextColor(74, 101, 128);
        doc.text(`UBlock Evidence Protection System  ·  Page ${p} of ${pages}  ·  Confidential`, W / 2, 292, { align: 'center' });
      }

      const filename = data.caseNumber
        ? `UBlock_${data.caseNumber}_${Date.now()}.pdf`
        : `UBlock_FullReport_${Date.now()}.pdf`;
      doc.save(filename);
      toast('PDF downloaded');
    } catch (err) {
      console.error(err);
      toast('PDF generation failed. Install: npm install jspdf jspdf-autotable', 'error');
    } finally {
      setPdfBusy(false);
    }
  };

  // ── Displayed report (live or saved) ─────────────────────────────────────
  const displayReport = panel === 'view' ? selectedSaved : report;
  const items = displayReport?.evidence || [];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>

      {/* ── Left: Saved reports sidebar ──────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 12 }}>
          SAVED REPORTS
        </div>

        {/* Filter */}
        <div className="search-bar" style={{ marginBottom: 12 }}>
          <span className="search-icon" style={{ fontSize: 13 }}>🔍</span>
          <input
            placeholder="Filter by case number..."
            value={filterCase}
            onChange={e => { setFilterCase(e.target.value); loadSavedReports(e.target.value); }}
            style={{ fontSize: 12 }}
          />
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {savedLoading ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto' }} />
            </div>
          ) : savedReports.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              No saved reports yet.<br />Generate one and click Save.
            </div>
          ) : (
            savedReports.map(r => (
              <div
                key={r._id}
                onClick={() => handleLoadSaved(r._id)}
                style={{
                  padding: '12px 14px',
                  background: selectedSaved?._id === r._id ? 'var(--accent-glow)' : 'var(--bg-card)',
                  border: `1px solid ${selectedSaved?._id === r._id ? 'var(--border-bright)' : 'var(--border)'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                onMouseLeave={e => {
                  if (selectedSaved?._id !== r._id)
                    e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                {/* Type badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1,
                    padding: '2px 6px', borderRadius: 4,
                    background: r.type === 'case' ? 'rgba(0,212,255,0.1)' : 'rgba(255,171,64,0.1)',
                    color:      r.type === 'case' ? 'var(--accent)'        : 'var(--warning)',
                  }}>
                    {r.type === 'case' ? '📋 CASE' : '📊 FULL'}
                  </span>
                  <button
                    onClick={e => handleDelete(r._id, e)}
                    disabled={deletingId === r._id}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--text-muted)', cursor: 'pointer',
                      fontSize: 13, padding: '2px 4px',
                      opacity: deletingId === r._id ? 0.4 : 1,
                    }}
                  >
                    🗑
                  </button>
                </div>

                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, lineHeight: 1.3 }}>
                  {r.caseNumber || 'All Cases'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {r.totalEvidence} items · {fmt(r.createdAt, 'short')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  by {r.generatedByName || r.generatedBy?.name || 'Unknown'}
                </div>
                {r.notes && (
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                    "{r.notes.slice(0, 40)}{r.notes.length > 40 ? '...' : ''}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Right: Generate + Report view ────────────────────────────────── */}
      <div>

        {/* Generate controls */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 16 }}>
            GENERATE REPORT
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {/* Type picker */}
            <div style={{ display: 'flex', gap: 0, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
              {[['case', '📋 Case Report'], ['full', '📊 Full Report']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => { setReportType(val); setReport(null); setSaved(false); }}
                  style={{
                    padding: '7px 14px', border: 'none', borderRadius: 6,
                    background: reportType === val ? 'var(--accent)' : 'transparent',
                    color:      reportType === val ? 'var(--bg-primary)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {reportType === 'case' && (
              <input
                className="form-control"
                placeholder="Case number e.g. CASE-2024-001"
                value={caseNumber}
                onChange={e => setCaseNumber(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                style={{ width: 240 }}
              />
            )}

            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'Generating...' : '⚡ Generate'}
            </button>

            {report && !saved && (
              <button
                className="btn btn-secondary"
                onClick={() => setPanel('generate')}
                disabled={pdfBusy}
                style={{ borderColor: 'var(--success)', color: 'var(--success)' }}
              >
                ↓ Current Report
              </button>
            )}
          </div>
        </div>

        {/* Spinner */}
        {(generating || loadingSaved) && (
          <div className="loading">
            <div className="spinner" />
            <span>{generating ? 'Compiling report...' : 'Loading saved report...'}</span>
          </div>
        )}

        {/* ── Report content ────────────────────────────────────────────── */}
        {displayReport && !generating && !loadingSaved && (
          <>
            {/* Summary card */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>
                    {panel === 'view' ? 'SAVED REPORT' : 'GENERATED REPORT'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>
                    {displayReport.title || (displayReport.caseNumber ? `Case: ${displayReport.caseNumber}` : 'Full System Report')}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {displayReport.reportId}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {fmt(displayReport.generatedAt || displayReport.createdAt, 'full')}
                    {displayReport.generatedByName && ` · by ${displayReport.generatedByName}`}
                  </div>
                  {displayReport.notes && (
                    <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      "{displayReport.notes}"
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 20, flexShrink: 0, flexWrap: 'wrap' }}>
                  {[
                    ['Evidence', displayReport.totalEvidence, 'var(--accent)'],
                    ['Size', formatFileSize(displayReport.totalSize || 0), 'var(--success)'],
                    ...(displayReport.totalCases != null ? [['Cases', displayReport.totalCases, 'var(--warning)']] : []),
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color }}>{val}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save controls (only for live generated report) */}
              {panel === 'generate' && report && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label">Notes (optional)</label>
                    <input
                      className="form-control"
                      placeholder="Add notes before saving..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving || saved}
                    style={saved ? { opacity: 0.6 } : {}}
                  >
                    {saved ? '✓ Saved' : saving ? 'Saving...' : '💾 Save Report'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleDownloadPDF(report)}
                    disabled={pdfBusy}
                  >
                    {pdfBusy ? 'Generating PDF...' : '⬇ Download PDF'}
                  </button>
                </div>
              )}

              {/* Download for saved report */}
              {panel === 'view' && selectedSaved && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleDownloadPDF(selectedSaved)}
                    disabled={pdfBusy}
                  >
                    {pdfBusy ? 'Generating PDF...' : '⬇ Download PDF'}
                  </button>
                </div>
              )}
            </div>

            {/* Category breakdown */}
            {displayReport.byCategory && Object.keys(displayReport.byCategory).length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-title" style={{ marginBottom: 16 }}>Evidence by Category</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {Object.entries(displayReport.byCategory).map(([cat, count]) => (
                    <div key={cat} style={{
                      textAlign: 'center', padding: '12px 20px',
                      background: 'var(--bg-primary)', borderRadius: 10,
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: 26, marginBottom: 4 }}>{getCategoryIcon(cat)}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{count}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">Evidence Inventory ({items.length} items)</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Case #</th>
                      <th>Officer</th>
                      <th>Date</th>
                      <th>Size</th>
                      <th>Status</th>
                      <th>Blockchain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((e, i) => (
                      <tr key={e._id || i}>
                        <td style={{ fontSize: 18 }}>{getCategoryIcon(e.category)}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
                          {e.description && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {e.description.slice(0, 60)}{e.description.length > 60 ? '...' : ''}
                            </div>
                          )}
                          {e.tags?.length > 0 && (
                            <div className="tags-row" style={{ marginTop: 4 }}>
                              {e.tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}
                            </div>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                          {e.caseNumber || displayReport.caseNumber}
                        </td>
                        <td style={{ fontSize: 12 }}>{e.collectedBy}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                          {fmt(e.collectionDate || e.createdAt)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                          {formatFileSize(e.fileSize)}
                        </td>
                        <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
                        <td>
                          {e.onChainId ? (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${e.registrationTxHash}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}
                            >
                              #{e.onChainId} ↗
                            </a>
                          ) : (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chain of custody */}
            {items.some(e => e.chainOfCustody?.length > 0) && (
              <div className="card">
                <div className="card-title" style={{ marginBottom: 20 }}>Chain of Custody</div>
                {items.filter(e => e.chainOfCustody?.length > 0).map(e => (
                  <div key={e._id || e.title} style={{ marginBottom: 24 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
                      color: 'var(--text-secondary)', marginBottom: 10,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      {getCategoryIcon(e.category)} {e.title}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                        {e.caseNumber || displayReport.caseNumber}
                      </span>
                    </div>
                    <div className="custody-timeline">
                      {e.chainOfCustody.map((c, ci) => (
                        <div key={ci} className="custody-item">
                          <div className="custody-dot" />
                          <div className="custody-action">{c.action}</div>
                          <div className="custody-meta">
                            {c.officer} · {fmt(c.timestamp, 'full')}
                          </div>
                          {c.notes && <div className="custody-note">{c.notes}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!displayReport && !generating && !loadingSaved && (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No Report Selected</div>
            <div className="empty-state-sub">
              Generate a new report above or select a saved report from the sidebar.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportsPage;
