import express from 'express';
import multer from 'multer';
import { uploadToIPFS, retrieveFromIPFS } from '../../ipfs_services/index.js';
import evidence from '../models/evidence_model.js';
import path from 'path';
const router = express.Router();

const upload = multer();

router.post('/upload', upload.single('file') ,async (req, res) => {
  
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const result = await uploadToIPFS(file);

        const fileExtension = path.extname(file.originalname);
        
        function byteConverter(bytes) {
            return (bytes / (1024 * 1024)).toFixed(2) + " MB";
        }

        const FileSize = byteConverter(file.size);
        
        const eviData = {
            index: req.body.index,
            name: req.body.name,
            uploaderAddress: req.body.uploaderAddress,
            timestamp: req.body.timestamp,
            ipfsHash: result.cid,
            fileType: fileExtension,
            discription: req.body.discription,
            fileSize: FileSize,
        }
        
        try{
            await evidence.insertOne(eviData);
            res.status(201).json({ message: 'Evidence uploaded successfully.' });
        } catch(err) {
            console.error("Error inserting evidence: ", err);
            res.status(500).json({ message: err.message });
        }

    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        res.status(500).json({ error: 'Failed to upload to IPFS.' });
    }
})

router.get('/evidence', async (req, res) => {
    const evidenceId = req.query.index;
    try {
        const evi = await evidence.findOne({ index: evidenceId });

        if (evi) {
            await retrieveFromIPFS(evi.ipfsHash, evi.fileType);
            res.status(200).json({ message: 'Evidence retrieved successfully.' });
        } else {
            res.status(404).json({ error: 'Evidence not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

router.post('/newCase', async (req, res) => {
    try {
        const newEvidence = new evidence(req.body); 
        await newEvidence.save();
        res.json(newEvidence); 
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

export default router;