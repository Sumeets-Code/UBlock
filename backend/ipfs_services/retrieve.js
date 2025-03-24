import { ipfs } from './index.js';
import fs from 'fs';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

export async function retrieveFromIPFS(cid, outputFormat) {
    try {
        const stream = ipfs.cat(cid);
        const filePath = `./${cid}`;
        const writeStream = fs.createWriteStream(filePath);
        
        for await (const chunk of stream) {
            writeStream.write(chunk);
        }

        writeStream.end();
        writeStream.on('finish', async () => {
            console.log(`File retrieved: ${filePath}`);
            await convertFile(filePath, outputFormat);
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error(`Error retrieving file: ${error.message}`);
    }
}

async function convertFile(filePath, outputFormat) {
    const fileExtension = path.extname(filePath);
    const outputFile = `${path.basename(filePath, fileExtension)}${outputFormat}`;

    console.log(`File extension: ${fileExtension}`);
    console.log(`Attempting to convert to format: ${outputFormat}`);

    try {
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(outputFormat)) {
            await sharp(filePath)
                .toFile(outputFile);
            console.log(`Image converted and saved as: ${outputFile}`);

        } else if (['.mp3', '.wav'].includes(fileExtension)) {
            ffmpeg(filePath)
                .toFormat(outputFormat)
                .on('end', () => {
                    console.log(`Audio converted and saved as: ${outputFile}`);
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