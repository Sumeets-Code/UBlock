import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reportId:        { type: String, required: true, unique: true },
    title:           { type: String, required: true },
    type:            { type: String, required: true, enum: ['case', 'full'] },
    caseNumber:      { type: String, default: null },
    totalEvidence:   { type: Number, required: true },
    totalSize:       { type: Number, default: 0 },
    totalCases:      { type: Number, default: null },
    byCategory:      { type: mongoose.Schema.Types.Mixed, default: {} },
    // Self-contained evidence snapshot so the report is immutable after saving
    evidence:        { type: mongoose.Schema.Types.Mixed, default: [] },
    generatedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'userLogins', required: true },
    generatedByName: { type: String, required: true },
    notes:           { type: String, default: '' },
  },
  { timestamps: true }
);

reportSchema.index({ caseNumber: 1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model('reports', reportSchema);
export default Report;
