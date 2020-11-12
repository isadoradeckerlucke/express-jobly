const db = require("../db");
const ExpressError = require("../helpers/ExpressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

class Company {
    static async findAll(data) {
        let baseQuery = `SELECT handle, name FROM companies`;
        let whereExpressions = [];
        let queryValues = [];

        //the + converts it from a string 
        if (+data.min_employees >= +data.max_employees){
            throw new ExpressError('min employees must be less than max employees', 400)
        }

        if (data.min_employees){
            queryValues.push(+data.min_employees);
            whereExpressions.push(`num_employees >= $${queryValues.length}`)
        }

        
        if (data.max_employees){
            queryValues.push(+data.max_employees);
            whereExpressions.push(`num_employees <= $${queryValues.length}`)
        }
        
        if (data.search){
            queryValues.push(`%${data.search}%`);
            whereExpressions.push(`name LIKE $${queryValues.length}`)
        }

        if (whereExpressions.length > 0){
            baseQuery += ' WHERE ';
        }

        let finalQuery = baseQuery + whereExpressions.join(' AND ') + ' ORDER BY name';

        const companiesRes = await db.query(finalQuery, queryValues)

        // if (companiesRes.rows.length === 0){
        //     throw new ExpressError('no companies match your search terms', 400)
        // }
        return companiesRes.rows
    }

    static async createNew(data) {
        const checkForDoubles = await db.query(
            `SELECT handle FROM companies WHERE handle = $1`, 
            [data.handle]
        );

        if (checkForDoubles.rows[0]) {
            throw new ExpressError(`company with handle ${data.handle} already exists`, 400)
        }
        
        const newCompany = await db.query(
            `INSERT INTO companies (handle, name, num_employees, description, logo_url)
            VALUES($1, $2, $3, $4, $5)
            RETURNING handle, name, num_employees, description, logo_url`, 
            [data.handle, data.name, data.num_employees, data.description, data.logo_url])
            
            return newCompany.rows[0]
    }

    static async findByHandle(handle) {
        const companyRes = await db.query(
            `SELECT * FROM companies WHERE handle = $1`,
            [handle]
        )

        if (!companyRes.rows[0]){
            throw new ExpressError(`there is no company with handle ${handle}`, 404)
        }

        const jobs = await db.query(
            `SELECT * FROM jobs WHERE company_handle = $1`,
            [handle]
        )
        const company = companyRes.rows[0]
        company.jobs = jobs.rows;

        return company;
    }

    static async update(handle, data) {
        const {query, values} = sqlForPartialUpdate('companies', data, 'handle', handle);

        const result = await db.query(query, values)
        const company = result.rows[0]

        if (!company){
            throw new ExpressError(`there is no company with handle ${handle}`, 404)
        }

        return company;
    }

    static async delete(handle) {
        const deletedCompany = await db.query(
            `DELETE FROM companies WHERE handle = $1 RETURNING handle`,
            [handle]
        )

        if (deletedCompany.rows.length === 0) {
            throw new ExpressError(`there is no company with handle ${handle}`, 404)
        }   
    }

}

// example query url: http://localhost:3000/companies/?search=aple&min_employees=20&max_employees=3000

module.exports = Company;
