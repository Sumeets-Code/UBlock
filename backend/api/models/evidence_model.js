import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema({
    name : {type: String},
    uploaderAddress : {type: String},
    timestamp : {type: Date},
    ipfsHash : {type: String, required: true},
    fileType : {type: String, required: true},
    discription: {type: String}
});

const evidence = mongoose.model('evidences', evidenceSchema);

export default evidence;