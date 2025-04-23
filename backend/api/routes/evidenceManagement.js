import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer';
import { uploadToIPFS, retrieveFromIPFS } from '../../ipfs_services/index.js';
import evidence from '../models/evidence_model.js';
import { getEvidenceContract, fetchLogs } from '../middleware/helperFunc.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = path.join(__dirname, '../uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const upload = multer({ storage: storage });
const upload = multer();

// POST route to upload evidence
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded.' 
      });
    }

    const result = await uploadToIPFS(file);
    const fileExtension = path.extname(file.originalname);
    
    function byteConverter(bytes) {
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }

    const FileSize = byteConverter(file.size);
    
    // const eviData = {
    //   index: req.body.index,
    //   name: req.body.name,
    //   uploaderAddress: req.body.uploaderAddress,
    //   timestamp: req.body.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
    //   ipfsHash: result.cid,
    //   fileType: fileExtension,
    //   discription: req.body.discription,
    //   fileSize: FileSize,
    // };
    
    // Corrected eviData and removed registerOnBlockchain condition
    const eviData = {
      index: req.body.evidenceId,
      uploaderAddress: req.body.walletAddress,
      timestamp: req.body.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
      ipfsHash: result.cid,
      fileType: req.body.fileType,
      description: req.body.description, // Corrected typo
      fileSize: FileSize,
    };

    try {
      // Always register on blockchain
      const contract = await getEvidenceContract();
      const transaction = await contract.methods
        .registerEvidence(result.cid, fileExtension)
        .send({ 
          from: req.body.walletAddress, 
          gas: process.env.GAS_LIMIT || 3000000 
        });
      
      eviData.transactionHash = transaction.transactionHash;
      
      await evidence.create(eviData);
      
      res.status(201).json({ 
        success: true,
        message: 'Evidence uploaded successfully.',
        ipfsHash: result.cid,
        transactionHash: transaction.transactionHash // Include in response
      });
    } catch (err) {
      console.error("Error inserting evidence: ", err);
      res.status(500).json({ 
        success: false,
        message: err.message 
      });
    }
//     // 
//     try {
//       // Register on blockchain if needed
//       if (req.body.registerOnBlockchain) {
//         const contract = await getEvidenceContract();
//         const transaction = await contract.methods
//           .registerEvidence(result.cid, fileExtension)
//           .send({ 
//             from: req.body.uploaderAddress, 
//             gas: process.env.GAS_LIMIT || 3000000 
//           });
        
//         // Add transaction hash to the evidence data
//         eviData.transactionHash = transaction.transactionHash;
//       }
      
//       // Insert into MongoDB
//       await evidence.create(eviData);
      
//       res.status(201).json({ 
//         success: true,
//         message: 'Evidence uploaded successfully.',
//         ipfsHash: result.cid
//       });
//     } catch (err) {
//       console.error("Error inserting evidence: ", err);
//       res.status(500).json({ 
//         success: false,
//         message: err.message 
//       });
//     }
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload to IPFS.' 
    });
  }
});

// GET route to retrieve evidence by index
router.get('/retrieve', async (req, res) => {
  const evidenceId = req.query.index;
  try {
    const evi = await evidence.findOne({ index: evidenceId });

    if (evi) {
      await retrieveFromIPFS(evi.ipfsHash, evi.fileType);
      res.status(200).json({ 
        success: true,
        message: 'Evidence retrieved successfully.',
        evidence: evi
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: 'Evidence not found' 
      });
    }
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// GET route to fetch all evidence
router.get('/evidence', async (req, res) => {
  try {
    // Fetch all evidence from MongoDB
    const evidences = await evidence.find({});
    
    res.status(200).json({
      success: true,
      evidence: evidences
    });
  } catch (error) {
    console.error('Error fetching evidence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evidence',
      error: error.message
    });
  }
});

// POST route to record evidence access
router.post('/recordAccess', async (req, res) => {
  try {
    const { evidenceId, ipfsHash, walletAddress } = req.body;

    if (!evidenceId || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Evidence ID and wallet address are required'
      });
    }

    // Find the evidence in MongoDB
    const evi = await evidence.findOne({ index: evidenceId });
    
    if (!evi) {
      return res.status(404).json({
        success: false,
        message: 'Evidence not found'
      });
    }

    // Record access on blockchain
    const contract = await getEvidenceContract();
    
    // Call the recordAccess method on the smart contract
    const transaction = await contract.methods
      .recordAccess(evidenceId)
      .send({ 
        from: walletAddress,
        gas: process.env.GAS_LIMIT || 3000000
      });

    // Create an access log schema and model if you decide to store logs in MongoDB
    // For now, we're just recording on the blockchain
    
    res.status(200).json({
      success: true,
      message: 'Access recorded successfully',
      transactionHash: transaction.transactionHash
    });
  } catch (error) {
    console.error('Error recording access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record access',
      error: error.message
    });
  }
});

// GET route to fetch access logs
router.get('/getLogs', async (req, res) => {
  try {
    const logs = await fetchLogs(req);
    
    res.status(200).json({
      success: true,
      evidenceId: req.query.evidenceId,
      accessLogs: logs,
      totalViews: logs.length
    });
  } catch (error) {
    console.error('Error fetching access logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch access logs',
      error: error.message
    });
  }
});

export default router;