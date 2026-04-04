import { getFileCategory } from "../utils/utils.js";
import Evidence from "../models/evidence_model.js";
import path from "node:path";
import fs from "node:fs";
import ipfsService from "./ipfs.service.js";
import blockchainService from "./blockchain.servce.js";

const createEvidence = async (req) => {
  try {
    const { body, file, user } = req;
    const {
      title,
      caseNumber,
      description,
      collectedBy,
      collectionDate,
      location,
      tags,
      status,
    } = body;

    if (!file)
      throw Object.assign(new Error("No file uploaded"), { status: 400 });

    const ext = path.extname(file.originalname).toLowerCase();
    const category = getFileCategory(ext);
    const tagsArray = tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // ── Step 1: Upload to IPFS ────────────────────────────────────────────────
    let ipfsResult;
    try {
      ipfsResult = await ipfsService.uploadFile(file.path, file.originalname);
    } catch (ipfsErr) {
      // Clean up temp file even if IPFS fails
      try {
        fs.unlinkSync(file.path);
      } catch {}
      throw Object.assign(new Error(`IPFS upload failed: ${ipfsErr.message}`), {
        status: 502,
      });
    }

    const { cid, ipfsHash, sha256 } = ipfsResult;
    const ipfsUrl = ipfsService.getGatewayUrl(cid);

    // ── Step 2: Save to MongoDB (without onChainId yet) ───────────────────────
    const evidenceData = {
      title,
      caseNumber,
      description: description || "",
      collectedBy,
      collectionDate: new Date(collectionDate),
      location: location || "",
      tags: tagsArray,
      status: status || "active",
      fileSize: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
      category,
      filePath: ipfsUrl, // public IPFS gateway URL for frontend preview
      ipfsHash: cid, // full CIDv1 string
      ipfsHash32: ipfsHash, // 0x-prefixed bytes32 for on-chain use
      sha256,
      uploadedBy: user?._id || null,
      chainOfCustody: [
        {
          action: "Evidence Uploaded",
          officer: collectedBy,
          notes: `Uploaded via UBlock at ${new Date().toISOString()}. IPFS CID: ${cid}`,
        },
      ],
    };

    // Save to database
    const savedEvidence = await Evidence.create(evidenceData);

    // // ── Step 3: Register on blockchain (best-effort) ───────────────────────────
    // // We don't block the response on blockchain confirmation.
    // // The evidenceId is written back to Mongo asynchronously.
    // registerOnChain(savedEvidence, cid, ipfsHash, file.mimetype).catch((err) =>
    //   console.error(
    //     `Blockchain registration failed for ${savedEvidence._id}:`,
    //     err.message,
    //   ),
    // );

    // ── Step 4: Delete local temp file ────────────────────────────────────────
    try {
      fs.unlinkSync(file.path);
    } catch {}

    _registerOnChainAsync(savedEvidence, cid, ipfsHash, file.mimetype);

    return savedEvidence;
  } catch (error) {
    console.error("❌ Evidence creation error: ", error.message);
    throw error;
  }
};




const _registerOnChainAsync = (savedEvidence, cid, ipfsHash32, mimeType) => {
  blockchainService
    .registerEvidence(ipfsHash32, savedEvidence._id.toString(), mimeType)
    .then(({ evidenceId, txHash }) =>
      Evidence.findByIdAndUpdate(savedEvidence._id, {
        onChainId: evidenceId,
        registrationTxHash: txHash,
        $push: {
          chainOfCustody: {
            action: "Registered on Blockchain",
            officer: "System (Operator)",
            notes: `onChainId: ${evidenceId} | tx: ${txHash}`,
          },
        },
      }),
    )
    .catch((err) =>
      console.error(
        `Async blockchain registration failed for ${savedEvidence._id}:`,
        err.message,
      ),
    );
};







// const registerOnChain = async (savedEvidence, cid, ipfsHash32, mimeType) => {
//   const { evidenceId, txHash } = await blockchainService.registerEvidence(
//     ipfsHash32,
//     savedEvidence._id.toString(),
//     mimeType,
//   );

//   await Evidence.findByIdAndUpdate(savedEvidence._id, {
//     onChainId: evidenceId,
//     registrationTxHash: txHash,
//     chainOfCustody: [
//       ...savedEvidence.chainOfCustody,
//       {
//         action: "Registered on Blockchain",
//         officer: "System",
//         notes: `onChainId: ${evidenceId} | tx: ${txHash}`,
//       },
//     ],
//   });

//   console.log(
//     `✅ MongoDB updated with onChainId=${evidenceId} for ${savedEvidence._id}`,
//   );
// };




const findEvidenceById = async (evidenceId) => {
  try {
    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      throw Object.assign(new Error(`Evidence not found: ${evidenceId}`), {
        status: 404,
      });
    }
    return evidence;
  } catch (error) {
    console.error(`findEvidenceById error: ${error}`);
  }
};

const fetchAllEvidences = async ({ search, category, status } = {}) => {
  try {
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { title: regex },
        { caseNumber: regex },
        { description: regex },
        { collectedBy: regex },
      ];
    }
    return Evidence.find(query).sort({ createdAt: -1 });
      
  } catch (error) {
    console.error(`fetchAllEvidences Error: ${error.message}`)
  }
};

const statusUpdate = async (evidenceId, newStatus, officer, notes) => {
  try {
    const evidence = await findEvidenceById(evidenceId);
      
    evidence.status = newStatus;
    evidence.chainOfCustody.push({
      action: `Status changed to ${newStatus}`,
      officer: officer || "System",
      notes: notes || "",
    });

    const saved = await evidence.save();

    // Log to blockchain if this evidence has an onChainId
    if (evidence.onChainId) {
      blockchainService
        .recordCustodyEvent(
          evidence.onChainId,
          "STATUS_UPDATED",
          `${newStatus} by ${officer || "System"}${notes ? ` — ${notes}` : ""}`,
        )
        .catch((err) =>
          console.warn("Blockchain custody event failed:", err.message),
        );
    }

    return saved;

  } catch (error) {
    console.error(`statusUpdate Error: ${error.message}`)
  }
};


const deleteEvidence = async (evidenceId, deletedBy) => {
  try {
    const evidence = await findEvidenceById(evidenceId);

    // Blockchain soft-delete (best-effort)
    if (evidence.onChainId) {
      blockchainService
        .deleteOnChain(evidence.onChainId, deletedBy || "System")
        .catch((err) => console.warn("Blockchain delete failed:", err.message));
    }

    await Evidence.findByIdAndDelete(evidence._id);
      
  } catch (error) {
    console.error(`deleteEvidence Error: ${error.message}`)
  }
};

const fetchStats = async (req, res) => {
  try {
    const [total, byCategory, byStatus, recentUploads] = await Promise.all([
      Evidence.countDocuments(),
      Evidence.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
      Evidence.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Evidence.find()
        .sort({ createdAt: -1 })
        .limit(4)
        .select("title caseNumber category collectedBy createdAt"),
    ]);
    return { total, byCategory, byStatus, recentUploads };
    
  } catch (error) {
    console.error(`fetchStats Error: ${error.message}`)
  }
};


const fetchCustodyAuditLog = async (evidenceId) => {
  try {
    const evidence = await findEvidenceById(evidenceId);
      
      // Fall back to MongoDB chain of custody if not yet on-chain
    if (!evidence.onChainId) {
      return { source: "mongodb", events: evidence.chainOfCustody };
    }
    
    const events = await blockchainService.getCustodyEvents(evidence.onChainId);
    return { source: "blockchain", onChainId: evidence.onChainId, events };
    
  } catch (error) {
    console.error(`fetchCustodyAuditLog Error: ${error.message}`)
  }
};


const fetchCaseReport = async (caseNumber) => {
  try {
    const items = await Evidence.find({ caseNumber }).sort({ createdAt: 1 });
    if (!items.length) {
      throw Object.assign(
        new Error(`No evidence found for case: ${caseNumber}`),
        { status: 404 },
      );
    }

    const byCategory = items.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {});

    const totalSize = items.reduce((s, e) => s + (e.fileSize || 0), 0);

    return {
      reportId: `RPT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      caseNumber,
      totalEvidence: items.length,
      totalSize,
      byCategory,
      evidence: items,
    };
  } catch (error) {
    console.error(`fetchCaseReport Error: ${error.message}`)
  }
};


  

const fetchFullReport = async () => {
  try {
    const items = await Evidence.find().sort({ createdAt: -1 });

    const byCategory = items.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {});

    const totalSize = items.reduce((s, e) => s + (e.fileSize || 0), 0);
    const totalCases = [...new Set(items.map((e) => e.caseNumber))].length;

    return {
      reportId: `RPT-FULL-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      totalEvidence: items.length,
      totalCases,
      totalSize,
      byCategory,
      evidence: items,
    };
      
  } catch (error) {
    console.error(`fetchFullReport Error: ${error.message}`)
  }
};


/**
 * prepareUpload
 *
 * Step 1 of the user-pays-gas flow.
 *  1. Upload file to IPFS via Pinata/local node
 *  2. Save a PENDING evidence record to MongoDB
 *  3. Delete the local temp file
 *  4. Return { mongoId, ipfsHash32, cid, mimeType } to the frontend
 *     so the browser can call the contract directly via MetaMask
*/
const prepareUpload = async (req) => {
  try {
    const { body, file, user } = req;
    const {
      title,
      caseNumber,
      description,
      collectedBy,
      collectionDate,
      location,
      tags,
      walletAddress,
    } = body;

    if (!file)
      throw Object.assign(new Error("No file uploaded"), { status: 400 });

    const ext = path.extname(file.originalname).toLowerCase();
    const category = getFileCategory(ext);
    const tagsArr = tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // Step 1: IPFS
    let ipfsResult;
    try {
      ipfsResult = await ipfsService.uploadFile(file.path, file.originalname);
    } catch (err) {
      try {
        fs.unlinkSync(file.path);
      } catch {}
      throw Object.assign(new Error(`IPFS upload failed: ${err.message}`), {
        status: 502,
      });
    }

    const { cid, ipfsHash, sha256 } = ipfsResult;
    const ipfsUrl = ipfsService.getGatewayUrl(cid);

    // Step 2: Save pending record (no onChainId yet)
    const pending = await Evidence.create({
      title,
      caseNumber,
      description: description || "",
      collectedBy,
      collectionDate: new Date(collectionDate),
      location: location || "",
      tags: tagsArr,
      status: "pending", // pending until blockchain confirms
      fileSize: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
      category,
      filePath: ipfsUrl,
      ipfsHash: cid,
      ipfsHash32: ipfsHash,
      sha256,
      uploaderAddress: walletAddress || null,
      uploadedBy: user?._id || null,
      chainOfCustody: [
        {
          action: "Evidence Uploaded to IPFS",
          officer: collectedBy,
          notes: `CID: ${cid} | Awaiting blockchain confirmation`,
        },
      ],
    });

    // Step 3: Clean up temp file — it now lives on IPFS
    try {
      fs.unlinkSync(file.path);
    } catch {}

    // Step 4: Return what the frontend needs to call the contract
    return {
      mongoId: pending._id.toString(),
      ipfsHash32: ipfsHash, // 0x bytes32 for registerEvidenceByUser()
      cid,
      mimeType: file.mimetype,
      ipfsUrl,
    };
    
  } catch (error) {
    console.error(`prepareUpload Error: ${error.message}`)
  }
};


/**
 * confirmUpload
 *
 * Step 2 — called by the frontend after MetaMask confirms the tx.
 * Finalises the MongoDB record with the on-chain evidenceId and txHash.
 */
const confirmUpload = async ({
  mongoId,
  evidenceId,
  txHash,
  walletAddress,
}) => {
  try {
    if (!mongoId || !evidenceId || !txHash) {
      throw Object.assign(
        new Error("mongoId, evidenceId and txHash are required"),
        { status: 400 },
      );
    }
    
    
    
    const existing = await Evidence.findById(mongoId);
    if (!existing) {
      throw Object.assign(new Error(`Evidence record ${mongoId} not found`), {
        status: 404,
      });
    }

      // ✅ FIX: Idempotency guard — if already confirmed, return current record as-is
      if (existing.onChainId != null) {
        console.log(
          `confirmUpload: ${mongoId} already confirmed (onChainId=${existing.onChainId})`,
        );
        return existing;
      }

      existing.status = "active";
      existing.onChainId = evidenceId;
      existing.registrationTxHash = txHash;
      existing.uploaderAddress = walletAddress || existing.uploaderAddress;
      existing.chainOfCustody.push({
        action: "Registered on Blockchain",
        officer: "User Wallet",
        notes: `onChainId: ${evidenceId} | tx: ${txHash} | wallet: ${walletAddress || "unknown"}`,
      });

      return existing.save();

    // const updated = await Evidence.findByIdAndUpdate(
    //   mongoId,
    //   {
    //     status: "active", // promote from pending
    //     onChainId: evidenceId,
    //     registrationTxHash: txHash,
    //     uploaderAddress: walletAddress || null,
    //     $push: {
    //       chainOfCustody: {
    //         action: "Registered on Blockchain",
    //         officer: "User Wallet",
    //         notes: `onChainId: ${evidenceId} | tx: ${txHash} | wallet: ${walletAddress || "unknown"}`,
    //       },
    //     },
    //   },
    //   { new: true },
    // );

    // if (!updated) {
    //   throw Object.assign(new Error(`Evidence record ${mongoId} not found`), {
    //     status: 404,
    //   });
    // }

    // return updated;
    
  } catch (error) {
    console.error(`confirmUpload Error: ${error.message}`)
  }
};


export default {
  createEvidence,
  findEvidenceById,
  statusUpdate,
  fetchAllEvidences,
  deleteEvidence,
  fetchStats,
  fetchFullReport,
  fetchCaseReport,
  fetchCustodyAuditLog,
  prepareUpload,
  confirmUpload,
};
