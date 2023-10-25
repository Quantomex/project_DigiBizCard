const Joi = require('joi');

module.exports.userJoiSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required().min(8),
}).required()

module.exports.signUpSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required().min(8),
    passwordConfirm: Joi.string().required().min(8)
}).required