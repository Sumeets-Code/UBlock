import { ipfs } from './index.js';
import fs from 'fs';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegPath.path);

export async function retrieveFromIPFS(cid, outputFormat) {
    try {
        const stream = ipfs.cat(cid);
        const filePath = `./Downloads/${cid}`;
        const writeStream = fs.createWriteStream(filePath);
        
        for await (const chunk of stream) {
            writeStream.write(chunk);
        }

        writeStream.end();
        writeStream.on('finish', async () => {
            await convertFile(filePath, outputFormat);
            setTimeout(() => {
                fs.unlinkSync(filePath)
            }, 2000);
        });

    } catch (error) {
        console.error(`Error retrieving file: ${error.message}`);
    }
}

async function convertFile(filePath, outputFormat) {
    const fileExtension = path.extname(filePath);
    const outputFile = `./Downloads/${path.basename(filePath, fileExtension)}${outputFormat}`;

    try {
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(outputFormat)) {
            await sharp(filePath)
                .toFile(outputFile);
            console.log(`Image converted and saved as: ${outputFile}`);

        } else if (['.mp3', '.wav', '.mpeg',".mp4"].includes(outputFormat)) {
            ffmpeg(filePath)
                .toFormat(outputFormat.replace(".",""))
                .on('end', () => {
                    if(outputFormat ==".mp4"){
                        console.log(`Video converted and saved as: ${outputFile}`);
                    } else {
                        console.log(`Audio converted and saved as: ${outputFile}`);
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