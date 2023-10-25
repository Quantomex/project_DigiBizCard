const mongoose = require('mongoose');
const supportSchema = new mongoose.Schema({
    firstName: {
        type: String,
        require: true
    },
    lastName: {
        type: String
    },
    workEmail: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        require: true
    },
    jobTitle: {
        type: String,
        require: true
    },
    websiteUrl: {
        type: String,
        require: true
    },
    employees: {
        type: String,
        require: true
    }
})

module.exports = mongoose.model('Support', supportSchema);