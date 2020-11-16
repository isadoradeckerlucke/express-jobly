process.env.NODE_ENV === "test"

const request = require('supertest')
const app = require("../../app");
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const db = require('../../db')


const TEST_DATA = {}
beforeEach(async function() {
    try {
        const hashedPassword = await bcrypt.hash('password', 12)
        await request(app)
            .post('/users')
            .send({
                username: 'testuser',
                password: 'password',
                first_name: 'test',
                last_name: 'testtest',
                email: 'test@gmail.com',
                photo_url: 'tester.com',
                is_admin: true
            })

        const response = await request(app)
            .post('/login')
            .send({
                username: 'testuser',
                password: hashedPassword
            })

        TEST_DATA.userToken = response.body.token;
        TEST_DATA.currentUsername = jwt.decode(TEST_DATA.userToken).username


        const newCompany = await db.query(
            `INSERT INTO companies (handle, name, num_employees, description, logo_url)
            VALUES($1, $2, $3, $4, $5) 
            RETURNING *`, 
            ['testhandle', 'testcompanyname', 47, 'this is a test company', 'https://www.google.com/']
        )

        TEST_DATA.currentCompany = newCompany.rows[0]
        
    } catch(err){
        console.error(err)
    }
})

describe("GET /companies", function(){    
    test("shows all companies", async function(){
        const response = await request(app).get('/companies');

        expect(response.body.companies).toHaveLength(1);
        expect(response.body.companies[0]).toHaveProperty('handle');
    })

    test("correctly filters if there are search queries", async function(){
        await request(app)
            .post('/companies')
            .set('authorization', `${TEST_DATA.userToken}`)
            .send({
                handle: 'hey', 
                name: 'test company get route',
                _token: TEST_DATA.userToken
            })
        
        await request(app)
            .post('/companies')
            .set('authorization', `${TEST_DATA.userToken}`)
            .send({
                handle: 'sup', 
                name: 'test company get route number two',
                _token: TEST_DATA.userToken
            })
        
        const res = await request(app)
            .get('/companies?search=number')
            .send({
                _token: TEST_DATA.userToken
            });

        expect(res.body.companies).toHaveLength(1)
        expect(res.body.companies[0]).toHaveProperty('handle')
    })

    test("error with max smaller than min", async function(){
        const response = await request(app)
            .get('/companies/?max_employees=3&min_employees=4')
            .send({
                _token: TEST_DATA.userToken
            });

        expect(response.body.status).toBe(400)
        expect(response.body.message).toBe("min employees must be less than max employees")
    })
})

describe("POST /companies", function() {
    test('makes a new company', async function(){
        const response = await request(app)
            .post('/companies')
            .send({
                handle: 'cat',
                name: 'meow cat company',
                _token: TEST_DATA.userToken
            })
        
        expect(response.statusCode).toBe(200);
        expect(response.body.newCompany).toHaveProperty('handle')
        expect(response.body.newCompany.name).toBe('meow cat company')
    })

    test('stops company with duplicate handle from being created', async function(){
        const response = await request(app)
            .post('/companies')
            .send({
                handle: 'testhandle',
                name: 'duplicate handle test company',
                _token: TEST_DATA.userToken
            })
        
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toBe('company with handle testhandle already exists')
    })
})

describe('GET /companies/:handle', function(){
    test('gets a company by handle', async function(){
        const response = await request(app)
            .get(`/companies/${TEST_DATA.currentCompany.handle}`)
            .send({
                _token: TEST_DATA.userToken
            })

        expect(response.statusCode).toBe(200)
        expect(response.body.company).toHaveProperty('handle')
        expect(response.body.company.num_employees).toBe(47)
    })

    test('error when tries to get company with non-existent handle', async function(){
        const response = await request(app)
            .get('/companies/fakehandle')
            .send({
                _token: TEST_DATA.userToken
            })

        expect(response.statusCode).toBe(404)
    })
})

describe('PATCH /companies/:handle', function(){
    test('updates a company', async function(){
        const response = await request(app)
            .patch(`/companies/${TEST_DATA.currentCompany.handle}`)
            .send({
                description: 'this is a new description!',
                _token: TEST_DATA.userToken
            })

        expect(response.statusCode).toBe(200)
        expect(response.body.company.description).toBe('this is a new description!')
        expect(response.body.company).toHaveProperty('handle')
    })

    test('error when trying to update company with non-existent handle', async function(){
        const response = await request(app)
            .patch('/companies/thishandleisfake')
            .send({
                description: 'this is a new description!',
                _token: TEST_DATA.userToken
            })

        expect(response.statusCode).toBe(404)
    })

    test('does not allow updates to a handle', async function(){
        const response = await request(app)
            .patch(`/companies/${TEST_DATA.currentCompany.handle}`)
            .send({
                handle: 'newhandle',
                _token: TEST_DATA.userToken
            })

        expect(response.statusCode).toBe(400)
    })
})

describe('DELETE /companies/:handle', function(){
    test('deletes a company', async function(){
        const response = await request(app)
            .delete(`/companies/${TEST_DATA.currentCompany.handle}`)
            .send({
                _token: TEST_DATA.userToken
            })

        expect(response.statusCode).toBe(200)
        expect(response.body.message).toBe('company with handle testhandle deleted')
    })

    test('throws error for fake handle', async function(){
        const response = await request(app).delete('/companies/fakehandle')

        expect(response.statusCode).toBe(404)
    })
})


afterEach(async function() {
    try {
        await db.query('DELETE FROM companies')
        await db.query('DELETE FROM users')
    } catch(err){
        console.error(err)
    }
})

afterAll(async function() {
    try {
        await db.end()
    } catch(err){
        console.error(err)
    }})


