const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        require: true
    },
    admin: {
        type: Boolean,
        default: true
    }
});

adminSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Admin', adminSchema)