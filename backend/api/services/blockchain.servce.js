import { ethers } from 'ethers';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
dotenv.config();


const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load deployment artefact ──────────────────────────────────────────────────
const DEPLOYMENT_PATH = path.join(__dirname, '..', 'blockchain', 'deployment.json');

let _provider = null;
let _wallet   = null;
let _contract = null;

const init = () => {
  try {
    if (_contract) return _contract;    // singleton

    if (!fs.existsSync(DEPLOYMENT_PATH)) {
      throw new Error(
        'blockchain/deployment.json not found. Run: cd blockchain && npm run deploy:sepolia'
      );
    }

    const deployment = JSON.parse(fs.readFileSync(DEPLOYMENT_PATH, 'utf8'));

    const rpcUrl = process.env.SEPOLIA_URL;
    const privKey = process.env.OPERATOR_PRIVATE_KEY;
    if (!rpcUrl)  throw new Error('SEPOLIA_URL not set in .env');
    if (!privKey) throw new Error('OPERATOR_PRIVATE_KEY not set in .env');

    _provider = new ethers.JsonRpcProvider(rpcUrl);
    _wallet   = new ethers.Wallet(privKey, _provider);
    _contract = new ethers.Contract(deployment.contractAddress, deployment.abi, _wallet);

    return _contract;
      
  } catch (error) {
    console.error(`Contract initialization error in BCService: ${error.message}`)
  }
};


// ── Nonce mutex — prevents "already known" / nonce collisions ─────────────────
// All operator transactions are serialised through this queue so no two
// concurrent requests ever use the same nonce.
let _nonceLock = Promise.resolve();

const withNonceLock = (fn) => {
  _nonceLock = _nonceLock.then(fn).catch(err => {
    console.error('Blockchain tx error:', err.message);
    throw err;
  });
  return _nonceLock;
};




// ── Gas estimate helper (add 20 % buffer) ────────────────────────────────────
const estimateWithBuffer = async (txPromise) => {
  try {
    const estimate = await txPromise;
    return (estimate * 120n) / 100n;  
  } catch (error) {
    console.error(`Gas estimate helper Error in BCService: ${error.message}`);
  }
};


// ── EIP-1559 gas override ─────────────────────────────────────────────────────
// Uses provider.getFeeData() which queries eth_feeHistory and computes
// optimal maxFeePerGas and maxPriorityFeePerGas automatically.
// Unspent gas is refunded — only actual usage is charged.
const getGasOverrides = async () => {
  const feeData = await _provider.getFeeData();
  return {
    maxFeePerGas:         feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
  };
};

// ── Access debounce — prevents duplicate recordAccess txs ────────────────────
// Maps `${onChainId}:${actor}` → lastLoggedAt (ms)
const _accessCache = new Map();
const ACCESS_DEBOUNCE_MS = 60_000; // 60 seconds

const shouldLogAccess = (onChainId, actor) => {
  const key  = `${onChainId}:${actor}`;
  const last = _accessCache.get(key);
  if (last && Date.now() - last < ACCESS_DEBOUNCE_MS) return false;
  _accessCache.set(key, Date.now());
  return true;
};



// ── Write: register evidence on-chain after IPFS upload ──────────────────────
/**
 * @param {string} ipfsHash32  0x-prefixed 32-byte hex from ipfs.service.cidToBytes32()
 * @param {string} mongoId     MongoDB _id string
 * @param {string} fileType    MIME type e.g. "image/jpeg"
 * @returns {{ evidenceId: number, txHash: string }}
 */


const registerEvidence = async (ipfsHash32, mongoId, fileType) => 
  withNonceLock(async () => {
    const contract = init();
    const gasOverrides = await getGasOverrides();
    const gasLimit = await contract.registerEvidence
      .estimateGas(ipfsHash32, mongoId, fileType)
      .then(g => (g * 110n) / 100n);  // 10% buffer

    const tx      = await contract.registerEvidenceByUser(ipfsHash32, mongoId, fileType, { gasLimit, ...gasOverrides });
    const receipt = await tx.wait();

    const log = receipt.logs
      .map(l => { try { return contract.interface.parseLog(l); } catch { return null; } })
      .find(l => l?.name === 'EvidenceRegistered');

    const evidenceId = log ? Number(log.args.evidenceId) : null;
    console.log(`✅ Registered onChainId=${evidenceId} | tx=${receipt.hash}`);
    return { evidenceId, txHash: receipt.hash };
  });


//   {
//   try {
//     const contract = init();

//     const gasLimit = await estimateWithBuffer(
//       contract.registerEvidenceByUser.estimateGas(ipfsHash32, mongoId, fileType)
//     );

//     const tx      = await contract.registerEvidenceByUser(ipfsHash32, mongoId, fileType, { gasLimit });
//     const receipt = await tx.wait();

//     // Parse the EvidenceRegistered event to get the on-chain evidenceId
//     const iface = contract.interface;
//     const log   = receipt.logs
//       .map(l => { try { return iface.parseLog(l); } catch { return null; } })
//       .find(l => l?.name === 'EvidenceRegistered');

//     const evidenceId = log ? Number(log.args.evidenceId) : null;

//     console.log(`✅ Evidence #${evidenceId} registered | tx: ${receipt.hash}`);
//     return { evidenceId, txHash: receipt.hash };
    
//   } catch (error) {
//     console.error(`RegisterEvidence Error in bcService: ${error.message}`)
//   }
// };


// ── Write: record an access event (fire-and-forget safe) ─────────────────────
/**
 * @param {number} onChainId  The evidenceId returned by registerEvidence
 * @param {string} actor      Name of the person who accessed it
 */
const recordAccess = async (onChainId, actor) => {
  if (!shouldLogAccess(onChainId, actor)) {
    console.log(`recordAccess debounced for #${onChainId} by "${actor}"`);
    return Promise.resolve(null);
  }
  return withNonceLock(async () => {
    const contract = init();
    const gasOverrides = await getGasOverrides();
    const gasLimit = await contract.recordAccess
      .estimateGas(onChainId, actor)
      .then(g => (g * 110n) / 100n);
    const tx = await contract.recordAccess(onChainId, actor, { gasLimit, ...gasOverrides });
    await tx.wait();
    console.log(`✅ Access #${onChainId} by "${actor}" | tx=${tx.hash}`);
    return tx.hash;
  });
};
  
//   {
//   try {
//     const contract = init();
//     const gasLimit = await estimateWithBuffer(
//       contract.recordAccess.estimateGas(onChainId, actor)
//     );
//     const tx = await contract.recordAccess(onChainId, actor, { gasLimit });
//     await tx.wait();
//     console.log(`✅ Access logged for #${onChainId} by "${actor}" | tx: ${tx.hash}`);
//     return tx.hash;
//   } catch (error) {
//     console.error(`RecordAccess Error in BCService: ${error.message}`)
//   }
// };

// ── Write: record any custody event (status change, update, etc.) ─────────────
/**
 * @param {number} onChainId  evidenceId
 * @param {string} action     e.g. "STATUS_UPDATED"
 * @param {string} detail     e.g. "archived by Det. Kim"
 */
const recordCustodyEvent = async (onChainId, action, detail) => 
  withNonceLock(async () => {
    const contract = init();
    const gasOverrides = await getGasOverrides();
    const gasLimit = await contract.recordCustodyEvent
      .estimateGas(onChainId, action, detail)
      .then(g => (g * 110n) / 100n);
    const tx = await contract.recordCustodyEvent(onChainId, action, detail, { gasLimit, ...gasOverrides });
    await tx.wait();
    return tx.hash;
  });
//   {
//   try {
//     const contract = init();
//     const gasLimit = await estimateWithBuffer(
//       contract.recordCustodyEvent.estimateGas(onChainId, action, detail)
//     );
//     const tx = await contract.recordCustodyEvent(onChainId, action, detail, { gasLimit });
//     await tx.wait();
//     console.log(`✅ Custody event "${action}" for #${onChainId} | tx: ${tx.hash}`);
//     return tx.hash;
      
//   } catch (error) {
//     console.error(`RecordCustodyEvent Error in BCService: ${error.message}`)
//   }
// };



// ── Write: soft-delete ────────────────────────────────────────────────────────
const deleteOnChain = async (onChainId, deletedBy) =>
  withNonceLock(async () => {
    const contract = init();
    const gasOverrides = await getGasOverrides();
    const gasLimit = await contract.deleteEvidence
      .estimateGas(onChainId, deletedBy)
      .then(g => (g * 110n) / 100n);
    const tx = await contract.deleteEvidence(onChainId, deletedBy, { gasLimit, ...gasOverrides });
    await tx.wait();
    return tx.hash;
  });

//   {
//   try {
//     const contract = init();
//     const gasLimit = await estimateWithBuffer(
//       contract.deleteEvidence.estimateGas(onChainId, deletedBy)
//     );
//     const tx = await contract.deleteEvidence(onChainId, deletedBy, { gasLimit });
//     await tx.wait();
//     console.log(`✅ Evidence #${onChainId} soft-deleted | tx: ${tx.hash}`);
//     return tx.hash;
      
//   } catch (error) {
//     console.error(`DeleteOnChain Error in BcService: ${error.message}`)
//   }
// };




// ── Read: get all custody events for one evidence item via eth_getLogs ────────
/**
 * Uses event filter (free view) — no stored arrays, no gas.
 * @param {number} onChainId
 * @returns {Array<{ action, detail, actor, timestamp, txHash }>}
*/
const getCustodyEvents = async (onChainId) => {
  try {
    const contract = init();

    const filter = contract.filters.CustodyEvent(onChainId);
    const logs   = await contract.queryFilter(filter, 0, 'latest');

    return logs.map(log => ({
      action:    log.args.action,
      detail:    log.args.detail,
      actor:     log.args.actor,
      timestamp: new Date(Number(log.args.timestamp) * 1000).toISOString(),
      txHash:    log.transactionHash,
      blockNumber: log.blockNumber,
    }));
    
      
  } catch (error) {
    console.error(`GetCustodyEvents Error in BCService: ${error.message}`)
  }
};




// ── Read: verify IPFS hash integrity ──────────────────────────────────────────
const verifyIntegrity = async (onChainId, ipfsHash32) => {
  try {
    const contract = init();
    return contract.verifyIntegrity(onChainId, ipfsHash32);
    
  } catch (error) {
    console.error(`verifyIntegrity Error in BCService: ${error.message}`)
  }
};




// ── Read: get on-chain evidence record ───────────────────────────────────────
const getOnChainEvidence = async (onChainId) => {
  try {
    const contract = init();
    const [ipfsHash, uploadedBy, uploadedAt, lastUpdatedAt, deleted] =
      await contract.getEvidence(onChainId);
    return {
      ipfsHash,
      uploadedBy,
      uploadedAt:    new Date(Number(uploadedAt)    * 1000).toISOString(),
      lastUpdatedAt: new Date(Number(lastUpdatedAt) * 1000).toISOString(),
      deleted,
    };
    
  } catch (error) {
    console.error(`getOnChainEvidence Error in BCService: ${error.message}`)
  }
};


export default {
  registerEvidence,
  recordAccess,
  recordCustodyEvent,
  deleteOnChain,
  getCustodyEvents,
  verifyIntegrity,
  getOnChainEvidence,
};
