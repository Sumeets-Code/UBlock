import { getFileCategory } from "../utils/utils.js";
import Evidence from "../models/evidence_model.js";
import path from "node:path";

const createEvidence = async (req) => {
  
  try {
    const {body, file, user} = req;

    const {
      title, caseNumber, description, collectedBy,
      collectionDate, location, tags, status,
    } = body;

    if (!file) throw Object.assign(new Error('No file uploaded'), { status: 400 });

    const ext          = path.extname(file.originalname).toLowerCase();
    const category     = getFileCategory(ext);
    const tagsArray    = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    const evidenceData = {
      title,
      caseNumber,
      description:    description || '',
      collectedBy,
      collectionDate: new Date(collectionDate),
      location:       location || '',
      tags:           tagsArray,
      status:         status || 'active',
      fileSize:       file.size,
      mimeType:       file.mimetype,
      originalName:   file.originalname,
      category,
      filePath:       `/uploads/${file.filename}`,  // served statically by express
      uploadedBy:     user?._id || null,
      chainOfCustody: [{
        action:  'Evidence Uploaded',
        officer: collectedBy,
        notes:   `Uploaded via UBlock at ${new Date().toISOString()}`,
      }],
    };

    // Save to database
    const savedEvidence = await Evidence.create(evidenceData);
    return savedEvidence;
  } catch (error) {
    console.error("❌ Evidence creation error: ", error.message);
    throw error;
  }
};

const findEvidenceById = async (evidenceId) => {
  try {
    const evidence = await Evidence.findById(evidenceId);

    if (!evidence) {
      throw Object.assign(new Error(`Evidence not found: ${evidenceId}`), { status: 404 });
    }

    return evidence;

  } catch (error) {
    console.error(`findEvidenceById error: ${error}`);
  }
};


const fetchAllEvidences = async ({ search, category, status } = {}) => {
  const query = {};
  if (category) query.category = category;
  if (status)   query.status = status;
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { title: regex },
      { caseNumber: regex },
      { description: regex },
      { collectedBy: regex },
    ];
  }
  return Evidence.find(query).sort({ createdAt: -1 });
};

const statusUpdate = async (evidenceId, newStatus, officer, notes) => {
  const evidence = await findEvidenceById(evidenceId);

  evidence.status = newStatus;
  evidence.chainOfCustody.push({
    action:  `Status changed to ${newStatus}`,
    officer: officer || 'System',
    notes:   notes   || '',
  });

  return evidence.save();
};

const deleteEvidence = async (evidenceId) => {
  const evidence = await findEvidenceById(evidenceId);
  await Evidence.findByIdAndDelete(evidence._id);
};

const fetchStats = async (req, res) => {
  const [total, byCategory, byStatus, recentUploads] = await Promise.all([
    Evidence.countDocuments(),
    Evidence.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    Evidence.aggregate([{ $group: { _id: '$status',   count: { $sum: 1 } } }]),
    Evidence.find().sort({ createdAt: -1 }).limit(4).select('title caseNumber category collectedBy createdAt'),
  ]);
  return { total, byCategory, byStatus, recentUploads };
};


const fetchCaseReport = async (caseNumber) => {
  const items = await Evidence.find({ caseNumber }).sort({ createdAt: 1 });
  if (!items.length) {
    throw Object.assign(new Error(`No evidence found for case: ${caseNumber}`), { status: 404 });
  }

  const byCategory = items.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  const totalSize = items.reduce((s, e) => s + (e.fileSize || 0), 0);

  return {
    reportId:      `RPT-${Date.now()}`,
    generatedAt:   new Date().toISOString(),
    caseNumber,
    totalEvidence: items.length,
    totalSize,
    byCategory,
    evidence:      items,
  };
};


const fetchFullReport = async () => {
  const items = await Evidence.find().sort({ createdAt: -1 });

  const byCategory = items.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  const totalSize  = items.reduce((s, e) => s + (e.fileSize || 0), 0);
  const totalCases = [...new Set(items.map(e => e.caseNumber))].length;

  return {
    reportId:      `RPT-FULL-${Date.now()}`,
    generatedAt:   new Date().toISOString(),
    totalEvidence: items.length,
    totalCases,
    totalSize,
    byCategory,
    evidence:      items,
  };
};

export default {
  createEvidence,
  findEvidenceById,
  statusUpdate,
  fetchAllEvidences,
  deleteEvidence,
  fetchStats,
  fetchFullReport,
  fetchCaseReport
};
