import express from 'express';
import evidence from '../models/evidence_model.js';
const router = express.Router();

router.get('/getEvidence', async (req, res) => {
    try {
        await evidence.findOne({ name: req.query.name });
        res.json(evidence);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

router.post('/addEvidence', async (req, res) => {

    const hashedFile = await hashFile(req.body.file);
    
    const eviData = {
        name: req.body.name,
        uploaderAddress: req.body.uploaderAddress,
        timestamp: req.body.timestamp,
        ipfsHash: hashedFile,
        fileType: req.body.fileType,
        discription: req.body.discription,
    }

    try{
        const newEvi = await evidence.insertOne(eviData);
        res.redirect('/evidence').send(alert("Evidence Uploaded"));

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

export default router;