import Evidence from '../models/evidence_model.js';

// Records that a user accessed a piece of evidence.
// Blockchain call is wrapped in a try/catch so a blockchain failure
// never blocks the actual evidence retrieval.
const recordAccess = async (req, res, next) => {
  try {
    const evidenceId = req.params.id || req.body.evidenceId;

    if (!evidenceId) {
      return res.status(400).json({ message: 'Evidence ID is required' });
    }

    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    // Attach to request so the controller does not have to fetch it again
    req.evidence = evidence;

    // Best-effort blockchain access log — failure must not block the request
    if (process.env.SEPOLIA_URL && process.env.CONTRACT_ADDRESS) {
      try {
        const { getEvidenceContract } = await import('../utils/utils.js');
        const contract = await getEvidenceContract();
        // Fire-and-forget; we do not await this on the critical path
        contract.methods.recordAccess(evidenceId).send({
          from: process.env.OPERATOR_ADDRESS,
        }).catch(err => console.warn('Blockchain recordAccess warning:', err.message));
      } catch (blockchainErr) {
        console.warn('Blockchain unavailable, access not logged on-chain:', blockchainErr.message);
      }
    }

    next();
  } catch (error) {
    console.error('recordAccess middleware error:', error);
    return res.status(500).json({ message: 'Failed to process evidence access' });
  }
};

export default recordAccess;































// import Evidence from "../models/evidence_model.js";
// // import blockchainServces from "../services/blockchain.servces.js";

// const recordAccess = async(req, res, next) => {
//   try {
//     const { evidenceId, walletAddress } = req.body;

//     if (!evidenceId || !walletAddress) {
//       return res.status(400).json({
//         success: false,
//         error: 'Evidence ID and wallet address are required'
//       });
//     }

//     // Verify evidence exists
//     const evidence = await Evidence.findOne({ index: evidenceId });
//     if (!evidence) {
//       return res.status(404).json({
//         success: false,
//         error: 'Evidence not found'
//       });
//     }

//     // Record access on blockchain
//     const result = await blockchainServces.recordAccess(evidenceId, walletAddress);
    
//     next();

//   } catch (error) {
//     console.error('Access recording error:', error);
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to record access'
//     });
//   }
// }

// export default recordAccess;
