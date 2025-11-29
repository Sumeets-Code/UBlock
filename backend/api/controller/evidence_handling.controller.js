import { uploadToIPFS } from "../../ipfs_services";
import { retrieveFromIPFS } from "../../ipfs_services";
import { getFileCategory } from "../utils/utils";
import Evidence from "../models/evidence_model";
import path from 'node:path';

const upload = async (req, res) => {
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
}

const retrieve = async(req, res) => {
    // const file
    try {
        retrieveFromIPFS(cid, fileExtension);
    } catch (err) {
        
    }
}



export default { upload, retrieve }