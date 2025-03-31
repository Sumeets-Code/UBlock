const hre = require('hardhat');

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const MyContract = await hre.ethers.getContractFactory("Ublock");
    const myContract = await MyContract.deploy();
    
    // Wait for the contract to be deployed
    await myContract.waitForDeployment();
    
    // Get the contract address
    const contractAddress = await myContract.getAddress();
    console.log("Contract deployed to:", contractAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

// Contract Addresses:
// SEPOLIA - 