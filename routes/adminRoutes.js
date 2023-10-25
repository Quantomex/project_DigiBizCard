const express = require('express');
const router = express();
const mongoose = require('mongoose');
const passport = require('passport');
const User = mongoose.model('User');
const Card = mongoose.model('Card');
const Support = mongoose.model('Support');
const Admin = mongoose.model('Admin');
const wrapAsync = require('../utils/wrapAsync');
const { isAdmin } = require('../middleware/authUser');

router.get('/admin/login', (req, res) => {
    res.render('adminlog');
});

router.get('/admin/signup', (req, res) => {
    const { secret } = req.query;
    if (secret === process.env.SECRET_QUERY) {
        return res.render('adminsign')
    }
    res.redirect('/')
})

router.post('/admin/signup', wrapAsync(async (req, res, next) => {
    const { username, password } = req.body;
    const foundUser = await Admin.find({ username });
    if (foundUser.length) {
        req.flash('error', 'Admin already registered.')
        return res.redirect(`/admin/signup?secret=${process.env.SECRET_QUERY}`)
    }
    const admin = new Admin({ username });
    Admin.register(admin, password, (err, newUser) => {
        if (err) {
            return next(err);
        }
        req.login(newUser, () => {
            return res.redirect(`/admin/${newUser._id}`)
        })
    });
}));


router.post('/admin/login', passport.authenticate('admin', { failureFlash: { type: 'error', message: 'Invalid Credentials!' }, failureRedirect: '/admin/login' }), wrapAsync(async (req, res) => {
    const { username } = req.body;
    const admin = await Admin.findOne({ username });
    res.redirect(`/admin/${admin._id}`)
}));


router.get('/admin/:id', isAdmin, wrapAsync(async (req, res) => {
    const user = await User.find({});
    const card = await Card.find({});
    const support = await Support.find({});
    const admin = await Admin.find({})
    const currentUser = req.user;
    res.render('admindashboard', { user, card, support, admin, currentUser })
}));

router.get('/admin/users/all/:id', isAdmin, wrapAsync(async (req, res) => {
    const users = await User.find({})
    res.render('userinfo', { users, admin: req.user })
}));

router.get('/admin/cards/all/:id', isAdmin, wrapAsync(async (req, res) => {
    const cards = await Card.find({})
    res.render('cardsinfo', { cards, admin: req.user })
}));

router.get('/admin/support/all/:id', isAdmin, wrapAsync(async (req, res) => {
    const supports = await Support.find({})
    res.render('support', { supports, admin: req.user })
}));

router.get('/list/all/admin/:id', isAdmin, wrapAsync(async (req, res) => {
    const admins = await Admin.find({})
    res.render('admins', { admins, currentUser: req.user })
}));

router.get('/make/account', (req, res) => {
    res.render('createaccount', { admin: req.user });
})

router.post('/create/account/:id', isAdmin, wrapAsync(async (req, res) => {
    const { username, password, subscription } = req.body;
    const foundUser = await User.find({ username });
    const today = new Date()
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    if (foundUser.length) {
        req.flash('error', 'Account is already created!');
        return res.redirect('/make/account')
    }
    const user = await new User({ username, subscription, trialEnd: nextYear });
    User.register(user, password, (err, newUser) => {
        if (err) {
            return next(err);
        }
        req.flash('success', `${newUser.username} account has been created! with the subscription of ${subscription}`);
        res.redirect('/make/account')
    });
}))

router.delete('/admin/delete/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { _id } = req.user;
    const user = await User.findById(id);
    const cardIds = user.cards;
    const cards = []
    for (let i = 0; i < cardIds.length; i++) {
        const foundCard = await Card.findById(cardIds[i])
        if (foundCard.image.filename) {
            cards.push(foundCard);
        }
        await Card.findOneAndDelete({ _id: cardIds[i] });
    }
    cards.map(({ image }) => {
        uploader.destroy(image.filename)
    })
    await User.findByIdAndDelete(id, { $pull: { cards: cardIds } })
    req.flash('success', 'Users and its cards has been deleted!');
    res.redirect(`/admin/users/all/${_id}`);
}));

router.delete('/admin/card/delete/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { _id } = req.user;
    const card = await Card.findById(id);
    const userId = card.author
    await User.findByIdAndUpdate(userId, { $pull: { cards: id } });
    const result = await Card.findByIdAndDelete(id);
    if (result.image.filename) {
        await uploader.destroy(result.image.filename)
    }
    req.flash('success', 'Card has been deleted successfully!');
    res.redirect(`/admin/cards/all/${_id}`)
}))

router.delete('/admin/support/delete/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { _id } = req.user;
    await Support.findByIdAndDelete(id);
    req.flash('success', 'Support Request has been deleted!');
    res.redirect(`/admin/support/all/${_id}`)
}))
router.delete('/admin/:id', isAdmin, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { _id } = req.user
    await Admin.findByIdAndDelete(id);
    req.flash('success', 'Admin Has been deleted!');
    res.redirect(`/list/all/admin/${_id}`)
}))

module.exports = router