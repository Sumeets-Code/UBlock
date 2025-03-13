import { Buffer } from 'buffer';
import { ipfs } from './index.mjs'; // Import the initialized IPFS instance

export async function uploadToIPFS(file) {
    const fileBuffer = Buffer.from(file); // Convert file to buffer
    const { cid } = await ipfs.add(fileBuffer); // Add file to IPFS

    return {
        success: true,
        cid: cid.toString(), // Return the CID of the uploaded file
    };
}