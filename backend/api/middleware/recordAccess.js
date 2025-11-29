import Evidence from "../models/evidence_model.js";
import blockchainServces from "../services/blockchain.servces.js";

const recordAccess = async(req, res, next) => {
  try {
    const { evidenceId, walletAddress } = req.body;

    if (!evidenceId || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Evidence ID and wallet address are required'
      });
    }

    // Verify evidence exists
    const evidence = await Evidence.findOne({ index: evidenceId });
    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: 'Evidence not found'
      });
    }

    // Record access on blockchain
    const result = await blockchainServces.recordAccess(evidenceId, walletAddress);
    
    next();

  } catch (error) {
    console.error('Access recording error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record access'
    });
  }
}

export default recordAccess;