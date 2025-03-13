import IPFS from 'ipfs-core';
import { uploadToIPFS } from './upload.mjs';
import { retrieveFromIPFS } from './retrieve.mjs';

let ipfs;

async function initIPFS() {
    ipfs = await IPFS.create();
}

initIPFS().catch(err => {
    console.error('Failed to initialize IPFS:', err);
});

export { uploadToIPFS, retrieveFromIPFS };