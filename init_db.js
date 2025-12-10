const mysql = require('mysql2');
require('dotenv').config();

// Create connection without database selected
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL server.');

    // Create Database
    connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err, result) => {
        if (err) throw err;
        console.log(`Database ${process.env.DB_NAME} created or already exists.`);

        // Switch to the database
        connection.changeUser({ database: process.env.DB_NAME }, (err) => {
            if (err) throw err;
            console.log(`Switched to ${process.env.DB_NAME}.`);

            // Create Users Table
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            connection.query(createTableQuery, (err, result) => {
                if (err) throw err;
                console.log('Users table created or already exists.');

                // Insert Dummy Data
                const insertUserQuery = `
                    INSERT INTO users (username, email) 
                    SELECT * FROM (SELECT 'Admin', 'admin@viranet.com') AS tmp
                    WHERE NOT EXISTS (
                        SELECT username FROM users WHERE username = 'Admin'
                    ) LIMIT 1;
                `;
                connection.query(insertUserQuery, (err, result) => {
                    if (err) throw err;
                    console.log('Dummy user inserted.');
                    connection.end();
                    console.log('Setup finished.');
                });
            });
        });
    });
});
