import multer from 'multer';
import rateLimit from 'express-rate-limit';
import Web3 from 'web3';
import dotenv from 'dotenv';
dotenv.config();

export const getFileCategory = (extension) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
  const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];

  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'video';
  if (audioExtensions.includes(extension)) return 'audio';
  if (documentExtensions.includes(extension)) return 'document';
  return 'other';
};

export const uploads = multer({
  dest: '/uploads',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit (adjust as needed)
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

export const apiLimter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 45, // Limit each IP to 45 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Redis, Memcached, etc. See below.
});

export const getEvidenceContract = async () => {    
    try {
        // Establish connection to the Ethereum network
        const web3 = new Web3(new Web3.providers.HttpProvider(process.env.SEPOLIA_URL));
        
        try {
            // Parse ABI from environment variable
            const contractABI = process.env.CONTRACT_ABI;
            
            // Validate ABI is an array
            if (!Array.isArray(contractABI)) {
                throw new Error('Parsed ABI is not an array');
            }
        } catch (abiError) {
            console.error('Error parsing contract ABI:', abiError);
            console.error('Raw ABI value:', process.env.CONTRACT_ABI);
            throw new Error('Failed to parse CONTRACT_ABI from environment variables');
        }
        
        // Validate contract address
        const contractAddress = process.env.CONTRACT_ADDRESS;
        if (!contractAddress || !web3.utils.validateResponse(contractAddress)) {
            throw new Error('Invalid or missing contract address');
        }
        
        // Create and return the contract instance
        return new web3.eth.Contract(contractABI, contractAddress);
    } catch (error) {
        console.error('Error initializing contract:', error);
        throw error;
    }
};


