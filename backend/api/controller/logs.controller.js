import { getEvidenceContract } from '../utils/utils.js';
import Evidence from '../models/evidence_model.js';

// ── GET /evidence/logs?evidenceId=:id ─────────────────────────────────────────
const fetchLogs = async (req, res) => {
  try {
    const { evidenceId } = req.query;

    if (!evidenceId) {
      return res.status(400).json({ message: 'evidenceId query param is required' });
    }

    // Verify evidence exists in DB first
    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    let accessLogs = [];

    // Blockchain logs are optional — if blockchain is not configured, fall back to chainOfCustody
    if (process.env.SEPOLIA_URL && process.env.CONTRACT_ADDRESS) {
      try {
        const contract = await getEvidenceContract();
        const [addresses, timestamps] = await contract.methods.getAccessLogs(evidenceId).call();
        accessLogs = addresses.map((addr, i) => ({
          userAddress:     addr,
          accessTimestamp: new Date(Number(timestamps[i]) * 1000).toISOString(),
        }));
      } catch (blockchainErr) {
        console.warn('Blockchain logs unavailable, using chain of custody:', blockchainErr.message);
        accessLogs = evidence.chainOfCustody;
      }
    } else {
      accessLogs = evidence.chainOfCustody;
    }

    return res.status(200).json({
      evidenceId,
      accessLogs,
      totalViews: accessLogs.length,
    });
  } catch (err) {
    console.error('fetchLogs error:', err);
    return res.status(500).json({ message: 'Failed to fetch access logs', error: err.message });
  }
};

export default { fetchLogs };
