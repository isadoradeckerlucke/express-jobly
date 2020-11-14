const request = require('supertest')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const app = require('../../app')
const db = require('../../db')

// global vairable to store stuff for all the tests
const TEST_DATA = {}

/** 
*test user, company, job, tokens, login
* @param {Object} TEST_DATA - build object for TEST_DATA
*/

async function beforeEachHook(TEST_DATA){
    try {
        // users data
        const hashedPassword = await bcrypt.hash('password', 1);
        const newUser = await db.query(
            `INSERT INTO users (username, password, first_name, last_name, email, photo_url, is_admin)
            VALUES('testuser', $1, 'test', 'testtest', 'test@gmail.com','tester.com', true)`,
            [hashedPassword]
        )
        
        const response = await request(app)
            .post('/login')
            .send({
                username: 'test',
                password: 'secret'
            })
        
        TEST_DATA.userToken = response.body.token;
        TEST_DATA.currentUsername = jwt.decode(TEST_DATA.userToken).username

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
        await db.query('DELETE FROM users')
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