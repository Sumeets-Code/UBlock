import express from 'express';
import connectDB from './config/mongodbconn.js';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.js';
import evidenceRoutes from './routes/evidenceManagement.js';

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use( authRoutes );
app.use( evidenceRoutes );

app.listen( port, () => {
    console.log(`Server is running on port ${port}`);
    connectDB();
})