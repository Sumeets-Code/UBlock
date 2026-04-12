import mongoose from 'mongoose';

const chainOfCustodySchema = new mongoose.Schema({
  action:    { type: String, required: true },
  officer:   { type: String, required: true },
  timestamp: { type: Date,   default: Date.now },
  notes:     { type: String, default: '' },
}, { _id: false });

const evidenceSchema = new mongoose.Schema(
  {
    // ── Core metadata ─────────────────────────────────────────────────────
    title:          { type: String, required: true, trim: true },
    caseNumber:     { type: String, required: true, trim: true, index: true },
    category:       { type: String, required: true, enum: ['image', 'video', 'audio', 'document', 'other'] },
    status:         { type: String, required: true, enum: ['active', 'pending', 'archived', 'released'], default: 'active' },
    collectedBy:    { type: String, required: true, trim: true },
    collectionDate: { type: Date,   required: true },
    location:       { type: String, default: '' },
    description:    { type: String, default: '' },
    tags:           { type: [String], default: [] },
    chainOfCustody: { type: [chainOfCustodySchema], default: [] },

    // ── File info ─────────────────────────────────────────────────────────
    fileSize:     { type: Number, required: true },
    mimeType:     { type: String, required: true },
    originalName: { type: String, required: true },

    // ── IPFS ──────────────────────────────────────────────────────────────
    filePath:    { type: String, required: true },  // public gateway URL
    ipfsHash:    { type: String, default: null },   // full CIDv1 string
    ipfsHash32:  { type: String, default: null },   // 0x bytes32 for on-chain
    sha256:      { type: String, default: null },   // local integrity hash

    // ── Blockchain ────────────────────────────────────────────────────────
    onChainId:           { type: Number, default: null },   // uint256 from contract
    registrationTxHash:  { type: String, default: null },

    // ── Uploader ──────────────────────────────────────────────────────────
    uploadedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'userLogins' },
    uploaderAddress:{ type: String, default: null },
  },
  { timestamps: true }   // auto-manages createdAt / updatedAt as proper Date fields
);

// Text index for full-text search
evidenceSchema.index({ title: 'text', description: 'text', caseNumber: 'text' });

const Evidence = mongoose.model('evidences', evidenceSchema);
export default Evidence;
