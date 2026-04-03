import Evidence from '../models/evidence_model.js';
import blockchainService from '../services/blockchain.servce.js';

/**
 * recordAccess middleware
 *
 * - Verifies the evidence exists in MongoDB
 * - Attaches it to req.evidence so the controller doesn't fetch it again
 * - Logs the access on-chain (fire-and-forget so blockchain lag never
 *   blocks the HTTP response)
 */




const recordAccess = async (req, res, next) => {
  try {
    const evidenceId = req.params.id;

    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    req.evidence = evidence;   // hand off to controller

    // Fire-and-forget blockchain access log
    if (evidence.onChainId && process.env.SEPOLIA_URL) {
      const actor = req.user?.name || req.user?.email || 'Anonymous';
      blockchainService.recordAccess(evidence.onChainId, actor)
        .catch(err => console.warn(`Blockchain recordAccess warn [${evidenceId}]:`, err.message));
    }

    next();
  } catch (err) {
    console.error('recordAccess middleware error:', err);
    return res.status(500).json({ message: 'Failed to process request' });
  }
};

export default recordAccess;
