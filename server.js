const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
app.set('trust proxy', 1); // Trust proxy is required when running behind a proxy like Railway/Heroku

// Security & Performance Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https://via.placeholder.com"],
            frameSrc: ["'self'", "https://www.google.com"], // Allow Google Maps
            connectSrc: ["'self'"]
        }
    }
})); // Protects against common vulnerabilities (XSS, etc)
app.use(compression()); // Compresses responses for faster load

// Rate Limiting (Prevent Brute Force)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit to prevent false positives during testing
    message: 'Too many requests, please try again later.'
});
app.use(limiter);

// General Middleware
app.use(cors());
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'viranet_secret_key_123';

// Auth Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}


// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Database Connection & Initialize
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
    } else {
        console.log('Successfully connected to MySQL database!');
        initializeDatabase(connection);
        connection.release();
    }
});

async function initializeDatabase(connection) {
    try {
        // 1. Create Users Table
        await connection.promise().query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Create Default Admin if not exists
        const [users] = await connection.promise().query("SELECT * FROM users WHERE username = 'Admin' OR email = 'admin@viranet.com'");
        if (users.length === 0) {
            console.log('Creating default admin user...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.promise().query(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                ['Admin', 'admin@viranet.com', hashedPassword]
            );
            console.log('Default admin user created.');
        }

        // 3. Create Packages Table
        await connection.promise().query(`
            CREATE TABLE IF NOT EXISTS packages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(10, 0) NOT NULL,
                speed VARCHAR(50) NOT NULL,
                features TEXT,
                period VARCHAR(20) DEFAULT '/bulan',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Create Complaints Table
        await connection.promise().query(`
            CREATE TABLE IF NOT EXISTS complaints (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                subject VARCHAR(150) NOT NULL,
                message TEXT NOT NULL,
                status ENUM('Pending', 'Proses', 'Selesai') DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database initialized successfully.');

    } catch (error) {
        console.error('Database initialization failed:', error);
    }
}

// ==========================================
// AUTH ROUTES
// ==========================================

app.post('/api/auth/login', (req, res) => {
    const { email, username, password } = req.body;
    const loginKey = email || username;

    if (!loginKey || !password) {
        return res.status(400).json({ error: 'Email/Username and password are required' });
    }

    pool.query('SELECT * FROM users WHERE email = ? OR username = ?', [loginKey, loginKey], async (error, results) => {
        if (error) return res.status(500).json({ error: error.message });

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = results[0];

        // Check password (handle both hashed and potentially plain text for legacy/dev)
        let validPassword = false;

        // Try bcrypt compare first
        if (user.password.startsWith('$2')) {
            validPassword = await bcrypt.compare(password, user.password);
        } else {
            // Fallback for plain text (development only, should be removed in prod)
            validPassword = (password === user.password);
        }

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login successful', token, user: { username: user.username, email: user.email } });
    });
});

app.put('/api/auth/change-password', authenticateToken, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // From token

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Password lama dan baru wajib diisi.' });
    }

    pool.query('SELECT * FROM users WHERE id = ?', [userId], async (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        if (results.length === 0) return res.status(404).json({ error: 'User tidak ditemukan.' });

        const user = results[0];

        // Verify current password
        let validPassword = false;
        if (user.password.startsWith('$2')) {
            validPassword = await bcrypt.compare(currentPassword, user.password);
        } else {
            validPassword = (currentPassword === user.password);
        }

        if (!validPassword) {
            return res.status(401).json({ error: 'Password lama salah.' });
        }

        // Update with new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Password berhasil diubah!' });
        });
    });
});

// ==========================================
// API ROUTES
// ==========================================

// TEST ROUTE
// Serve static files from 'public' directory
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for SPA (if needed, but for now just serve index.html on root)
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.get('/api/test-db', (req, res) => {
    pool.query('SELECT 1 + 1 AS solution', (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Database connection working!', solution: results[0].solution });
    });
});

// ------------------------------------------
// PACKAGES API (Paket Internet)
// ------------------------------------------

// Get All Packages
app.get('/api/packages', (req, res) => {
    pool.query('SELECT * FROM packages ORDER BY id ASC', (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json(results);
    });
});

// Add New Package
app.post('/api/packages', (req, res) => {
    const { name, price, speed, features, period } = req.body;
    const query = 'INSERT INTO packages (name, price, speed, features, period) VALUES (?, ?, ?, ?, ?)';
    pool.query(query, [name, price, speed, features, period || '/bulan'], (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Package added successfully!', id: results.insertId });
    });
});

// Delete Package
app.delete('/api/packages/:id', (req, res) => {
    const { id } = req.params;
    pool.query('DELETE FROM packages WHERE id = ?', [id], (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Package deleted successfully!' });
    });
});

// ------------------------------------------
// COMPLAINTS API (Pengaduan)
// ------------------------------------------

// Get All Complaints
app.get('/api/complaints', (req, res) => {
    pool.query('SELECT * FROM complaints ORDER BY created_at DESC', (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json(results);
    });
});

// Submit Complaint
app.post('/api/complaints', (req, res) => {
    const { name, phone, subject, message } = req.body;
    const query = 'INSERT INTO complaints (name, phone, subject, message) VALUES (?, ?, ?, ?)';
    pool.query(query, [name, phone, subject, message], (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Complaint submitted successfully!', id: results.insertId });
    });
});

// Update Complaint Status
app.put('/api/complaints/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Pending', 'Proses', 'Selesai'
    pool.query('UPDATE complaints SET status = ? WHERE id = ?', [status, id], (error, results) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Status updated successfully!' });
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
