import express from 'express';
import connectDB from './config/mongodbconn.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import evidenceRoutes from './routes/evidenceManagement.js';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = 3300;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const apiLimter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 45, // Limit each IP to 45 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.
})


app.use(cors());

app.use( authRoutes , apiLimter);
app.use( evidenceRoutes );

app.listen(port, async () => {
    await connectDB();
    console.log(`Server is running on port ${port}`);
})