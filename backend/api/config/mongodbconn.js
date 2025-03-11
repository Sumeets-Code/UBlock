import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Use environment variable for MongoDB URI
const uri = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;