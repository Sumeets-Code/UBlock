import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema({
    index : {type: String, required: true, unique: true },
    name : {type: String, required: true },
    uploaderAddress : {type: String},
    timestamp : {type: String},
    ipfsHash : {type: String, required: true},
    fileType : {type: String, required: true},
    discription: {type: String},
    fileSize: {type: String, required: true},
});

const evidence = mongoose.model('evidences', evidenceSchema);

export default evidence;