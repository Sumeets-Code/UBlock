import evidenceService from "../services/evidence.service.js"

const getAllEvidences = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const data = await evidenceService.fetchAllEvidences({ search, category, status });
    return res.status(200).json(data);
  } catch (error) {
    console.error('getAllEvidences error:', error);
    return res.status(500).json({ message: 'Failed to fetch evidence' });
  }
};


const getStats = async (req, res) => {
  try {
    const stats = await evidenceService.fetchStats()
    return res.status(200).json(stats);
  } catch(error) {
    console.error(`❌getStats Error: ${error.message}`);
    return res.status(500).send({error: 'Status fetch error'})
  }
};


const upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, caseNumber, collectedBy, collectionDate } = req.body;
    if (!title || !caseNumber || !collectedBy || !collectionDate) {
      return res.status(400).json({ message: 'title, caseNumber, collectedBy and collectionDate are required' });
    }

    const saved = await evidenceService.createEvidence(req);

    return res.status(201).json({
      message: 'Evidence uploaded successfully',
      evidence: saved,
    });
  } catch (err) {
    const status = err.status || 500;
    console.error('Upload error:', err);
    return res.status(status).json({ message: err.message || 'Upload failed' });
  }
};


const getEvidenceById = async(req, res) => {
  try {
    const findEvidence = await evidenceService.findEvidenceById(req.params.id);
    return res.status(201).send(findEvidence);
  } catch (err) {
      const status = err.status || 500;
    return res.status(status).send({message: err.message});
  }
}

const statusUpdate = async (req, res) => {
  try {
    const { status, officer, notes } = req.body;
    if (!status) return res.status(400).json({ message: 'status is required' });

    const updated = await evidenceService.statusUpdate(
      req.params.id,
      status,
      officer || req.user?.name,
      notes
    );
    return res.status(200).json({ message: 'Status updated', evidence: updated });
  } catch (err) {
    const s = err.status || 500;
    return res.status(s).json({ message: err.message });
  }
};

const deleteEvidence = async(req, res) => {
  try {
    await evidenceService.deleteEvidence(req.params.id);
    return res.status(200).send({message: "Evidence deleted successfully"});
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).send({error: err.message});
  }
}


export default { upload, getEvidenceById, getAllEvidences, statusUpdate, deleteEvidence, getStats };