const express = require('express');
const ExpressError = require('../helpers/ExpressError');
const { authRequired, adminRequired } = require('../middleware/auth');
const Company = require('../models/Company');
const { validate } = require('jsonschema');
const companyPostSchema = require('../schemas/companyPostSchema.json')
const companyPatchSchema = require('../schemas/companyPatchSchema.json')

const router = new express.Router();

router.get('/', authRequired, async function(req, res, next){
    try{
        const companies = await Company.findAll(req.query);
        return res.json({companies})
    } catch(err) {
        return next(err)
    }
})

router.post('/', adminRequired, async function(req, res, next){
    try {
        const validation = validate(req.body, companyPostSchema)
        if (!validation.valid){
            throw new ExpressError(validation.errors.map(e=>e.stack), 400)
        }
        const newCompany = await Company.createNew(req.body);
        return res.json({newCompany})
    } catch(err) {
        return next(err)
    }
})

router.get('/:handle', adminRequired, async function(req, res, next){
    try {
        const company = await Company.findByHandle(req.params.handle);
        return res.json({company})
    } catch(err) {
        return next(err)
    }
})

router.patch('/:handle', adminRequired, async function(req, res, next){
    try {
        if ('handle' in req.body){
            throw new ExpressError('you can not update a company handle', 400)
        }
        const validation = validate(req.body, companyPatchSchema)
        if (!validation.valid){
            throw new ExpressError(validation.errors.map(e=>e.stack), 400)
        }
        const company = await Company.update(req.params.handle, req.body)
        return res.json({company})    
    } catch(err) {
        return next(err)
    }
})

router.delete('/:handle', adminRequired, async function(req, res, next){
    try{
        await Company.delete(req.params.handle)
        return res.json({'message': `company with handle ${req.params.handle} deleted`})
    } catch(err) {
        return next(err)
    }
})

module.exports = router;