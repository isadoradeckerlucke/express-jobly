const request = require('supertest')
const jwt = require('jsonwebtoken')

const app = require('../../app')
const db = require('../../db')

// global vairable to store stuff for all the tests
const TEST_DATA = {}

async function beforeEachHook(TEST_DATA){
    try {
        // companies data
        const newCompany = await db.query(
            `INSERT INTO companies (handle, name, num_employees, description, logo_url)
            VALUES($1, $2, $3, $4, $5) 
            RETURNING *`, 
            ['testhandle', 'testcompanyname', 47, 'this is a test company', 'https://www.google.com/']
        )
        TEST_DATA.currentCompany = newCompany.rows[0]

        // jobs data
        const newJob = await db.query(
            `INSERT INTO jobs (title, salary, equity, company_handle, id)
            VALUES($1, $2, $3, $4, $5)
            RETURNING *`, 
            ['test engineer', 100000, 0.4, TEST_DATA.currentCompany.handle, 1]
        )
        TEST_DATA.jobId = newJob.rows[0].id;

    } catch(err){
        console.error(err)
    }
}

async function afterEachHook(){
    try {
        await db.query('DELETE FROM companies')
        await db.query('DELETE FROM jobs')
    } catch(err){
        console.error(err)
    }
}

async function afterAllHook(){
    try {
        await db.end()
    } catch(err){
        console.error(err)
    }
}

module.exports = {
    afterAllHook,
    afterEachHook,
    TEST_DATA,
    beforeEachHook
}