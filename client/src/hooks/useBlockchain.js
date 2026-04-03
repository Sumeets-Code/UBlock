import { useState, useCallback } from 'react';
import { useWallet } from '../context/WalletProvider.jsx';

/**
 * useBlockchain
 *
 * Drives the MetaMask transaction entirely through window.ethereum —
 * no ethers.js or web3.js bundle required on the frontend.
 *
 * Encodes calldata for EvidenceVault.registerEvidenceByUser(bytes32,string,string)
 * manually so the only dependency is the Vite env var VITE_CONTRACT_ADDRESS.
 *
 * Transaction status machine:
 *   idle → pending (MetaMask popup) → confirming (waiting for block) → confirmed | error
 */

const CONTRACT_ADDRESS = () => import.meta.env.VITE_CONTRACT_ADDRESS;

// ── Function selector ────────────────────────────────────────────────────────
// keccak256("registerEvidenceByUser(bytes32,string,string)") → first 4 bytes
// Computed offline; verify with:
//   node -e "const {ethers}=require('ethers'); console.log(ethers.id('registerEvidenceByUser(bytes32,string,string)').slice(0,10))"
const SELECTOR = 'fef62a85';

// ── ABI-encode a single UTF-8 string to ABI dynamic format ───────────────────
const encodeAbiString = (str) => {
  const bytes  = new TextEncoder().encode(str);
  const lenHex = bytes.length.toString(16).padStart(64, '0');
  const dataHex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  // Pad to a multiple of 32 bytes (64 hex chars)
  const padded  = dataHex.padEnd(Math.ceil(dataHex.length / 64) * 64, '0');
  return lenHex + padded;
};

// ── Full calldata encoder ─────────────────────────────────────────────────────
const encodeCalldata = (ipfsHash32, mongoId, fileType) => {
  // Static: bytes32 (32 bytes) + offset_mongoId (32) + offset_fileType (32) = 96 bytes static
  const hash = ipfsHash32.replace(/^0x/i, '').padStart(64, '0');

  const enc1 = encodeAbiString(mongoId);
  const enc2 = encodeAbiString(fileType);

  // Offsets are measured from the start of the dynamic section (after the 3 static words)
  // offset of mongoId  = 96 (3 × 32)
  // offset of fileType = 96 + 32 + (enc1.length / 2)
  const off1 = (96).toString(16).padStart(64, '0');
  const off2 = (96 + 32 + enc1.length / 2).toString(16).padStart(64, '0');

  return SELECTOR + hash + off1 + off2 + enc1 + enc2;
};

// ── Parse evidenceId from receipt logs ───────────────────────────────────────
// We find the first log emitted BY our contract and read topic[1] as uint256.
// topic[0] = event signature hash
// topic[1] = first indexed param = evidenceId (uint256)
const parseEvidenceId = (receipt, contractAddress) => {
  const addr = (contractAddress || '').toLowerCase();
  for (const log of receipt.logs || []) {
    if (log.address?.toLowerCase() === addr && log.topics?.length >= 2) {
      return parseInt(log.topics[1], 16);
    }
  }
  return null;
};

// ── Poll for transaction receipt ─────────────────────────────────────────────
const waitForReceipt = async (txHash, maxAttempts = 90) => {
  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await window.ethereum.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    });
    if (receipt) return receipt;
    await new Promise(r => setTimeout(r, 2000)); // poll every 2 s
  }
  throw new Error('Transaction not confirmed after 3 minutes');
};

// ── The hook ─────────────────────────────────────────────────────────────────
export const useBlockchain = () => {
  const { account, isConnected, isCorrectNetwork, switchToSepolia } = useWallet();

  const [txHash,   setTxHash]   = useState(null);
  const [txStatus, setTxStatus] = useState('idle'); // idle | pending | confirming | confirmed | error
  const [txError,  setTxError]  = useState(null);

  /**
   * registerEvidenceOnChain
   *
   * @param {string} ipfsHash32  0x-prefixed 32-byte hex from the backend
   * @param {string} mongoId     MongoDB _id string
   * @param {string} fileType    MIME type string e.g. "image/jpeg"
   * @returns {Promise<{ evidenceId: number|null, txHash: string }>}
   */
  const registerEvidenceOnChain = useCallback(async (ipfsHash32, mongoId, fileType) => {
    setTxError(null);
    setTxHash(null);
    setTxStatus('idle');

    const contractAddr = CONTRACT_ADDRESS();
    if (!contractAddr) throw new Error('VITE_CONTRACT_ADDRESS is not set in .env');
    if (!isConnected)  throw new Error('Wallet not connected');

    // Ensure Sepolia before doing anything
    if (!isCorrectNetwork) await switchToSepolia();

    try {
      setTxStatus('pending');

      const calldata = '0x' + encodeCalldata(ipfsHash32, mongoId, fileType);

      // Estimate gas (with 20 % buffer)
      let gasLimit;
      try {
        const est = await window.ethereum.request({
          method: 'eth_estimateGas',
          params: [{ from: account, to: contractAddr, data: calldata }],
        });
        gasLimit = '0x' + Math.ceil(parseInt(est, 16) * 1.2).toString(16);
        // const gasLimit = '0x' + (BigInt(est) * 120n / 100n).toString(16);

      } catch {
        gasLimit = '0x' + (130_000).toString(16); // safe fallback
      }

      // Open MetaMask popup — user reviews gas and confirms
      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: account, to: contractAddr, data: calldata, gas: gasLimit }],
      });

      setTxHash(hash);
      setTxStatus('confirming');

      // Poll until mined
      const receipt = await waitForReceipt(hash);

      if (receipt.status !== '0x1') {
        throw new Error('Transaction reverted on-chain. Check contract address and inputs.');
      }

      const evidenceId = parseEvidenceId(receipt, contractAddr);
      setTxStatus('confirmed');

      return { evidenceId, txHash: hash };

    } catch (err) {
      setTxStatus('error');
      const msg = err.code === 4001
        ? 'Transaction rejected — you cancelled in MetaMask.'
        : (err.message || 'Transaction failed');
      setTxError(msg);
      throw new Error(msg);
    }
  }, [account, isConnected, isCorrectNetwork, switchToSepolia]);

  const reset = useCallback(() => {
    setTxHash(null);
    setTxStatus('idle');
    setTxError(null);
  }, []);

  return { registerEvidenceOnChain, txHash, txStatus, txError, reset };
};
