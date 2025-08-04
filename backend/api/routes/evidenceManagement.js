// routes/evidence.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadToIPFS } from '../../ipfs_services/upload.js';
import Evidence from '../models/evidence_model.js';
import blockchainService from '../services/blockchain/blockchain_servces.js';

const router = express.Router();
const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit (adjust as needed)
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types
    cb(null, true);
  }
});

// Helper function to get file type category
const getFileCategory = (extension) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
  const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];

  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'video';
  if (audioExtensions.includes(extension)) return 'audio';
  if (documentExtensions.includes(extension)) return 'document';
  return 'other';
};

// POST route to upload evidence
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    if (!req.body.walletAddress) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    // Get file extension and category
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const fileCategory = getFileCategory(fileExtension);

    // Get file size
    function byteConverter(bytes) {
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }

    const FileSize = byteConverter(req.file.size);

    // Upload to IPFS
    const ipfsResult = await uploadToIPFS(req.file);


    
    // Prepare evidence data
    const evidenceData = {
      index: Date.now().toString(),
      uploaderAddress: req.body.walletAddress,
      timestamp: req.body.timestamp || new Date().toISOString(),
      ipfsHash: ipfsResult.cid.toString(),
      fileType: fileExtension,
      fileCategory: fileCategory,
      description: req.body.description || '',
      fileSize: FileSize,
    };

    // Save to database
    const savedEvidence = await Evidence.create(evidenceData);

    return res.status(201).json({
      success: true,
      message: 'Evidence uploaded and registered on blockchain',
      evidence: {
        ...savedEvidence._doc,
        fileUrl: `https://ipfs.io/ipfs/${savedEvidence.ipfsHash}`,
        downloadUrl: `/api/evidence/download?id=${savedEvidence._id}`
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process evidence upload',
      details: error.response?.data || null
    });
  }
});

// GET route to download evidence
router.get('/download', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Evidence ID required' });
    }

    const evidence = await Evidence.findById(id);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    // Redirect to IPFS gateway
    return res.redirect(`https://ipfs.io/ipfs/${evidence.ipfsHash}`);

  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ error: 'Failed to process download' });
  }
});

// GET route to fetch all evidence
router.get('/allEvidences', async (req, res) => {
  try {
    const evidences = await Evidence.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .lean(); // Convert to plain JS objects

    const formattedEvidences = evidences.map(evidence => ({
      ...evidence,
      fileUrl: `https://ipfs.io/ipfs/${evidence.ipfsHash}`,
      date: new Date(evidence.timestamp).toISOString()
    }));

    return res.json(formattedEvidences);
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch evidences'
    });
  }
});

// POST route to record evidence access
router.post('/recordAccess', async (req, res) => {
  try {
    const { evidenceId, walletAddress } = req.body;

    if (!evidenceId || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Evidence ID and wallet address are required'
      });
    }

    // Verify evidence exists
    const evidence = await Evidence.findOne({ index: evidenceId });
    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: 'Evidence not found'
      });
    }

    // Record access on blockchain
    const result = await blockchainService.recordAccess(evidenceId, walletAddress);

    return res.json({
      success: true,
      message: 'Access recorded successfully',
      transactionHash: result.transactionHash
    });

  } catch (error) {
    console.error('Access recording error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record access'
    });
  }
});

// GET route to fetch access logs
router.get('/getLogs', async (req, res) => {
  try {
    const { evidenceId } = req.query;
    
    if (!evidenceId) {
      return res.status(400).json({
        success: false,
        error: 'Evidence ID is required'
      });
    }

    const logs = await blockchainService.getAccessLogs(evidenceId);
    return res.json({
      success: true,
      evidenceId,
      accessLogs: logs,
      totalViews: logs.length
    });

  } catch (error) {
    console.error('Logs fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch access logs'
    });
  }
});

export default router;