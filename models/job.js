const { response } = require("express");
const db = require("../db");
const ExpressError = require("../helpers/ExpressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

class Job {
    static async findAll(data) {
        let baseQuery = `SELECT title, company_handle FROM jobs`;
        let whereExpressions = [];
        let queryValues = [];

        if (data.min_salary){
            queryValues.push(+data.min_salary);
            whereExpressions.push(`salary >= $${queryValues.length}`)
        }

        
        if (data.min_equity){
            queryValues.push(+data.min_equity);
            whereExpressions.push(`equity >= $${queryValues.length}`)
        }
        
        if (data.search){
            queryValues.push(`%${data.search}%`);
            whereExpressions.push(`title LIKE $${queryValues.length}`)
        }

        if (whereExpressions.length > 0){
            baseQuery += ' WHERE ';
        }

        let finalQuery = baseQuery + whereExpressions.join(' AND ') + ' ORDER BY title';

        const jobs = await db.query(finalQuery, queryValues)

        // if (jobs.rows.length === 0){
        //     throw new ExpressError('no jobs match your search terms', 400)
        // }
        return jobs.rows
    }    
    
    static async createNew(data) {
        const checkForDoubles = await db.query(
            `SELECT id FROM jobs WHERE id = $1`, 
            [data.id]
        );

        if (checkForDoubles.rows[0]) {
            throw new ExpressError(`job with id ${data.id} already exists`, 400)
        }

        const checkCompanyExists = await db.query(
            `SELECT handle FROM companies WHERE handle = $1`,
            [data.company_handle]
        )
        
        if (!checkCompanyExists.rows[0]){
            throw new ExpressError(`there is no company in the system with handle ${data.company_handle}`)
        }

        const job = await db.query(
            `INSERT INTO jobs (title, salary, equity, company_handle)
            VALUES($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle, date_posted`, 
            [data.title, data.salary, data.equity, data.company_handle])
            
        return job.rows[0]
    }

    static async findById(id) {
        const job = await db.query(
            `SELECT * FROM jobs WHERE id = $1`,
            [id]
        )

        if (!job.rows[0]){
            throw new ExpressError(`there is no job with id ${id}`, 404)
        }
        return job.rows[0]
    }

    static async update(id, data) {
        const {query, values} = sqlForPartialUpdate('jobs', data, 'id', id);

        const result = await db.query(query, values)
        const job = result.rows[0]

        if (!job){
            throw new ExpressError(`there is no job with id ${id}`, 404)
        }
        return job;
    }

    static async delete(id) {
        const deletedJob = await db.query(
            `DELETE FROM jobs WHERE id = $1 RETURNING id`,
            [id]
        )

        if (deletedJob.rows.length === 0) {
            throw new ExpressError(`there is no job with id ${id}`, 404)
        }   
    }

}

module.exports = Job;