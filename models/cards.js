const mongoose = require('mongoose');


const cardSchema = new mongoose.Schema({
    fullname: String,
    cardName: String,
    color: String,
    image: {
        url: String,
        filename: String
    },
    pauseCard: {
        type: Boolean,
        default: false
    },
    qrCode: String,
    logo: String,
    prefix: String,
    firstName: String,
    middleName: String,
    lastName: String,
    suffix: String,
    accreditations: String,
    prefferedName: String,
    maidenName: String,
    pronouns: String,
    title: String,
    department: String,
    company: String,
    headline: String,
    badges: String,
    contact: Number,
    email: String,
    address: String,
    website: String,
    link: String,
    pdflink: String,
    twitter: String,
    instagram: String,
    linkedIn: String,
    facebook: String,
    youtube: String,
    whatsapp: String,
    snapchat: String,
    tiktok: String,
    github: String,
    yelp: String,
    venmo: String,
    paypal: String,
    cashApp: String,
    calendly: String,
    discord: String,
    twitch: String,
    telegram: String,
    zelle: String,
    skype: String,
    weChat: String,
    signal: String,
    nintendoSwitch: String,
    psn: String,
    xboxLive: String,
    xing: String,
    dribble: String,
    behance: String,
    pinterest: String,
    patreon: String,
    vimeo: String,
    line: String,
    date: String,
    note: String,
    appleMusic: String,
    spotify: String,
    soundCloud: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    viewCount: [
        {
            month: {
                type: String
            },
            count: {
                type: Number,
                default: 0
            }
        }
    ],
    saveCount: [
        {
            month: {
                type: String
            },
            count: {
                type: Number,
                default: 0
            }
        }
    ],
    contactCount: [
        {
            month: {
                type: String
            },
            count: {
                type: Number,
                default: 0
            }
        }
    ],
    personalLink: {
        type: String
    }
})

mongoose.model('Card', cardSchema);