import { useState, useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';

// Minimal ABI — only the function we call from the browser
const ABI = [
  'function registerEvidenceByUser(bytes32 ipfsHash, string mongoId, string fileType) returns (uint256)',
  'event EvidenceRegistered(uint256 indexed evidenceId, bytes32 indexed ipfsHash, address indexed uploadedBy, string mongoId, string fileType, uint64 timestamp)',
];

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export const useEvidenceVault = () => {
  const [txHash,     setTxHash]     = useState(null);
  const [evidenceId, setEvidenceId] = useState(null);
  const [pending,    setPending]    = useState(false);
  const [error,      setError]      = useState(null);

  /**
   * registerEvidence
   * Signs and sends the on-chain registration transaction with MetaMask.
   *
   * @param {string} ipfsHash32  0x-prefixed 32-byte hex (from the backend)
   * @param {string} mongoId     MongoDB _id (from the backend)
   * @param {string} mimeType    e.g. "image/jpeg"
   * @returns {{ evidenceId: number, txHash: string }}
   */
  const registerEvidence = useCallback(async (ipfsHash32, mongoId, mimeType) => {
    setError(null);
    setPending(true);
    setTxHash(null);
    setEvidenceId(null);

    try {
      if (!window.ethereum) throw new Error('MetaMask is not installed');
      if (!CONTRACT_ADDRESS) throw new Error('VITE_CONTRACT_ADDRESS not set in .env');

      // BrowserProvider wraps MetaMask — the user signs with their wallet
      const provider = new BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

      // MetaMask pops up here asking the user to confirm + pay gas
      const tx      = await contract.registerEvidenceByUser(ipfsHash32, mongoId, mimeType);
      setTxHash(tx.hash);

      // Wait for 1 confirmation
      const receipt = await tx.wait(1);

      // Parse the EvidenceRegistered event to extract the on-chain ID
      const iface = contract.interface;
      const log   = receipt.logs
        .map(l => { try { return iface.parseLog(l); } catch { return null; } })
        .find(l => l?.name === 'EvidenceRegistered');

      const id = log ? Number(log.args.evidenceId) : null;
      setEvidenceId(id);

      return { evidenceId: id, txHash: receipt.hash };

    } catch (err) {
      // User rejected — code 4001
      const msg = err.code === 4001
        ? 'Transaction rejected in MetaMask'
        : (err.reason || err.message || 'Transaction failed');
      setError(msg);
      throw new Error(msg);
    } finally {
      setPending(false);
    }
  }, []);

  return { registerEvidence, txHash, evidenceId, pending, error };
};
