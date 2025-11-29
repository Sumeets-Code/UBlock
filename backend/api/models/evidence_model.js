import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema({
    index : {type: String, required: true, unique: true },
    uploaderAddress : {type: String},
    timestamp : {type: String},
    ipfsHash : {type: String, required: true},
    fileType : {type: String, required: true},
    fileCategory: {type: String, required: true},
    description: {type: String, required: true, unique: true },
    fileSize: {type: String, required: true},
});

const Evidence = mongoose.model('evidences', evidenceSchema);

export default Evidence;