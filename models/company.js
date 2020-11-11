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

        if (companiesRes.rows.length === 0){
            throw new ExpressError('no companies match your search terms', 400)
        }
        return companiesRes.rows
    }
}

// example query url: http://localhost:3000/companies/?search=aple&min_employees=20&max_employees=3000

module.exports = Company;
