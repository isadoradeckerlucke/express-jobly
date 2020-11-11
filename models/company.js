const db = require("../db");
const ExpressError = require("../helpers/ExpressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

class Company {
    static async findAll(data) {
        let baseQuery = `SELECT handle, name FROM companies`;
        let whereExpressions = [];
        let queryValues = [];

        // in solutions they have +data.min_employees and +data.max_employees etc. for all these, console.log to figure out what this does
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
        return companiesRes.rows




    }
}