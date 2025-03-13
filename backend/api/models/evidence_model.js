import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema({
    name : {type: String},
    hash : {type: String, required: true},
    fileType : {type: String, required: true}
});

const evidence = mongoose.model('evidences', evidenceSchema);

export default evidence;