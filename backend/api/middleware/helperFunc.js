import Web3 from 'web3';
import dotenv from 'dotenv';
dotenv.config();

const getEvidenceContract = async () => {    
    try {
        // Establish connection to the Ethereum network
        const web3 = new Web3(new Web3.providers.HttpProvider(process.env.SEPOLIA_URL));
        
        // Better error handling for ABI parsing
        let contractABI;
        try {
            // Parse ABI from environment variable
            contractABI = JSON.parse(process.env.CONTRACT_ABI);
            
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
        if (!contractAddress || !web3.utils.isAddress(contractAddress)) {
            throw new Error('Invalid or missing contract address');
        }
        
        // Create and return the contract instance
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
        
        const contract = await getEvidenceContract();
        
        const accessLogs = await contract.methods.getAccessLogs(evidenceId).call();
        
        // Format the logs for better readability
        const formattedLogs = accessLogs.map(log => {
            return {
                userId: log.userId,
                userAddress: log.userAddress,
                accessTimestamp: new Date(parseInt(log.timestamp) * 1000).toISOString(),
                accessType: log.accessType,
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