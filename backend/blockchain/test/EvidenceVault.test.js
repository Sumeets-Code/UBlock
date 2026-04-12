import { expect } from 'chai';
import hre from 'hardhat';

describe('EvidenceVault', () => {
  let vault, owner, operator, stranger;
  // A dummy 32-byte IPFS digest
  const IPFS_HASH  = hre.ethers.keccak256(hre.ethers.toUtf8Bytes('QmSomeIPFSHash'));
  const MONGO_ID   = '6654a1b2c3d4e5f6a7b8c9d0';
  const FILE_TYPE  = 'image/jpeg';

  beforeEach(async () => {
    [owner, operator, stranger] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory('EvidenceVault');
    vault = await Factory.connect(owner).deploy();
    await vault.waitForDeployment();
    await vault.addOperator(operator.address);
  });

  it('deploys with owner as operator', async () => {
    expect(await vault.owner()).to.equal(owner.address);
    expect(await vault.operators(owner.address)).to.be.true;
  });

  it('registers evidence and emits EvidenceRegistered', async () => {
    const tx = await vault.connect(operator).registerEvidenceByUser(IPFS_HASH, MONGO_ID, FILE_TYPE);
    const rc = await tx.wait();
    const ev = rc.logs.find(l => l.fragment?.name === 'EvidenceRegistered');
    expect(ev).to.not.be.undefined;
    expect(await vault.evidenceCount()).to.equal(1n);
  });

  it('stores correct uploadedBy address', async () => {
    await vault.connect(stranger).registerEvidenceByUser(IPFS_HASH, MONGO_ID, FILE_TYPE);
    const [, uploadedBy] = await vault.getEvidence(1);
    expect(uploadedBy).to.equal(stranger.address);
  });

  it('records access and emits CustodyEvent', async () => {
    await vault.connect(operator).registerEvidenceByUser(IPFS_HASH, MONGO_ID, FILE_TYPE);
    const tx = await vault.connect(operator).recordAccess(1, 'Det. Sarah Kim');
    const rc = await tx.wait();
    const ev = rc.logs.find(l => l.fragment?.name === 'CustodyEvent');
    expect(ev.args.action).to.equal('ACCESSED');
    expect(ev.args.detail).to.equal('Det. Sarah Kim');
  });

  it('records custody event (status change)', async () => {
    await vault.connect(operator).registerEvidenceByUser(IPFS_HASH, MONGO_ID, FILE_TYPE);
    const tx = await vault.connect(operator).recordCustodyEvent(1, 'STATUS_UPDATED', 'archived by Det. Kim');
    const rc = await tx.wait();
    const ev = rc.logs.find(l => l.fragment?.name === 'CustodyEvent');
    expect(ev.args.action).to.equal('STATUS_UPDATED');
  });

  it('soft-deletes evidence', async () => {
    await vault.connect(operator).registerEvidenceByUser(IPFS_HASH, MONGO_ID, FILE_TYPE);
    await vault.connect(operator).deleteEvidence(1, 'Admin');
    const [,,,, deleted] = await vault.getEvidence(1);
    expect(deleted).to.be.true;
  });

  it('verifies IPFS hash integrity', async () => {
    await vault.connect(operator).registerEvidenceByUser(IPFS_HASH, MONGO_ID, FILE_TYPE);
    expect(await vault.verifyIntegrity(1, IPFS_HASH)).to.be.true;
    const badHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes('tampered'));
    expect(await vault.verifyIntegrity(1, badHash)).to.be.false;
  });

  it('reverts duplicate delete', async () => {
    await vault.connect(operator).registerEvidenceByUser(IPFS_HASH, MONGO_ID, FILE_TYPE);
    await vault.connect(operator).deleteEvidence(1, 'Admin');
    await expect(vault.connect(operator).deleteEvidence(1, 'Admin'))
      .to.be.revertedWith('Already deleted');
  });
});