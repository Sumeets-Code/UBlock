import express from 'express';
import connectDB from './config/mongodbconn.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import evidenceRoutes from './routes/evidenceManagement.js';
// import Web3 from 'web3';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3300;

// const web3 = new Web3(new Web3.providers.HttpProvider(process.env.SEPOLIA_URL));

// const contractABI = process.env.CONTRACT_ABI;
// const contractAddress = process.env.CONTRACT_ADDRESS;

// // Creating contract instance
// const contract = new web3.eth.Contract(contractABI, contractAddress);  // Might be called in the Evidence management routes to talk to the contract, Not Added yet.
// export default contract;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());

app.use( authRoutes );
app.use( evidenceRoutes );

app.listen( port, async () => {
    await connectDB();
    console.log(`Server is running on port ${port}`);
})