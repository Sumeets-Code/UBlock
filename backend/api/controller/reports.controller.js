import reportService from '../services/report.service.js';

// ── GET /reports/generate/case/:caseNumber ────────────────────────────────────
// Generates a live report without saving it
const generateCase = async (req, res) => {
  try {
    const report = await reportService.generateCaseReport(req.params.caseNumber);
    return res.status(200).json(report);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

// ── GET /reports/generate/full ────────────────────────────────────────────────
const generateFull = async (req, res) => {
  try {
    const report = await reportService.generateFullReport();
    return res.status(200).json(report);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── POST /reports/save ────────────────────────────────────────────────────────
// Body: { report: <reportObject>, notes?: string }
const save = async (req, res) => {
  try {
    const { report, notes } = req.body;
    if (!report || !report.reportId) {
      return res.status(400).json({ message: 'report object with reportId is required' });
    }

    const saved = await reportService.saveReport(
      report,
      req.user._id,
      req.user.name,
      notes || ''
    );

    return res.status(201).json({ message: 'Report saved', report: saved });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

// ── GET /reports/saved ────────────────────────────────────────────────────────
// Query params: ?caseNumber=&type=case|full&limit=&skip=
const listSaved = async (req, res) => {
  try {
    const { caseNumber, type, limit, skip } = req.query;
    const result = await reportService.listReports({
      caseNumber,
      type,
      limit: limit ? parseInt(limit) : 50,
      skip:  skip  ? parseInt(skip)  : 0,
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── GET /reports/saved/:id ────────────────────────────────────────────────────
const getSaved = async (req, res) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    return res.status(200).json(report);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

// ── DELETE /reports/saved/:id ─────────────────────────────────────────────────
const deleteSaved = async (req, res) => {
  try {
    await reportService.deleteReport(req.params.id, req.user._id, req.user.role);
    return res.status(200).json({ message: 'Report deleted' });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};



export default { generateCase, generateFull, save, listSaved, getSaved, deleteSaved };
