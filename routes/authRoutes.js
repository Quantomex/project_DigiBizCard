const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const qr = require('qrcode');
const User = mongoose.model('User');
const Card = mongoose.model('Card');
const multer = require('multer');
const { storage, cloudinary } = require('../cloudinary');
const upload = multer({ storage });
const { uploader } = require('cloudinary').v2;
const wrapAsync = require('../utils/wrapAsync');
const router = express.Router();
const { isLoggedIn, isPermitted, validatingUser, isAuthor, generateVCF } = require('../middleware/authUser');
const mailgun = require('mailgun-js');
const domain = process.env.DOMAIN;
const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain });




router.get("/viewcount/:id", async (req, res) => {
    const { id } = req.params;
    const card = await Card.findById(id);
    const viewCount = card.viewCount.map(({ month, count }) => ({ x: month, y: count }));
    res.json(viewCount)
})

router.get("/savecount/:id", async (req, res) => {
    const { id } = req.params;
    const card = await Card.findById(id);
    const saveCount = card.saveCount.map(({ month, count }) => ({ x: month, y: count }));
    res.json(saveCount)
})

router.get("/contactcount/:id", async (req, res) => {
    const { id } = req.params;
    const card = await Card.findById(id);
    const contactCount = card.contactCount.map(({ month, count }) => ({ x: month, y: count }));
    res.json(contactCount)
})

router.post('/signup', wrapAsync(async (req, res, next) => {
    const { package } = req.query;
    const { username, password, passwordConfirm } = req.body;
    const foundUser = await User.find({ username });
    if (foundUser.length) {
        req.flash('error', 'User already registered, Try loggin in.')
        return res.redirect('/signup');
    }
    const today = new Date()
    const trialEnd = new Date(today.setMonth(today.getMonth() + 2));
    const user = new User({ username, trialEnd });
    const registeredUser = await User.register(user, password, function (err, newUser) {
        if (err) {
            next(err)
        }
        req.logIn(newUser, () => {
            if (!package) {
                req.flash('success', 'Welcome! Your account has been successfully created');
                return res.redirect(`/user/${newUser._id}`)
            } else {
                return res.redirect(`/payform?package=${package}`)
            }
        })
    });
}));

router.post('/login', validatingUser, passport.authenticate('user', { failureRedirect: '/login', failureFlash: { type: 'error', message: 'Invalid Email or Password.' } }), wrapAsync(async (req, res, next) => {
    const { username } = req.body;
    const user = await User.findOne({ username });
    const today = new Date()
    if (user.trialEnd >= today) {
        return res.redirect(`/user/${user._id}`)
    } else {
        req.flash('trialEnd', 'Your package is over')
        return res.redirect(`/login`);
    }
}));


router.get('/signup', async (req, res, next) => {
    const { package } = req.query;
    res.render('signup', { package });
})


router.get('/login', (req, res, next) => {
    res.render('login')
});


router.get('/user/:id', isLoggedIn, wrapAsync(async (req, res, next) => {
    const userId = req.params.id;
    const user = await User.findById(userId).populate('cards');
    if (user.newUser == true) {
        return res.render('newusercanvas', { user });
    }
    res.render('canvas', { user });
}));

router.get('/cards/new', isLoggedIn, isPermitted, async (req, res, next) => {
    res.render('newcard', { user: req.user });
})

router.post('/cards', isLoggedIn, isPermitted, upload.single('image'), wrapAsync(async (req, res, next) => {
    const { _id } = req.user;
    const cardDetails = req.body;
    const fullname = `${cardDetails.firstName} ${cardDetails.lastName}`
    const card = new Card({ ...cardDetails, fullname, author: _id });
    qr.toDataURL(`https://digibizcard.lk/view/card/${card._id}`, (err, url) => {
        if (err) {
            next(err)
        }
        card.qrCode = url;
    })
    if (req.file) {
        card.image.url = req.file.path;
        card.image.filename = req.file.filename;
    }
    const user = await User.findById(_id);
    user.cards.push(card._id);
    await user.save()
    await card.save()
    res.redirect(`/user/${user._id}`);
}));

router.get('/download-pdf/:cardId', wrapAsync(async (req, res) => {
    const { cardId } = req.params;
    const card = await Card.findById(cardId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${card.pdf.filename}.pdf`);
    createReadStream(card.pdf.path).pipe(res);

}))

router.get('/renew/:cardId', isLoggedIn, isAuthor, wrapAsync(async (req, res) => {
    const { cardId } = req.params
    const card = await Card.findById(cardId)
    if (card.personalLink) {
        qr.toDataURL(`https://digibizcard.lk/view/${card.personalLink}/${cardId}`, async (err, url, next) => {
            if (err) {
                return next(err)
            }
            await Card.findByIdAndUpdate(cardId, { qrCode: url });
        })
    } else {
        qr.toDataURL(`https://digibizcard.lk/view/card/${card._id}`, async (err, url, next) => {
            if (err) {
                return next(err)
            }
            await Card.findByIdAndUpdate(cardId, { qrCode: url });
        })
    }
    req.flash('success', "Your Qr Code is renewed")
    res.redirect(`/card/${cardId}`);
}))

router.get('/card/:cardId', isLoggedIn, isAuthor, wrapAsync(async (req, res, next) => {
    const { cardId } = req.params;
    const user = req.user;
    const card = await Card.findById(cardId);
    res.render('cardshow', { card, user });
}));

router.post('/user', isLoggedIn, wrapAsync(async (req, res, next) => {
    const { _id } = req.user;
    const { fullname, department, company, contact } = req.body;
    const [firstName, middleName, lastName] = fullname.split(" ")
    const autoCards = [
        {
            fullname,
            department,
            company,
            contact,
            color: "#8F60DE",
            cardName: "Work",
            firstName,
            middleName,
            lastName,
            author: _id
        },
        {
            fullname,
            contact,
            color: "#628AF8",
            cardName: 'Personal',
            firstName,
            middleName,
            lastName,
            author: _id
        }
    ]
    for (let i = 0; i < autoCards.length; i++) {
        const card = new Card(autoCards[i]);
        qr.toDataURL(`https://digibizcard.lk/view/card/${card._id}`, async (err, url) => {
            if (err) {
                next(err)
            }
            card.qrCode = url
            const user = await User.findById(_id);
            user.cards.push(card._id);
            user.newUser = false;
            await card.save()
            await user.save()
        })
    }
    res.redirect(`/user/${_id}`);
}));

router.get('/card/:cardId/edit', isLoggedIn, isAuthor, wrapAsync(async (req, res, next) => {
    const { cardId } = req.params;
    const user = req.user;
    const card = await Card.findById(cardId);
    res.render('editcard', { card, user });
}));

router.put('/card/:cardId', isLoggedIn, isAuthor, upload.single('image'), wrapAsync(async (req, res, next) => {
    const { cardId } = req.params;
    const cardDetails = req.body;
    const fullname = `${req.body.firstName} ${req.body.lastName}`
    const card = await Card.findByIdAndUpdate(cardId, { ...cardDetails, fullname });
    if (req.file) {
        card.image.url = req.file.path;
        card.image.filename = req.file.filename;
    }
    await card.save()
    res.redirect(`/card/${cardId}`);
}));

router.delete('/card/:cardId', isLoggedIn, isAuthor, wrapAsync(async (req, res) => {
    const { cardId } = req.params;
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { $pull: { cards: cardId } });
    const result = await Card.findByIdAndDelete(cardId);
    if (result.image.filename) {
        await uploader.destroy(result.image.filename)
    }
    req.flash('success', "Card is destroyed successfully")
    res.redirect(`/user/${_id}`);
}));

router.get('/card/dublicate/:cardId', isLoggedIn, isAuthor, wrapAsync(async (req, res, next) => {
    const { cardId } = req.params;
    const user = req.user;
    const card = await Card.findById(cardId)
    res.render('dublicate', { card, user });
}));

router.get('/view/card/:id', wrapAsync(async (req, res) => {
    const card = await Card.findById(req.params.id);
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'short' });
    if (!card) {
        return res.render('cardnotfound')
    }
    if (card.pauseCard !== true) {
        const updateCard = await Card.findOneAndUpdate(
            { _id: card._id, 'viewCount.month': currentMonth },
            { $inc: { 'viewCount.$.count': 1 } },
            { new: true }
        );
        if (updateCard) {
            // Successfully updated the view count for the current month
            return res.render('displaycard', { card, user: req.user });
        } else {
            // The current month was not found in the viewCount array, so add a new object to the array with the current month and a count of 1
            const newCard = await Card.findOneAndUpdate(
                { _id: card._id },
                { $push: { viewCount: { month: currentMonth, count: 1 } } },
                { new: true }
            );
            if (card.personalLink) {
                return res.redirect(card.personalLink);
            } else {
                return res.render('displaycard', { card, user: req.user });
            }
        }
    }
    res.render('cardnotfound');
}));

router.get(`/view/:personalName/:cardId`, wrapAsync(async (req, res) => {
    const { cardId } = req.params
    const card = await Card.findById(cardId);
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'short' });
    const updateCard = await Card.findOneAndUpdate(
        { _id: card._id, 'viewCount.month': currentMonth },
        { $inc: { 'viewCount.$.count': 1 } },
        { new: true }
    );
    if (updateCard) {
        // Successfully updated the view count for the current month
        return res.render('displaycard', { card, user: req.user });
    } else {
        // The current month was not found in the viewCount array, so add a new object to the array with the current month and a count of 1
        const newCard = await Card.findOneAndUpdate(
            { _id: card._id },
            { $push: { viewCount: { month: currentMonth, count: 1 } } },
            { new: true }
        );
        return res.render('displaycard', { card, user: req.user });
    }
}))

router.get('/download/vcf/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const card = await Card.findById(id);
    const vcfContent = generateVCF(card.fullname, card.company, card.contact, card.email, card.address)
    res.setHeader('Content-disposition', `attachment; filename=${card.fullname}.vcf`);
    res.setHeader('Content-type', 'text/x-vcard');
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'short' });
    const updateCard = await Card.findOneAndUpdate(
        { _id: card._id, 'saveCount.month': currentMonth },
        { $inc: { 'saveCount.$.count': 1 } },
        { new: true }
    );
    if (updateCard) {
        // Successfully updated the view count for the current month
        return res.send(vcfContent)
    } else {
        // The current month was not found in the viewCount array, so add a new object to the array with the current month and a count of 1
        const newCard = await Card.findOneAndUpdate(
            { _id: card._id },
            { $push: { saveCount: { month: currentMonth, count: 1 } } },
            { new: true }
        );
    }
    res.send(vcfContent);
}))

router.post('/add/contact/:cardId', isLoggedIn, wrapAsync(async (req, res) => {
    const { cardId } = req.params;
    const card = await Card.findById(cardId);
    const { _id } = req.user;
    var alreadyAdded = false
    if (!card) {
        req.flash('error', "Can't save it because couldn't found this card.");
        return res.redirect(`/view/card/${cardId}`)
    }
    const user = await User.findById(_id);
    user.contacts.map((c) => {
        if (c._id.toString() === card._id.toString()) {
            alreadyAdded = true
            req.flash('error', 'Card has already added to your contact list.')
        }
    })
    if (!alreadyAdded) {
        const now = new Date();
        const currentMonth = now.toLocaleString('default', { month: 'short' });
        const updateCard = await Card.findOneAndUpdate(
            { _id: card._id, 'contactCount.month': currentMonth },
            { $inc: { 'contactCount.$.count': 1 } },
            { new: true }
        );
        if (updateCard) {
            // Successfully updated the view count for the current month
            user.contacts.push(card._id)
            await user.save()
            req.flash('success', "Card has been successfully added to your contacts list");
        } else {
            // The current month was not found in the viewCount array, so add a new object to the array with the current month and a count of 1
            const newCard = await Card.findOneAndUpdate(
                { _id: card._id },
                { $push: { contactCount: { month: currentMonth, count: 1 } } },
                { new: true }
            );
        }
    }
    return res.redirect(`/view/card/${cardId}`);
}))


router.get('/settings', isLoggedIn, (req, res) => {
    res.render('setting', { user: req.user })
})

router.post('/username', isLoggedIn, wrapAsync(async (req, res) => {
    const { username } = req.body;
    const userSigned = req.user;
    const users = await User.find({});
    for (let u of users) {
        if (u.username === username) {
            req.flash('error', 'Username already in use.')
            return res.redirect('/settings')
        }
    }
    const user = await User.findByIdAndUpdate(userSigned._id, { username });
    await user.save()
    req.flash('success', 'Your username has been updated. Please use the new one.')
    res.redirect('/login')
}));

router.get('/download/:id', isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const buffer = await qr.toBuffer(`https://digibizcard.lk/view/card/${id}`, { width: 500 });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="qrcode.png"');
    res.send(buffer);
}));



router.post('/card/setting/:cardId', isLoggedIn, isAuthor, wrapAsync(async (req, res) => {
    const { cardId } = req.params;
    const { personalLink } = req.body;
    const card = await Card.findById(cardId);
    if (!req.body.pauseCard) {
        card.pauseCard = true
        req.flash('success', 'Your card setiing is successfully applied')
    } else if (req.body.pauseCard === "on") {
        card.pauseCard = false
        req.flash('success', 'Your card setiing is successfully applied')
    }
    if (personalLink) {
        card.personalLink = personalLink
        req.flash('success', 'You have made an custom link')
    } else if (!personalLink) {
        card.personalLink = null
    }
    await card.save()
    res.redirect(`/card/${cardId}`);
}));


router.get('/contacts/:userId', isLoggedIn, wrapAsync(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('contacts');
    res.render('contacts', { user });
}));


router.put('/contact/:cardId', isLoggedIn, wrapAsync(async (req, res) => {
    const { _id } = req.user;
    const { cardId } = req.params
    const card = await Card.findById(cardId);
    await User.findByIdAndUpdate(_id, { $pull: { contacts: card._id } });
    req.flash('success', 'Contact has been removed');
    res.redirect(`/contacts/${_id}`)
}))


router.delete('/user/delete', isLoggedIn, wrapAsync(async (req, res) => {
    const { _id } = req.user;
    const user = await User.findById(_id);
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
    await User.findByIdAndDelete(_id, { $pull: { cards: cardIds } })
    req.flash('success', 'You account has been permanently delete.');
    res.redirect('/login');
}))

router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/')
    })
})


module.exports = router;
