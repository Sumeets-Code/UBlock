import express from 'express';
import { uploadToIPFS, retrieveFromIPFS } from '../../ipfs_services/index.js';
const router = express.Router();


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