process.env.NODE_ENV === "test"

const request = require('supertest')
const app = require("../../app");
const User = require('../../models/user');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const db = require('../../db')

const TEST_DATA = {}

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

    }catch(err){
        console.error(err)
    }
})

describe("GET /users", function(){    
    test("shows all users", async function(){
        const response = await request(app)
            .get('/users')
            .send({ _token: TEST_DATA.userToken})

        console.log(TEST_DATA, 'i am test data from inside test users')
        expect(response.body.users).toHaveLength(1);
        expect(response.body.users[0]).toHaveProperty('username');
    })
})

describe("POST /users", function() {
    test('makes a new user', async function(){
        const response = await request(app)
            .post('/users')
            .send({
                username: 'testusernamehello',
                password: 'passwordtest',
                first_name: 'test',
                last_name: 'tester',
                email: 'thisisatest@gmail.com',
                photo_url: 'testphoto.com',
                is_admin: false
            })

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token')

        });

    test('stops user with duplicate username from being created', async function(){
        const response = await request(app)
            .post('/users')
            .send({
                username: 'testuser',
                password: 'passwordtest',
                first_name: 'test',
                last_name: 'tester',
                email: 'hello@gmail.com',
                photo_url: 'testphoto.com',
                is_admin: false
            })
        
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toBe('user with username testuser already exists')
    })

    test('stops user with duplicate email from being created', async function(){
        const response = await request(app)
            .post('/users')
            .send({
                username: 'hitesttest',
                password: 'passwordtest',
                first_name: 'test',
                last_name: 'tester',
                email: 'test@gmail.com',
                photo_url: 'testphoto.com',
                is_admin: false
            })
        
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toBe('user with email test@gmail.com already exists')
    })
})


describe('GET /users/:username', function(){
    test('gets a user by username', async function(){
        const response = await request(app)
            .get(`/users/${TEST_DATA.currentUsername}`)
            .send({ _token: TEST_DATA.userToken})

        expect(response.statusCode).toBe(200)
        expect(response.body.user).toHaveProperty('username')
        expect(response.body.user.last_name).toBe('testtest')
    })

    test('error when tries to get user with non-existent username', async function(){
        const response = await request(app)
            .get('/users/fakeusername')
            .send({ _token: TEST_DATA.userToken })

        expect(response.statusCode).toBe(404)
    })
})

describe('PATCH /users/:username', function(){
    test('updates a user', async function(){
        const response = await request(app)
            .patch(`/users/${TEST_DATA.currentUsername}`)
            .send({
                last_name: 'newtestname',
                _token: TEST_DATA.userToken
            })

        expect(response.statusCode).toBe(200)
        // expect(response.body.user.last_name).toBe('newtestname')
        expect(response.body.user).toHaveProperty('username')
        expect(response.body.user).not.toHaveProperty('password')
    })

    test('error when trying to update user with non-existent username', async function(){
        const response = await request(app)
            .patch('/users/faketestusername')
            .send({
                last_name: 'newtestname',
                _token: TEST_DATA.userToken
            })

        expect(response.statusCode).toBe(401)
    })
})

describe('DELETE /users/:username', function(){
    test('deletes a user', async function(){
        const response = await request(app)
            .delete(`/users/${TEST_DATA.currentUsername}`)
            .send({
                _token: TEST_DATA.userToken
            })

        expect(response.statusCode).toBe(200)
        expect(response.body.message).toBe('user with username testuser deleted')
    })

    test('stops a user from deleting another user', async function() {
        const response = await request(app)
          .delete(`/users/notme`)
          .send({ _token: TEST_DATA.userToken });
        expect(response.statusCode).toBe(401);
    });
})


afterEach(async function() {
    try {
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


