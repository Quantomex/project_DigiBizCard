const { userJoiSchema, signUpSchema } = require('../models/joi/userSchema');
const mongoose = require('mongoose');
const Card = mongoose.model('Card');
const Admin = mongoose.model('Admin');
const User = mongoose.model('User');
const ExpressError = require('../utils/ExpressError');


module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login')
    }
    next()
}

module.exports.isAdmin = async (req, res, next) => {
    const { id } = req.params;
    const admin = await Admin.findById(id);
    if (!admin) {
        return res.redirect('/')
    }
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    next()
}

module.exports.isPermitted = (req, res, next) => {
    const user = req.user;
    if (user.subscription.toLowerCase() == 'free' && user.cards.length >= 2) {
        req.flash('error', "You have reached the limit of maximum 2 cards per account.")
        return res.redirect(`/user/${user._id}`)
    } else {
        next()
    }
}

module.exports.validatingUser = (req, res, next) => {
    const { error } = userJoiSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 300)
    } else {
        next()
    }
};
module.exports.isAuthor = async (req, res, next) => {
    const { cardId } = req.params;
    const card = await Card.findById(cardId)
    if (!card) {
        req.flash('error', "No such card found")
        return res.redirect(`/user/${req.user._id}`);
    }
    if (card.author.toString() !== req.user._id.toString()) {
        req.flash('error', "You are not authorized to access this card.")
        return res.redirect(`/user/${req.user._id}`)
    }
    next()
};

module.exports.generateVCF = (name, company, phone, email, address) => {
    const vcfContent = `BEGIN:VCARD
VERSION:2.1
N:${name}
FN:${name}
ORG:${company}
TEL;WORK;VOICE:+94${phone}
ADR;WORK:;;${address}
EMAIL;PREF;INTERNET:${email}
END:VCARD`;

    return vcfContent;
}