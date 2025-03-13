import { ipfs } from './index.mjs'; // Import the initialized IPFS instance

export async function retrieveFromIPFS(cid) {
    const stream = ipfs.cat(cid); // Retrieve the file stream from IPFS
    let data = '';

    for await (const chunk of stream) {
        data += chunk.toString(); // Concatenate the chunks into a single string
    }

    return data; // Return the retrieved file data
}