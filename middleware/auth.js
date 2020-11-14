const { request } = require('express');
const jwt = require('jsonwebtoken')
const { SECRET_KEY } = require("../config");
const ExpressError = require("../helpers/ExpressError");

// middleware to check if valid token was provided
// add username onto req for view functions
// if not valid, raises unauthorized error
function authRequired(req, res, next){
    try {
        const tokenString = req.body._token || req.query._token;

        let token = jwt.verify(tokenString, SECRET_KEY);
        res.locals.username = token.username;
        return next()
    } catch(err) {
        return next(new ExpressError('you must authenticate first', 401))
    }
}

// middleware to check if token is valid and an admin token
// add username onto req for view functions 
// if not valid, raises unauthorized error
function adminRequired(req, res, next){
    try {
        const tokenString = req.body._token;
        let token = jwt.verify(tokenString, SECRET_KEY);
        res.locals.username = token.username;

        if(token.is_admin){
            return next();
        }

        // throw an error if it's not admin so that it catches it below
        throw new Error()
    } catch(err){
        return next(new ExpressError('you must be an admin to access this', 401))
    }
}

// middleware to check for valid token as well as make sure that the current user is the same one in the route
// add username onto req for view functions
// if not valid, raises unauthorized error
function ensureCorrectUser(req, res, next){
    try{
        const tokenString = req.body.token;
        let token = jwt.verify(tokenString, SECRET_KEY);
        res.locals.username = token.username;

        if (token.username === req.params.username){
            return next()
        }

        // throw an error if it's not the same user so that it catches it below
        throw new Error()
    } catch(err){
        return next(new ExpressError('unauthorized', 401))
    }
}

module.exports = {
    authRequired,
    adminRequired,
    ensureCorrectUser
}