const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Middleware
app.use(cors());
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

// Test Database Connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
    } else {
        console.log('Successfully connected to MySQL database!');
        connection.release();
    }
});

// ==========================================
// AUTH ROUTES
// ==========================================

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    pool.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
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

// ==========================================
// API ROUTES
// ==========================================

// TEST ROUTE
app.get('/', (req, res) => {
    res.send('<h1>Backend ViraNet Berjalan Normal! 🚀</h1><p>Silakan kembali ke <a href="http://127.0.0.1:5501/admin.html">Admin Dashboard</a> untuk mengelola data.</p>');
});

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
