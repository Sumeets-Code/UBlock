import React, { useState } from 'react';
import { fmt, formatFileSize, getCategoryIcon } from '../utils/api.js';
import { useToast } from '../context/ToastProvider.jsx';
import API from '../utils/api.js';


function ReportsPage() {
  const [reportType, setReportType] = useState('case');
  const [caseNumber, setCaseNumber] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const toast = useToast();

  const fetchReport = async () => {
    if (reportType === 'case' && !caseNumber.trim()) return toast('Please enter a case number', 'error');
    setLoading(true); setReport(null);
    try {
      // GET /api/reports/case/:caseNumber  or  GET /api/reports/full
      const endpoint = reportType === 'case'
        ? `/reports/case/${encodeURIComponent(caseNumber.trim())}`
        : '/reports/full';
      const { data } = await API.get(endpoint);
      setReport(data);
      toast('Report generated successfully');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!report) return;
    setGenerating(true);
    try {
      // Dynamically import jsPDF only when needed
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();

      doc.setFillColor(7, 13, 24);
      doc.rect(0, 0, W, 42, 'F');
      doc.setFillColor(0, 212, 255);
      doc.rect(0, 0, 4, 42, 'F');
      doc.setTextColor(0, 212, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('UBlock', 14, 16);
      doc.setTextColor(180, 200, 220);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('EVIDENCE PROTECTION SYSTEM — OFFICIAL REPORT', 14, 23);

      const items = report.evidence || (report.cases?.flatMap(c => c.items) || []);

      if (items.length > 0) {
        autoTable(doc, {
          startY: 55,
          head: [['Title', 'Case #', 'Category', 'Officer', 'Date', 'Status', 'Size']],
          body: items.map(e => [e.title, e.caseNumber || report.caseNumber || '-', e.category, e.collectedBy, fmt(e.collectionDate || e.uploadedAt), e.status, formatFileSize(e.fileSize)]),
          theme: 'grid',
          headStyles: { fillColor: [0, 100, 130], textColor: [232, 244, 253], fontStyle: 'bold', fontSize: 8 },
          bodyStyles: { fillColor: [7, 13, 24], textColor: [200, 220, 240], fontSize: 7.5 },
          alternateRowStyles: { fillColor: [11, 21, 37] },
          margin: { left: 10, right: 10 },
        });
      }

      const filename = reportType === 'case'
        ? `UBlock_Report_${report.caseNumber}_${Date.now()}.pdf`
        : `UBlock_Full_Report_${Date.now()}.pdf`;
      doc.save(filename);
      toast('PDF downloaded successfully');
    } catch {
      toast('PDF generation failed — install jspdf and jspdf-autotable', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // const items = report?.evidence || (report?.cases?.flatMap(c => c.items.map(i => ({ ...i, caseNumber: c.caseNumber }))) || []);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 6 }}>FORENSIC REPORTING</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Generate official evidence reports with chain of custody documentation.</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 20 }}>Report Configuration</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Report Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['case', '📋 Case Report'], ['full', '📊 Full System Report']].map(([val, label]) => (
                <button key={val} onClick={() => { setReportType(val); setReport(null); }} className={`btn ${reportType === val ? 'btn-primary' : 'btn-secondary'}`}>{label}</button>
              ))}
            </div>
          </div>
          {reportType === 'case' && (
            <div className="form-group" style={{ margin: 0, minWidth: 240 }}>
              <label className="form-label">Case Number</label>
              <input className="form-control" placeholder="e.g., CASE-2024-001" value={caseNumber} onChange={e => setCaseNumber(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchReport()} style={{ width: 220 }} />
            </div>
          )}
          <button className="btn btn-primary" onClick={fetchReport} disabled={loading}>{loading ? 'Generating...' : '⚡ Generate Report'}</button>
          {report && <button className="btn btn-secondary" onClick={downloadPDF} disabled={generating}>{generating ? 'Preparing PDF...' : '⬇ Download PDF'}</button>}
        </div>
      </div>

      {loading && <div className="loading"><div className="spinner" /><span>Compiling report data...</span></div>}

      {report && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>REPORT GENERATED</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
                  {report.caseNumber ? `Case: ${report.caseNumber}` : 'Full System Report'}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>ID: {report.reportId} · {fmt(report.generatedAt, 'full')}</div>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {[['Evidence Items', report.totalEvidence || 0, 'var(--accent)'], ['Total Size', formatFileSize(report.totalSize || 0), 'var(--success)'], ...(report.totalCases !== undefined ? [['Cases', report.totalCases, 'var(--warning)']] : [])].map(([label, val, color]) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color }}>{val}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {report.byCategory && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title" style={{ marginBottom: 16 }}>Evidence by Category</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {Object.entries(report.byCategory).map(([cat, count]) => (
                  <div key={cat} style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{getCategoryIcon(cat)}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{count}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title">Evidence Inventory ({items.length} items)</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Type</th><th>Title</th><th>Case #</th><th>Officer</th><th>Date</th><th>Size</th><th>Status</th><th>Tags</th></tr></thead>
                <tbody>
                  {items.map((e, i) => (
                    <tr key={e._id || i}>
                      <td style={{ fontSize: 20 }}>{getCategoryIcon(e.category)}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
                        {e.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{e.description.substring(0, 60)}{e.description.length > 60 ? '...' : ''}</div>}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{e.caseNumber || report.caseNumber}</td>
                      <td style={{ fontSize: 13 }}>{e.collectedBy}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{fmt(e.collectionDate || e.uploadedAt)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{formatFileSize(e.fileSize)}</td>
                      <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
                      <td><div className="tags-row">{e.tags?.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {items.some(e => e.chainOfCustody?.length > 0) && (
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-title" style={{ marginBottom: 20 }}>Chain of Custody</div>
              {items.filter(e => e.chainOfCustody?.length > 0).map(e => (
                <div key={e._id} style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    {getCategoryIcon(e.category)} {e.title}
                  </div>
                  <div className="custody-timeline">
                    {e.chainOfCustody.map((c, i) => (
                      <div key={i} className="custody-item">
                        <div className="custody-dot" />
                        <div className="custody-action">{c.action}</div>
                        <div className="custody-meta">{c.officer} · {fmt(c.timestamp, 'full')}</div>
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
    </div>
  );
}

export default ReportsPage;
