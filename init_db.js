const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
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

            // Drop tables if they exist to ensure fresh schema
            connection.query('DROP TABLE IF EXISTS users', (err) => { if (err) throw err; });
            connection.query('DROP TABLE IF EXISTS packages', (err) => { if (err) throw err; });
            connection.query('DROP TABLE IF EXISTS complaints', (err) => { if (err) throw err; });

            // Create Users Table
            const createTableQuery = `
                CREATE TABLE users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) NOT NULL,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            connection.query(createTableQuery, async (err, result) => {
                if (err) throw err;
                console.log('Users table created or already exists.');

                // Insert Dummy User (Admin)
                const hashedPassword = await bcrypt.hash('admin123', 10);
                const insertUserQuery = `
                    INSERT INTO users (username, email, password) 
                    SELECT * FROM (SELECT 'Admin', 'admin@viranet.com', '${hashedPassword}') AS tmp
                    WHERE NOT EXISTS (
                        SELECT username FROM users WHERE username = 'Admin'
                    ) LIMIT 1;
                `;
                connection.query(insertUserQuery, (err, result) => {
                    if (err) throw err;
                    console.log('Dummy user inserted.');

                    // Create Packages Table
                    const createPackagesTable = `
                        CREATE TABLE IF NOT EXISTS packages (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(100) NOT NULL,
                            price DECIMAL(10, 0) NOT NULL,
                            speed VARCHAR(50) NOT NULL,
                            features TEXT,
                            period VARCHAR(20) DEFAULT '/bulan',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `;
                    connection.query(createPackagesTable, (err, result) => {
                        if (err) throw err;
                        console.log('Packages table created or already exists.');

                        // Insert Dummy Packages
                        const insertPackagesQuery = `
                            INSERT INTO packages (name, price, speed, features, period) 
                            SELECT * FROM (
                                SELECT 'Paket Hemat', 150000, '10 Mbps', 'Unlimited Kuota,Ideal untuk 1-3 perangkat,Support Streaming HD', '/bulan'
                                UNION ALL
                                SELECT 'Paket Keluarga', 250000, '20 Mbps', 'Unlimited Kuota,Ideal untuk 3-5 perangkat,Gaming Lancar', '/bulan'
                                UNION ALL
                                SELECT 'Paket Sultan', 400000, '50 Mbps', 'Unlimited Kuota,Prioritas Jaringan,Support 4K Streaming', '/bulan'
                            ) AS tmp
                            WHERE NOT EXISTS (
                                SELECT name FROM packages LIMIT 1
                            ) LIMIT 3;
                        `;
                        connection.query(insertPackagesQuery, (err, result) => {
                            if (err) throw err;
                            console.log('Dummy packages inserted.');

                            // Create Complaints Table
                            const createComplaintsTable = `
                                CREATE TABLE IF NOT EXISTS complaints (
                                    id INT AUTO_INCREMENT PRIMARY KEY,
                                    name VARCHAR(100) NOT NULL,
                                    phone VARCHAR(20) NOT NULL,
                                    subject VARCHAR(150) NOT NULL,
                                    message TEXT NOT NULL,
                                    status ENUM('Pending', 'Proses', 'Selesai') DEFAULT 'Pending',
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                )
                            `;
                            connection.query(createComplaintsTable, (err, result) => {
                                if (err) throw err;
                                console.log('Complaints table created or already exists.');

                                connection.end();
                                console.log('Setup finished.');
                            });
                        });
                    });
                });
            });
        });
    });
});
