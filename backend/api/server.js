import express from 'express';
import connectDB from './config/mongodbconn.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import evidenceRoutes from './routes/evidenceManagement.js';
import ipfsRoutes from './routes/ipfs.js';

const app = express();
const port = 3300;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());

app.use( authRoutes );
app.use( evidenceRoutes );
app.use( ipfsRoutes );

app.listen( port, async () => {
    await connectDB();
    console.log(`Server is running on port ${port}`);
})