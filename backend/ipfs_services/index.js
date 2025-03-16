import * as IPFS from 'ipfs-core';
import { uploadToIPFS } from './upload.js';
import { retrieveFromIPFS } from './retrieve.js';

let ipfs;

async function initIPFS() {
    ipfs = await IPFS.create();
}

initIPFS().catch(err => {
    console.error('Failed to initialize IPFS:', err);
});

export { uploadToIPFS, retrieveFromIPFS, ipfs };