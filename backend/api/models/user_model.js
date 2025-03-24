import mongoose from 'mongoose';

const userLoginSchema = new mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    role: {type: String, required: true},
    contact : {type: String, required: true}
});

const ldata = mongoose.model('userlogin', userLoginSchema);

export default ldata;