import Evidence from '../models/evidence_model.js';
import Report from '../models/report_model.js';

// ── Generate a case report (live, not yet saved) ──────────────────────────────
const generateCaseReport = async (caseNumber) => {
  const items = await Evidence.find({ caseNumber: caseNumber.trim() }).sort({ createdAt: 1 });
  if (!items.length) {
    throw Object.assign(
      new Error(`No evidence found for case: ${caseNumber}`), { status: 404 }
    );
  }

  const byCategory = items.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  return {
    reportId:      `RPT-${caseNumber.trim().replace(/\s+/g, '-')}-${Date.now()}`,
    title:         `Case Report — ${caseNumber.trim()}`,
    type:          'case',
    caseNumber:    caseNumber.trim(),
    generatedAt:   new Date().toISOString(),
    totalEvidence: items.length,
    totalSize:     items.reduce((s, e) => s + (e.fileSize || 0), 0),
    byCategory,
    evidence:      items.map(e => e.toObject()),
  };
};

// ── Generate a full system report (live, not yet saved) ───────────────────────
const generateFullReport = async () => {
  const items = await Evidence.find().sort({ createdAt: -1 });

  const byCategory = items.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  return {
    reportId:      `RPT-FULL-${Date.now()}`,
    title:         'Full System Report',
    type:          'full',
    caseNumber:    null,
    generatedAt:   new Date().toISOString(),
    totalEvidence: items.length,
    totalSize:     items.reduce((s, e) => s + (e.fileSize || 0), 0),
    totalCases:    [...new Set(items.map(e => e.caseNumber))].length,
    byCategory,
    evidence:      items.map(e => e.toObject()),
  };
};

// ── Save a generated report to MongoDB ───────────────────────────────────────
const saveReport = async (reportData, userId, userName, notes = '') => {
  // Prevent exact duplicate saves (same reportId)
  const existing = await Report.findOne({ reportId: reportData.reportId });
  if (existing) return existing;

  const saved = await Report.create({
    reportId:        reportData.reportId,
    title:           reportData.title,
    type:            reportData.type,
    caseNumber:      reportData.caseNumber || null,
    totalEvidence:   reportData.totalEvidence,
    totalSize:       reportData.totalSize || 0,
    totalCases:      reportData.totalCases ?? null,
    byCategory:      reportData.byCategory || {},
    evidence:        reportData.evidence || [],
    generatedBy:     userId,
    generatedByName: userName,
    notes,
  });

  return saved;
};

// ── List saved reports (newest first, optional filter by caseNumber) ──────────
const listReports = async ({ caseNumber, type, limit = 50, skip = 0 } = {}) => {
  const query = {};
  if (caseNumber) query.caseNumber = { $regex: caseNumber, $options: 'i' };
  if (type)       query.type       = type;

  const [reports, total] = await Promise.all([
    Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-evidence') // exclude the large evidence array from list view
      .populate('generatedBy', 'name email'),
    Report.countDocuments(query),
  ]);

  return { reports, total };
};

// ── Get a single saved report with full evidence ──────────────────────────────
const getReportById = async (id) => {
  const report = await Report.findById(id).populate('generatedBy', 'name email');
  if (!report) {
    throw Object.assign(new Error('Report not found'), { status: 404 });
  }
  return report;
};

// ── Delete a saved report ─────────────────────────────────────────────────────
const deleteReport = async (id, requestingUserId, requestingUserRole) => {
  const report = await Report.findById(id);
  if (!report) throw Object.assign(new Error('Report not found'), { status: 404 });

  // Only the creator or an admin can delete
  const isOwner = report.generatedBy.toString() === requestingUserId.toString();
  const isAdmin = requestingUserRole === 'admin';
  if (!isOwner && !isAdmin) {
    throw Object.assign(new Error('You can only delete your own reports'), { status: 403 });
  }

  await Report.findByIdAndDelete(id);
};

export default {
  generateCaseReport,
  generateFullReport,
  saveReport,
  listReports,
  getReportById,
  deleteReport,
};
