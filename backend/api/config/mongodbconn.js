import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Mongo URI:', process.env.MONGO_URI);
  connectDB();
});

export default connectDB;




































/*

// Define the login schema
const loginSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    
    email: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },
    
    category: {
        type: String,
        required: true
    }
});

const ngoLoginSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    
    email: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },
    
    contact: {
        type: Number,
        required: true
    },

    category: {
        type: String,
        required: true
    }

});

// Create the model
const ldata = mongoose.model("loginData", loginSchema);

const ndata = mongoose.model("ngoLogin", ngoLoginSchema);

// Export the model
// Use this for ES6 modules
// .eg. export default ldata;
export {ldata, ndata};
// or
// module.exports = ldata; // Use this for CommonJS

*/