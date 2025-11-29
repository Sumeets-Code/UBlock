import { ipfs } from './index.js';
import fs from 'fs';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegPath.path);

export async function retrieveFromIPFS(cid, outputFormat) {
    try {
        // Retrieve the file from IPFS
        const stream = ipfs.cat(cid);
        const filePath = `./Downloads/${cid}`; // Temporary file path
        const writeStream = fs.createWriteStream(filePath);
        
        for await (const chunk of stream) {
            writeStream.write(chunk); // Write each chunk to the file
        }

        writeStream.end(); // Close the write stream
        writeStream.on('finish', async () => {
            console.log(`File retrieved: ${filePath}`);
            await convertFile(filePath, outputFormat);
            setTimeout(() => {
                fs.unlinkSync(filePath)
            }, 2000); // Delete the temporary file after 2 seconds
        });

    } catch (error) {
        console.error(`Error retrieving file: ${error.message}`);
    }
}

async function convertFile(filePath, outputFormat) {
    const fileExtension = path.extname(filePath);
    const outputFile = `./Downloads/${path.basename(filePath, fileExtension)}${outputFormat}`;      // Path of the retrieved file

    try {
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(outputFormat)) {
            // Convert image
            await sharp(filePath)
                .toFile(outputFile);
            console.log(`Image retrieved and saved as: ${outputFile}`);

        } else if (['.mp3', '.wav', '.mpeg',".mp4"].includes(outputFormat)) {
            // Convert audio and video
            ffmpeg(filePath)
                .toFormat(outputFormat.replace(".",""))
                .on('end', () => {
                    if(outputFormat == ".mp4" || outputFormat == ".mpeg"){
                        console.log(`Video retrieved and saved as: ${outputFile}`);
                    } else {
                        console.log(`Audio retrieved and saved as: ${outputFile}`);
                    }
                })
                .on('error', (error) => {
                    console.error(`Error during audio conversion: ${error.message}`);
                })
                .save(outputFile);

        } else {
            console.log("Unsupported file type for conversion.");
        }

    } catch (error) {
        console.error(`Error during conversion: ${error.message}`);
    }
}