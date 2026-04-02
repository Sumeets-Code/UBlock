import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Use environment variable or fallback to IPv4 localhost
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Ublock";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      family: 4, // Force IPv4 - THIS IS IMPORTANT!
    });
    
    console.log(`✅ Database Connected: ${conn.connection.host}:${conn.connection.port}`);
    console.log(`📦 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    
    // More helpful error messages
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Make sure MongoDB is running');
      console.error('2. Run: brew services start mongodb-community (macOS)');
      console.error('3. Run: sudo systemctl start mongod (Linux)');
      console.error('4. Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo');
    }
    
    process.exit(1);
  }
};

export default connectDB;