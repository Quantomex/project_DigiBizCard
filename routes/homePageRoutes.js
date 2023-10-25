const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isLoggedIn } = require('../middleware/authUser');
const User = mongoose.model('User');
const Card = mongoose.model('Card');
const Support = mongoose.model('Support');

router.get('/', (req, res) => {
    res.render('index')
})

router.get('/pricing', (req, res) => {
    res.render('pricing')
});

router.get('/features/digital-business-cards', (req, res) => {
    res.render('digitalbusiness')
})
router.get('/features/share-digital-business-cards', (req, res) => {
    res.render('sharedigitalbusiness')
})
router.get('/features/self-healing-address-book', (req, res) => {
    res.render('selfhealing')
})
router.get('/features/business-card-scanner', (req, res) => {
    res.render('businesscardscanner');
})
router.get('/features/virtual-backgrounds', (req, res) => {
    res.render('virtualbackground');
})
router.get('/features/email-signatures', (req, res) => {
    res.render('emailsignatures');
})
router.get('/features/nfc-business-cards', (req, res) => {
    res.render('nfcbusinesscards');
})
router.get('/faq', (req, res) => {
    res.render('faq');
})
router.get('/professional', (req, res) => {
    res.render('professional');
})
router.get('/business', (req, res) => {
    res.render('business');
})
router.get('/enterprise', (req, res) => {
    res.render('enterprise');
})

router.get('/contactform', (req, res) => {
    res.render('contactform')
})

router.post('/contact', async (req, res) => {
    const response = req.body;
    const support = await new Support(response);
    support.save()
    req.flash('success', "Your information has been submitted successfully. Please wait our team will get in touch with you with in few day.")
    res.redirect('/contactform')
})

router.get('/payform', isLoggedIn, (req, res) => {
    const { package } = req.query;
    var amount = 0;
    if (package === "professional") {
        amount = 3999
    } else if (package === "business") {
        amount = 2999
    }
    res.render('paymentform', { user: req.user, amount, package });
})

module.exports = router;