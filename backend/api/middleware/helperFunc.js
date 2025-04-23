import Web3 from 'web3';

const fetchLogs = async (req) => {
    try {
        // Extract parameters like evidence ID from the request
        const { evidenceId } = req.query;
        
        if (!evidenceId) {
            throw new Error("Evidence ID is required");
        }
        
        // Connect to your blockchain using web3.js or ethers.js
        const contract = await getEvidenceContract(); // Function to get your smart contract instance
        
        // Call the smart contract method that tracks access logs
        // This assumes your contract has a function like getAccessLogs(evidenceId)
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

const getEvidenceContract = async() => {    
    const web3 = new Web3(new Web3.providers.HttpProvider(process.env.SEPOLIA_URL));

    const contractABI = process.env.CONTRACT_ABI;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    // Creating contract instance
    new web3.eth.Contract(contractABI, contractAddress);  // Might be called in the Evidence management routes to talk to the contract, Not Added yet.
};

export { fetchLogs, getEvidenceContract };