import express from 'express';
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


export default router;