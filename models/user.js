const db = require("../db");
const bcrypt = require('bcrypt')
const ExpressError = require("../helpers/ExpressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

const BCRYPT_WORK_FACTOR = 10;

class User{
    static async authenticate(data){
        const result = await db.query(
            `SELECT username, password, first_name, last_name, email, photo_url, is_admin
            FROM users WHERE username = $1`,
            [data.username]
        )
        const user = result.rows[0];

        if(user){
            const isValid = await bcrypt.compare(data.password, user.password)
            if(isValid){
                return user;
            }
        }

        throw new ExpressError('invalid password', 401)
    }

    static async findAll() {
        const users = await db.query(
            `SELECT username, first_name, last_name, email 
            FROM users 
            ORDER BY username`
        )
        return users.rows;
    }    
    
    static async createNew(data) {
        const checkForDoubleUsernames = await db.query(
            `SELECT username FROM users WHERE username = $1`, 
            [data.username]
        );
        const checkForDoubleEmails = await db.query(
            `SELECT email FROM users WHERE email = $1`, 
            [data.email]
        );
        if (checkForDoubleUsernames.rows[0]) {
            throw new ExpressError(`user with username ${data.username} already exists`, 400)
        }
        if (checkForDoubleEmails.rows[0]) {
            throw new ExpressError(`user with email ${data.email} already exists`, 400)
        }

        const hashedPassword = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR)

        const user = await db.query(
            `INSERT INTO users (username, password, first_name, last_name, email, photo_url, is_admin)
            VALUES($1, $2, $3, $4, $5, $6, $7)
            RETURNING username, password, first_name, last_name, email, photo_url, is_admin`, 
            [data.username, hashedPassword, data.first_name, data.last_name, data.email, data.photo_url, data.is_admin])
            
        return user.rows[0]
    }

    static async findByUsername(username) {
        const user = await db.query(
            `SELECT username, first_name, last_name, email, photo_url, is_admin
            FROM users WHERE username = $1`,
            [username]
        )

        if (!user.rows[0]){
            throw new ExpressError(`there is no user with username ${username}`, 404)
        }
        return user.rows[0]
    }

    static async update(username, data) {
        if (data.password){
            data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR)
        }

        let {query, values} = sqlForPartialUpdate('users', data, 'username', username);

        const result = await db.query(query, values)
        const user = result.rows[0]

        if (!user){
            throw new ExpressError(`there is no user with username ${username}`, 404)
        }

        delete user.password;
        delete user.is_admin;
        
        return user;
    }

    static async delete(username) {
        const deletedUser = await db.query(
            `DELETE FROM users WHERE username = $1 RETURNING username`,
            [username]
        )

        if (deletedUser.rowCount === 0) {
            throw new ExpressError(`there is no user with username ${username}`, 404)
        }   
    }
}

module.exports = User;
