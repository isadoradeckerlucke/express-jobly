process.env.NODE_ENV = "test"

const request = require('supertest')
const app = require("../app");
const db = require("../db");

// handle of test company
let company_handle;

beforeEach(async() => {
  let result = await db.query(`INSERT INTO companies (handle, name, num_employees, description, logo_url)
  VALUES(
    'testhandle',
    'testcompanyname',
    47,
    'this is a test company',
    'https://www.google.com/'
  ) RETURNING handle`)
  company_handle = result.rows[0].handle
})

describe("partialUpdate()", () => {
  it("should generate a proper partial update query with just 1 field",
    function () {
      const response = await request(app)
        .patch('/companies')
        .send({
          logo_url: 'https://www.amazon.com/'
        })
    expect(response.body.company.logo_url).toBe('https://www.amazon.com/')
    expect(response.body.company.name).toBe('testcompanyname')
  });
});
