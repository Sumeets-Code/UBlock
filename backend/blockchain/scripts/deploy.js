import hre from 'hardhat';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance    = await hre.ethers.provider.getBalance(deployer.address);

  console.log(`Deployer : ${deployer.address}`);
  console.log(`Balance  : ${hre.ethers.formatEther(balance)} ETH`);

  const Factory = await hre.ethers.getContractFactory('EvidenceVault');

  // Estimate deploy gas before sending
  const deployTx   = await Factory.getDeployTransaction();
  const deployGas  = await hre.ethers.provider.estimateGas(deployTx);
  const feeData    = await hre.ethers.provider.getFeeData();
  const gasPrice   = feeData.gasPrice ?? hre.ethers.parseUnits('10', 'gwei');
  const deployCost = deployGas * gasPrice;

  console.log(`\nEstimated deploy gas : ${deployGas.toString()}`);
  console.log(`Gas price            : ${hre.ethers.formatUnits(gasPrice, 'gwei')} gwei`);
  console.log(`Estimated cost       : ${hre.ethers.formatEther(deployCost)} ETH`);

  const vault = await Factory.deploy();
  await vault.waitForDeployment();

  const address  = await vault.getAddress();
  const receipt  = await hre.ethers.provider.getTransactionReceipt(vault.deploymentTransaction().hash);
  const actualCost = BigInt(receipt.gasUsed) * gasPrice;

  console.log(`\nDeployed to : ${address}`);
  console.log(`Gas used    : ${receipt.gasUsed.toString()}`);
  console.log(`Actual cost : ${hre.ethers.formatEther(actualCost)} ETH`);
  console.log(`TX hash     : ${receipt.hash}`);

  // Gas cost per operation (approximate at current gas price)
  console.log('\n── Estimated per-operation gas costs ──────────────────');
  const ops = [
    ['registerEvidenceByUser (user pays)', 85_000n],
    ['recordAccess event (operator pays)', 28_000n],
    ['recordCustodyEvent (operator pays)', 32_000n],
    ['deleteEvidence (operator pays)',     35_000n],
    ['getEvidence / verifyIntegrity (free)', 0n],
  ];
  for (const [name, gas] of ops) {
    const cost = gas * gasPrice;
    console.log(`  ${name}`);
    console.log(`    ${gas} gas  ≈  ${hre.ethers.formatEther(cost)} ETH  ≈  $${(Number(hre.ethers.formatEther(cost)) * 3000).toFixed(4)}`);
  }

  // Write deployment.json for the backend
  const deployment = {
    network:         hre.network.name,
    contractAddress: address,
    deployedBy:      deployer.address,
    deployedAt:      new Date().toISOString(),
    abi: JSON.parse(fs.readFileSync(
      path.join('artifacts', 'contracts', 'EvidenceVault.sol', 'EvidenceVault.json'), 'utf8'
    )).abi,
  };

  const outDir = path.join('..', 'api', 'blockchain');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'deployment.json'), JSON.stringify(deployment, null, 2));

  console.log(`\ndeployment.json written to api/blockchain/`);
  console.log(`Add to api/src/.env:  CONTRACT_ADDRESS=${address}`);
}

main().catch(err => { console.error(err); process.exit(1); });
