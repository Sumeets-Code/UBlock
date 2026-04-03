import hre from 'hardhat';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  console.log(`Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} ETH`);

  const EvidenceVault = await hre.ethers.getContractFactory('EvidenceVault');
  const vault = await EvidenceVault.deploy();
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  console.log(`\nEvidenceVault deployed to: ${address}`);
  console.log(`Transaction hash: ${vault.deploymentTransaction().hash}`);

  // Write deployment info to a JSON file the backend can read
  const deployment = {
    network: hre.network.name,
    contractAddress: address,
    deployedBy: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: JSON.parse(fs.readFileSync(
      path.join('artifacts', 'contracts', 'EvidenceVault.sol', 'EvidenceVault.json'),
      'utf8'
    )).abi,
  };

  const outDir = path.join('..', 'api', 'blockchain');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'deployment.json'), JSON.stringify(deployment, null, 2));
  console.log(`\nDeployment info saved to api/blockchain/deployment.json`);
  console.log(`Add to your .env:\n  CONTRACT_ADDRESS=${address}`);
}

main().catch(err => { console.error(err); process.exit(1); });
