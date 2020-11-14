const express = require('express');
const ExpressError = require('../helpers/ExpressError');
const { authRequired, ensureCorrectUser } = require('../middleware/auth');
const User = require('../models/User');
const { validate } = require('jsonschema');
const userPostSchema = require('../schemas/userPostSchema.json')
const userPatchSchema = require('../schemas/userPatchSchema.json');
const createToken = require('../helpers/createToken')
const router = express.Router();

router.get('/', authRequired, async function(req, res, next){
    try{
        const users = await User.findAll();
        return res.json({users})
    } catch(err) {
        return next(err)
    }
})

router.post('/', async function(req, res, next){
    try {
        const validation = validate(req.body, userPostSchema)
        if (!validation.valid){
            throw new ExpressError(validation.errors.map(e=>e.stack), 400)
        }
        const user = await User.createNew(req.body);
        const token = createToken(user)
        return res.json({token})
    } catch(err){
        return next(err)
    }
})

router.get('/:username', authRequired, async function(req, res, next){
    try {
        const user = await User.findByUsername(req.params.username);
        return res.json({user})
    } catch(err) {
        return next(err)
    }
})

router.patch('/:username', ensureCorrectUser, async function(req, res, next){
    try {
        if ('username' in req.body || 'is_admin' in req.body){
            throw new ExpressError(
                `you are not allowed to change username or is_admin properties`, 400
            )
        }

        const validation = validate(req.body, userPatchSchema)
        if (!validation.valid){
            throw new ExpressError(validation.errors.map(e=>e.stack), 400)
        }
        
        const user = await User.update(req.params.username, req.body)
        return res.json({user})    
    } catch(err) {
        return next(err)
    }
})

router.delete('/:username', ensureCorrectUser, async function(req, res, next){
    try{
        await User.delete(req.params.username)
        return res.json({'message': `user with username ${req.params.username} deleted`})
    } catch(err) {
        return next(err)
    }
})

module.exports = router;