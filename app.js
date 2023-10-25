if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
require('./models/support');
require('./models/user');
require('./models/cards');
require('./models/admin');
const express = require('express');
const app = express();
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const passport = require('passport');
const methodOverride = require('method-override');
const localStrategy = require('passport-local')
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const ejs = require('ejs');
const Card = mongoose.model('Card');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const homePageRoutes = require('./routes/homePageRoutes');
const ExpressError = require('./utils/ExpressError');
const User = mongoose.model('User');
const Admin = mongoose.model('Admin');
const MongoDBStore = require('connect-mongo');
const { isLoggedIn, isAuthor } = require('./middleware/authUser');
const wrapAsync = require('./utils/wrapAsync');
const mailgun = require('mailgun-js');
const crypto = require('crypto');
const axios = require('axios');
const juice = require('juice');
const domain = process.env.DOMAIN;
const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain });



const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/digibizcard2';
const secret = process.env.SECRET || 'thisisnotagoodsecret';

const store = new MongoDBStore({
    mongoUrl: mongoUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,

}


app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set(path.join(__dirname, 'views'));
app.use(methodOverride('_method'));
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session())
app.use(flash());

// passport.use(new localStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.use('user', new localStrategy(User.authenticate()));
passport.use('admin', new localStrategy(Admin.authenticate()));

passport.serializeUser(function (user, done) {
    if (user instanceof User) {
        done(null, { type: 'user', id: user.id });
    } else if (user instanceof Admin) {
        done(null, { type: 'admin', id: user.id });
    }
});

passport.deserializeUser(function (data, done) {
    if (data.type === 'user') {
        User.findById(data.id, function (err, user) {
            done(err, user);
        });
    } else if (data.type === 'admin') {
        Admin.findById(data.id, function (err, user) {
            done(err, user);
        });
    }
});

app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.trialEnd = req.flash('trialEnd');
    next()
})
app.use(authRoutes);
app.use(homePageRoutes);
app.use(adminRoutes);


// Connecting to the mongoose with mongoose server
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
const salt = 'FXV1118C02B478BE61767';
const appToken = process.env.APP_TOKEN;
const appId = 'A385118C02B478BE61731'
const url = `https://merchant-api-live-v2.onepay.lk/api/ipg/gateway/request-transaction/?hash=`
var transactionRedirectUrl = 'https://digibizcard.lk/response'


app.post('/pay', async (req, res, next) => {
    const { _id } = req.user;
    const { package } = req.query;
    const today = new Date()
    const trialEnd = new Date(today.setMonth(today.getMonth() + 2));
    const referenceId = Buffer.from(_id.toString(), 'hex').toString('base64');
    const data = JSON.stringify({
        "amount": parseInt(req.body.amount),
        "app_id": appId,
        "reference": referenceId,
        "customer_first_name": req.body.fname.trim(),
        "customer_last_name": req.body.lname.trim(),
        "customer_phone_number": `+94${req.body.contact}`,
        "customer_email": req.body.email.trim(),
        "transaction_redirect_url": `${transactionRedirectUrl}/${_id}?package=${package}`,
    });
    const hash = crypto.createHash('sha256');
    hash_obj = data + salt
    hash_obj = hash.update(hash_obj, 'utf-8');
    gen_hash = hash_obj.digest('hex');

    const options = {
        method: 'get',
        url: url + gen_hash,
        headers: {
            'Authorization': appToken,
            'Content-Type': 'application/json'
        },
        data: data
    }
    await axios(options).then(async (response) => {
        await User.findByIdAndUpdate(_id, { referenceNo: referenceId, invoice: response.data.data.ipg_transaction_id, trialEnd });
        const json_data = JSON.parse(JSON.stringify(response.data))
        res.redirect(json_data.data.gateway.redirect_url)
        res.end();
    }).catch((error) => {
        next(error)
    })
})

app.get('/response/:id', async (req, res) => {
    const { package = 'free' } = req.query;
    var amount = 0
    if (package === 'professional') {
        amount = 8000
    } else if (package === 'business') {
        amount = 6000
    }
    if (res.body) {
        //Failed transaction
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(id, { referenceNo: null, invoice: null });
        req.flash('error', "There was an error while processing your payment!")
        return res.redirect(`/payform?package=${package}`)

    } else {
        //Success transaction 
        if (res.statusCode === 200) {
            const { id } = req.params;
            const user = await User.findById(id);
            const today = new Date()
            const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
            if (user.invoice) {
                user.subscription = package;
                user.trialEnd = nextYear
                const data = {
                    from: `DigiBizCard <support@digibizcard.lk>`,
                    to: user.username,
                    subject: `Your account has been upgraded to ${package}`,
                    template: "invoice",
                    't:variables': JSON.stringify({
                        referenceId: user.referenceNo,
                        billed: user.username,
                        amount,
                        package
                    })
                }
                await mg.messages().send(data)
                await user.save();
                req.flash('success', 'Your account has been upgraded successfully!');
                return res.redirect(`/user/${id}`);
            }
            req.flash('error', `You need to pay for the package "${package}"`)
            return res.redirect(`/user/${id}`);
        }
    }
})

app.post('/sendcard/:cardId', isLoggedIn, isAuthor, wrapAsync(async (req, res) => {
    const { name, email, emailMessage } = req.body;
    const { _id } = req.user;
    const user = await User.findById(_id);
    const card = await Card.findById(req.params.cardId);
    const templatePath = __dirname + '/views/emailtemplate.ejs';
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const html = ejs.render(templateSource, { name, emailMessage, card });
    const message = {
        from: `DigiBizCard <${user.username}>`,
        to: email,
        subject: `Say Hello to ${name}`,
        html: juice(html)
    }
    mg.messages().send(message)
    req.flash('success', `Your card has been shared with ${email}`);
    res.redirect(`/card/${card._id}`);
}))

app.post('/send/sms/:cardId', isLoggedIn, isAuthor, wrapAsync(async (req, res) => {
    const { cardId } = req.params;
    const { name, contact, textMessage } = req.body;
    const card = await Card.findById(cardId);
    const password = process.env.SMS_PASSWORD
    const username = process.env.SMS_USER
    const apiUrl = 'https://e-sms.dialog.lk/api/v1/login';
    var msg = ""
    const min = 1000;
    const max = 10000000;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;

    if (card.personalLink) {
        if (textMessage) {
            msg = `Hey ${name}, ${textMessage}. To view my card click on the link below https://digibizcard.lk/view/${card.personalLink}/${cardId}`
        } else {
            msg = `Hey ${name}, Check out my card by clicking on the link below https://digibizcard.lk/view/${card.personalLink}/${cardId}`
        }
    } else {
        if (textMessage) {
            msg = `Hey ${name}, ${textMessage}. To view my card click on the link below https://digibizcard.lk/view/card/${cardId}`
        } else {
            msg = `Hey ${name}, Check out my card by clicking on the link below https://digibizcard.lk/view/card/${cardId}`
        }
    }

    const data = {
        username: username,
        password: password
    };

    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    await axios.post(apiUrl, data, config)
        .then(response => {
            const api = 'https://e-sms.dialog.lk/api/v1/sms'
            const token = `Bearer ${response.data.token}`
            const sendData = {
                message: msg,
                msisdn: [{ mobile: contact }],
                transaction_id: `${randomNum}`
            }
            const config = {
                headers: {
                    Authorization: token,
                    'Content-Type': 'application/json'
                }
            }
            axios.post(api, sendData, config).then((reponse) => {
                req.flash('success', 'Congratulations! Your card has been shared with the contact you have provided.')
            }).catch((error) => {
                req.flash('error', 'Oh No! Got some issue please retry.')
            })
        })
        .catch(error => {
            req.flash('error', 'Oh No! Got some issue please try again')
        });
    res.redirect(`/card/${cardId}`);
}))

app.all('*', (req, res, next) => {
    next(new ExpressError('Page not found', 404))
})


app.use((err, req, res, next) => {
    const { status = 500 } = err;
    if (!err.message) err.message = "Oh No, Something Went Wrong!";
    res.status(status).render('error', { err });
})

// Server Startup
const port = process.env.PORT || 3000
app.listen(port);

