const request = require('supertest')
const jwt = require('jsonwebtoken')

const app = require('../../app')
const db = require('../../db')

// global vairable to store stuff for all the tests
const TEST_DATA = {}

async function beforeEachHook(TEST_DATA){
    try {
        const result = await db.query(
            `INSERT INTO companies (handle, name, num_employees, description, logo_url)
            VALUES($1, $2, $3, $4, $5) 
            RETURNING *`, 
            ['testhandle', 'testcompanyname', 47, 'this is a test company', 'https://www.google.com/']
        )
        TEST_DATA.currentCompany = result.rows[0]
    } catch(err){
        console.error(error)
    }
}

async function afterEachHook(){
    try {
        await db.query('DELETE FROM companies')
    } catch(err){
        console.error(error)
    }
}

async function afterAllHook(){
    try {
        await db.end()
    } catch(err){
        console.error(error)
    }
}

module.exports = {
    afterAllHook,
    afterEachHook,
    TEST_DATA,
    beforeEachHook
}