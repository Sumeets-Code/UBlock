import Web3 from 'web3';
import dotenv from 'dotenv';
dotenv.config();

const getEvidenceContract = async() => {    
    try {
        const web3 = new Web3(new Web3.providers.HttpProvider(process.env.SEPOLIA_URL));

        const contractABI = JSON.parse(process.env.CONTRACT_ABI);
        const contractAddress = process.env.CONTRACT_ADDRESS;

        if (!Array.isArray(contractABI)) {
            throw new Error('ABI is not an array');
        }
        
        console.log("Raw ABI Type:", typeof process.env.CONTRACT_ABI); // Should be 'string'
        console.log("Parsed ABI Type:", Array.isArray(JSON.parse(process.env.CONTRACT_ABI))); // Should be true
        // Creating contract instance
        return new web3.eth.Contract(contractABI, contractAddress);
    } catch (error) {
        console.error('Error initializing contract:', error);
        throw error;
    }
};

const fetchLogs = async (req) => {
    try {
        const { evidenceId } = req.query;
        
        if (!evidenceId) {
            throw new Error("Evidence ID is required");
        }
        
        const contract = await getEvidenceContract(); // Function to get your smart contract instance
        
        const accessLogs = await contract.methods.getAccessLogs(evidenceId).call();
        
        // Format the logs for better readability
        const formattedLogs = accessLogs.map(log => {
            return {
            userId: log.userId,
            userAddress: log.userAddress,
            accessTimestamp: new Date(parseInt(log.timestamp) * 1000).toISOString(),
            accessType: log.accessType, // e.g., "view", "download", etc.
            ipfsHash: log.ipfsHash,
            additionalInfo: log.additionalInfo || {}
            };
        });
        
        return formattedLogs;
    } catch (error) {
        console.error("Error fetching evidence access logs:", error);
        throw error;  
    }
};

export { fetchLogs, getEvidenceContract };