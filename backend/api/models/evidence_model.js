import mongoose from 'mongoose';

const evidenceSchema = mongoose.Schema({
    name : {type: String},
    hash : {type: String, required: true},
    fileType : {type: String, required: true},
});

const evidence = mongoose.model('Evidence', evidenceSchema);

export default evidence;