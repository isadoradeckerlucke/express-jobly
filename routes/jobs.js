const express = require('express');
const ExpressError = require('../helpers/ExpressError');
// const { authRequired, adminRequired } = require('../middleware/auth');
const Job = require('../models/Job');
const { validate } = require('jsonschema');
const jobPostSchema = require('../schemas/jobPostSchema.json')
const jobPatchSchema = require('../schemas/jobPatchSchema.json')

const router = new express.Router();

router.get('/', async function(req, res, next){
    try{
        const jobs = await Job.findAll(req.query);
        return res.json({jobs})
    } catch(err) {
        return next(err)
    }
})

router.post('/', async function(req, res, next){
    try {
        const validation = validate(req.body, jobPostSchema)
        if (!validation.valid){
            throw new ExpressError(validation.errors.map(e=>e.stack), 400)
        }
        const job = await Job.createNew(req.body);
        return res.json({job})
    } catch(err){
        return next(err)
    }
})

router.get('/:id', async function(req, res, next){
    try {
        const job = await Job.findById(req.params.id);
        return res.json({job})
    } catch(err) {
        return next(err)
    }
})

router.patch('/:id', async function(req, res, next){
    try {
        if ('id' in req.body){
            throw new ExpressError('you can not update a job id', 400)
        }

        const validation = validate(req.body, jobPatchSchema)
        if (!validation.valid){
            throw new ExpressError(validation.errors.map(e=>e.stack), 400)
        }
        
        const job = await Job.update(req.params.id, req.body)
        return res.json({job})    
    } catch(err) {
        return next(err)
    }
})

router.delete('/:id', async function(req, res, next){
    try{
        await Job.delete(req.params.id)
        return res.json({'message': `job with id ${req.params.id} deleted`})
    } catch(err) {
        return next(err)
    }
})

module.exports = router;