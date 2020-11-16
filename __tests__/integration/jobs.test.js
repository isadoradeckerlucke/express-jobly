process.env.NODE_ENV === "test"

const request = require('supertest')
const app = require("../../app");
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const db = require('../../db')


const TEST_DATA = {};
beforeEach(async function() {
    try {
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
                password: 'password'
            })

        TEST_DATA.userToken = response.body.token;
        TEST_DATA.currentUsername = jwt.decode(TEST_DATA.userToken).username

        const newJob = await db.query(
            `INSERT INTO jobs (title, salary, equity, company_handle, id)
            VALUES($1, $2, $3, $4, $5)
            RETURNING *`, 
            ['test engineer', 100000, 0.4, TEST_DATA.currentCompany.handle, 1]
        )
        TEST_DATA.jobId = newJob.rows[0].id;
    }catch(err){
        console.error(err)
    }
})

describe("GET /jobs", function(){    
    test("shows all jobs", async function(){
        const response = await request(app).get('/jobs');

        expect(response.body.jobs).toHaveLength(1);
        expect(response.body.jobs[0]).toHaveProperty('title');
    })

    test("correctly filters if there are search queries", async function(){
        await request(app)
            .post('/jobs')
            .send({
                title: 'vet', 
                salary: 140000, 
                equity: .3, 
                company_handle: TEST_DATA.currentCompany.handle, 
                _token: TEST_DATA.userToken})
        
        await request(app)
            .post('/jobs')
            .send({
                title: 'vet tech', 
                salary: 60000, equity: .2, 
                company_handle: TEST_DATA.currentCompany.handle,
                _token: TEST_DATA.userToken})
                
        const res = await request(app).get('/jobs/?search=vet')

        expect(res.body.jobs).toHaveLength(2)
        expect(res.body.jobs[0]).toHaveProperty('title')
    })
})

describe("POST /jobs", function() {
    test('makes a new job', async function(){
        const response = await request(app)
            .post('/jobs')
            .send({
                title: 'cat',
                salary: 80000,
                equity: .1,
                company_handle: TEST_DATA.currentCompany.handle,
                _token: TEST_DATA.userToken
            })
        
        expect(response.statusCode).toBe(200);
        expect(response.body.job).toHaveProperty('title')
        expect(response.body.job).toHaveProperty('date_posted')
        expect(response.body.job.title).toBe('cat')
    })

    test('stops job with duplicate id from being created', async function(){
        const response = await request(app)
            .post('/jobs')
            .send({
                id: 1,
                title: 'duplicate test job',
                salary: 80000,
                equity: .1,
                company_handle: TEST_DATA.currentCompany.handle,
                _token: TEST_DATA.userToken
            })
        
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toBe('job with id 1 already exists')
    })

    test('stops job from being created if company does not exist', async function(){
        const response = await request(app)
        .post('/jobs')
        .send({
            title: 'cat',
            salary: 80000,
            equity: .1,
            company_handle: 'fakecompanyhandle',
            _token: TEST_DATA.userToken
        })

        expect(response.statusCode).toBe(400)
        expect(response.body.message).toBe('there is no company in the system with handle fakecompanyhandle')
    })
})

describe('GET /jobs/:id', function(){
    test('gets a job by id', async function(){
        const response = await request(app)
            .get(`/jobs/${TEST_DATA.jobId}`)
            .send({ _token: TEST_DATA.userToken })

        expect(response.statusCode).toBe(200)
        expect(response.body.job).toHaveProperty('title')
        expect(response.body.job.salary).toBe(100000)
    })

    test('error when tries to get job with non-existent id', async function(){
        const response = await request(app)
            .get('/jobs/45398')
            .send({ _token: TEST_DATA.userToken })

        expect(response.statusCode).toBe(404)
    })
})

describe('PATCH /jobs/:id', function(){
    test('updates a job', async function(){
        const response = await request(app)
            .patch(`/jobs/${TEST_DATA.jobId}`)
            .send({
                title: 'sr test engineer',
                _token: TEST_DATA.userToken
            })

        expect(response.statusCode).toBe(200)
        expect(response.body.job.title).toBe('sr test engineer')
        expect(response.body.job).toHaveProperty('title')
    })

    test('error when trying to update job with non-existent id', async function(){
        const response = await request(app)
            .patch('/jobs/837')
            .send({
                title: 'sr test engineer',
                _token: TEST_DATA.userToken
            })

        expect(response.statusCode).toBe(404)
    })

    test('does not allow updates to an id', async function(){
        const response = await request(app)
            .patch(`/jobs/${TEST_DATA.jobId}`)
            .send({
                id: 300,
                title: 'new test title',
                _token: TEST_DATA.userToken
            })

        expect(response.statusCode).toBe(400)
    })
})

describe('DELETE /jobs/:id', function(){
    test('deletes a job', async function(){
        const response = await request(app)
            .delete(`/jobs/${TEST_DATA.jobId}`)
            .send({ _token: TEST_DATA.userToken })
        expect(response.statusCode).toBe(200)
        expect(response.body.message).toBe('job with id 1 deleted')
    })

    test('throws error for fake id', async function(){
        const response = await request(app)
            .delete('/jobs/9794')
            .send({ _token: TEST_DATA.userToken })

        expect(response.statusCode).toBe(404)
    })
})


afterEach(async function() {
    try {
        await db.query('DELETE FROM jobs')
        await db.query('DELETE FROM users')
    } catch(err){
        console.error(err)
    }})

afterAll(async function() {
    try {
        await db.end()
    } catch(err){
        console.error(err)
    }
})


