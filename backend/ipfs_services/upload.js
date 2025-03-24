// import { Buffer } from 'buffer';
import { ipfs } from './index.js';

export async function uploadToIPFS(file) {
    const { cid } = await ipfs.add(file.buffer); // Add file to IPFS
    return {
        success: true,
        cid: cid.toString(), // Return the CID of the uploaded file
    };
}