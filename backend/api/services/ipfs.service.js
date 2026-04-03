import { create } from "kubo-rpc-client";
import fs from "node:fs";
import crypto from "node:crypto";
import dotenv from "dotenv";
import pinataSDK from "@pinata/sdk";
import { CID } from 'multiformats/cid';
dotenv.config();

/**
 * IPFS Service
 *
 * Uses Pinata (or any Kubo-compatible gateway) in production.
 * Falls back to a local IPFS node when PINATA_JWT is absent (dev mode).
 *
 * Cost note: Pinata free tier = 1 GB pinned storage, 100 GB bandwidth/month.
 * For evidence files you almost certainly want a paid pin so files persist.
 */

// ── Client factory ────────────────────────────────────────────────────────────

const uploadViaPinata = async (filePath, filename) => {
  const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });

  const result = await pinata.pinFileToIPFS(fs.createReadStream(filePath), {
    pinataMetadata: { name: filename },
  });

  return result.IpfsHash;
};

const uploadViaLocal = async (filePath, filename) => {
  try {
    const client = create({ url: "http://127.0.0.1:5001" });

    const result = await client.add({
      path: filename,
      content: fs.readFileSync(filePath),
    });


    // const result = await client.add(
    //   { path: filename, content: fileBuffer },
    //   {
    //     cidVersion: 1, // CIDv1 uses sha2-256 by default
    //     pin: true, // pin immediately so it isn't GC'd
    //     wrapWithDirectory: false,
    //   },
    // );

    // const cid = result.cid.toString();

    return result.cid.toString();
    
  } catch (error) {
    console.error(`uploadViaLocal Error: ${error.message}`)
  }
};




// ── Upload a file from disk to IPFS ──────────────────────────────────────────
/**
 * @param {string} filePath   Absolute path to the file on disk
 * @param {string} filename   Original filename (for metadata)
 * @returns {{ cid: string, ipfsHash: string, sha256: string, size: number }}
 *   cid       — full CIDv1 string  (e.g. "bafybei...")
 *   ipfsHash  — hex-encoded sha2-256 digest (32 bytes) for on-chain storage
 *   sha256    — hex SHA-256 of the raw file bytes (integrity check)
 *   size      — bytes uploaded
 */


const uploadFile = async (filePath, filename) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    let cid;

    // 1️⃣ Try Pinata
    try {
      console.log("Trying Pinata...");
      cid = await uploadViaPinata(filePath, filename);
    } catch (err) {
      console.warn("Pinata failed:", err.message);

      // 2️⃣ Fallback to local IPFS
      try {
        console.log("Trying local IPFS...");
        cid = await uploadViaLocal(filePath, filename);
      } catch (err2) {
        console.error("Local IPFS failed:", err2.message);

        // 3️⃣ Queue retry
        await queueRetry(filePath, filename);

        throw new Error("All upload providers failed");
      }
    }

    const ipfsHash = cidToBytes32(cid);

    return { cid, ipfsHash, sha256 };
    return { cid, ipfsHash, sha256, size: result.size };
      
  } catch (error) {
    console.error(`uploadFile Error: ${error.message}`)
  }
};


// ── Retry Queue ─────────────────────────────────────────────────
const retryQueue = [];

const queueRetry = async (filePath, filename) => {
  retryQueue.push({ filePath, filename, retries: 0 });
};


setInterval(async () => {
  for (const job of retryQueue) {
    try {
      console.log("Retrying upload:", job.filename);

      const cid = await uploadViaPinata(job.filePath, job.filename);

      console.log("Retry success:", cid);

      // remove from queue
      retryQueue.splice(retryQueue.indexOf(job), 1);

    } catch (err) {
      job.retries++;
      console.warn("Retry failed:", job.retries);

      if (job.retries > 3) {
        console.error("Max retries reached:", job.filename);
      }
    }
  }
}, 30000); // every 30 sec















// ── Retrieve a file from IPFS ─────────────────────────────────────────────────
/**
 * @param {string} cid  Full CIDv1 string
 * @returns {Buffer}    File content as a Buffer
 */
const retrieveFile = async (cid) => {
  const client = getClient();
  const chunks = [];
  for await (const chunk of client.cat(cid)) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

// ── Build a public gateway URL (no local node needed for reading) ─────────────
const getGatewayUrl = (cid) => {
  const gateway = process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs";
  return `${gateway}/${cid}`;
};












// ── CID → bytes32 helper ──────────────────────────────────────────────────────
/**
 * Extracts the 32-byte sha2-256 digest from a CIDv1 multihash.
 * Returns a hex string prefixed with 0x, ready for Solidity bytes32.
 *
 * Multihash layout: <varint fn code> <varint digest len> <digest bytes>
 * For sha2-256:  fn=0x12 (2 bytes varint), len=0x20 (1 byte varint), then 32 bytes.
 */


// const cidToBytes32 = (cid) => {
//   // toV1 ensures CIDv1, then get the raw multihash bytes
//   const mh = cid.toV1().multihash.bytes;
//   // Skip the 2-byte function code varint + 1-byte length varint
//   const digest = mh.slice(2, 34);
//   return "0x" + Buffer.from(digest).toString("hex");
// };

// CID → bytes32
const cidToBytes32 = (cidStr) => {
  const cid = CID.parse(cidStr).toV1();
  const digest = cid.multihash.digest; // raw 32 bytes
  return '0x' + Buffer.from(digest).toString('hex');
};

/**
 * Inverse: convert a bytes32 hex string back to the sha2-256 multihash prefix
 * so we can reconstruct the CID for retrieval.
 * Note: this gives you the digest; to get the full CID you also need the codec
 * (dag-pb = 0x70 for files). In practice just store the full CID string in MongoDB.
 */
const bytes32ToCid = (hex) => {
  // Re-prefix with sha2-256 multihash header: 0x1220
  return "1220" + hex.replace("0x", "");


};

// // bytes32 → CID (for reconstruction)
// const bytes32ToCid = (bytes32Hex) => {
//   const digest = Buffer.from(bytes32Hex.replace('0x', ''), 'hex');

//   // sha2-256 multihash prefix = 0x12 0x20
//   const multihashBytes = new Uint8Array([0x12, 0x20, ...digest]);

//   return CID.createV1(0x70, { // 0x70 = dag-pb (file codec)
//     code: 0x12,
//     size: 32,
//     digest: multihashBytes.slice(2),
//     bytes: multihashBytes,
//   }).toString();
// };

export default {
  uploadFile,
  retrieveFile,
  getGatewayUrl,
  cidToBytes32,
  bytes32ToCid,
};
