import evidenceService from '../services/evidence.service.js';

// ── GET /reports/case/:caseNumber ─────────────────────────────────────────────
const getCaseReport = async (req, res) => {
  try {
    const report = await evidenceService.fetchCaseReport(req.params.caseNumber);
    return res.status(200).json(report);
  } catch (err) {
    const status = err.status || 500;
    console.error('getCaseReport error:', err.message);
    return res.status(status).json({ message: err.message });
  }
};

// ── GET /reports/full ─────────────────────────────────────────────────────────
const getFullReport = async (req, res) => {
  try {
    const report = await evidenceService.fetchFullReport();
    return res.status(200).json(report);
  } catch (err) {
    console.error('getFullReport error:', err.message);
    return res.status(500).json({ message: err.message || 'Failed to generate report' });
  }
};

export default { getCaseReport, getFullReport };
