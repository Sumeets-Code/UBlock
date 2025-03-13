import express from 'express';
import { uploadToIPFS, retrieveFromIPFS } from '../../ipfs_services/index.js';
import evidence from '../models/evidence_model.js';
const router = express.Router();

router.get('/evidence', async (req, res) => {
    try {
        await evidence.findOne({ name: req.query.name });
        res.json(evidence);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

router.post('/add', async (req, res) => {
    
    const eviData = {
        name: req.body.name,
        hash: req.body.hashedFile,
        fileType: req.body.fileType,
    }

    try{
        const newEvi = await evidence.insertOne(eviData);
        res.redirect('/evidence');
    } catch(err) {
        console.error("Error inserting evidence: ", err);
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


// Endpoint to upload evidence
router.post('/upload', async (req, res) => {
    const result = await uploadToIPFS(req.body.file);
    res.json(result);
});

// Endpoint to retrieve evidence
router.get('/retrieve/:hash', async (req, res) => {
    const file = await retrieveFromIPFS(req.params.hash);
    res.send(file);
});

export default router;