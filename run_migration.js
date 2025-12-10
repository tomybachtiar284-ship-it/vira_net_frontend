const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
});

const sqlFile = path.join(__dirname, '.gemini/antigravity/brain/5043e016-7277-4913-b494-817c7ebd91dc/setup_full_db.sql');
// Fallback path in case the absolute path differs in environment, but we will try to read the content directly from the tool call logic usually
// For this script, we'll assume the file is copied to the root or we read the content provided.
// Since we can't easily access the artifact path from this script without exact path knowledge, let's embed the SQL or read from a known location.
// Actually, I will just embed the SQL queries here for reliability in this script runner.

const sqlQueries = `
USE viranet_db;

CREATE TABLE IF NOT EXISTS packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price INT NOT NULL,
    speed VARCHAR(50) NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    period VARCHAR(50) DEFAULT '/bulan',
    features TEXT,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status ENUM('Pending', 'Proses', 'Selesai') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO packages (name, price, speed, status, features, is_popular) 
SELECT * FROM (SELECT 'Rumahan Basic', 150000, '10 Mbps', 'Active', 'Unlimited Kuota,1-3 Device', FALSE) AS tmp
WHERE NOT EXISTS (SELECT name FROM packages WHERE name = 'Rumahan Basic') LIMIT 1;

INSERT INTO packages (name, price, speed, status, features, is_popular) 
SELECT * FROM (SELECT 'Rumahan Pro', 250000, '20 Mbps', 'Active', 'Unlimited Kuota,4-7 Device,Prioritas Support', TRUE) AS tmp
WHERE NOT EXISTS (SELECT name FROM packages WHERE name = 'Rumahan Pro') LIMIT 1;

INSERT INTO packages (name, price, speed, status, features, is_popular) 
SELECT * FROM (SELECT 'Gamer Elite', 350000, '50 Mbps', 'Active', 'Unlimited Kuota,10+ Device,IP Public Static', FALSE) AS tmp
WHERE NOT EXISTS (SELECT name FROM packages WHERE name = 'Gamer Elite') LIMIT 1;
`;

connection.connect((err) => {
    if (err) {
        console.error('Error connecting: ' + err.stack);
        return;
    }
    console.log('Connected as id ' + connection.threadId);

    connection.query(sqlQueries, (err, results) => {
        if (err) throw err;
        console.log('Database tables setup successfully.');
        console.log('Packages table created.');
        console.log('Complaints table created.');
        connection.end();
    });
});
