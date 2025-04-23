import mongoose from 'mongoose';

const userLoginSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    username: {type: String, required: true},
    password: {type: String, required: true},
    role: {type: String, required: true},
    contact : {type: Number, required: true},
    rank: {type: String},
    department: {type: String},
    employeeId: {type: String}
});

const ldata = mongoose.model('userlogin', userLoginSchema);

export default ldata;