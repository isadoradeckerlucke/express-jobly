const express = require('express');
const ExpressError = require('../helpers/ExpressError');
// const { authRequired, adminRequired } = require('../middleware/auth');
const Company = require('../models/Company');
// const { validate } = require('jsonschema');
// const { companyNewSchema, companyUpdateSchema } = require('../schemas');

const router = new express.Router();

router.get('/', async function(req, res, next){
    try{
        const companies = await Company.findAll(req.query);
        return res.json({companies})
    } catch(err) {
        return next(err)
    }
})