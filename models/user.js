const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, "Username already in use."]
    },
    subscription: {
        type: String,
        default: 'Free'
    },
    cards: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Card'
        }
    ],
    newUser: {
        type: Boolean,
        default: true
    },
    contacts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Card'
        }
    ],
    referenceNo: {
        type: String
    },
    invoice: {
        type: String
    },
    trialEnd: {
        type: Date
    }
})

userSchema.plugin(passportLocalMongoose);


module.exports = mongoose.model('User', userSchema);