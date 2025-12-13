require('dotenv').config({ path: '../.env' }); // Load .env from parent dir
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const newUsername = process.argv[2];
const newPassword = process.argv[3];

if (!newUsername || !newPassword) {
    console.log('\n❌ Usage: node tools/reset_admin.js <NewUsername> <NewPassword>');
    console.log('   Example: node tools/reset_admin.js Budi Rahasia123\n');
    process.exit(1);
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function resetAdmin() {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Check if Admin exists first
        const [users] = await pool.promise().query("SELECT * FROM users LIMIT 1");

        if (users.length === 0) {
            // Insert
            await pool.promise().query(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [newUsername, 'admin@viranet.com', hashedPassword]
            );
            console.log(`\n✅ SUKSES: User baru dibuat.`);
        } else {
            // Update the first user found (usually Admin)
            await pool.promise().query(
                'UPDATE users SET username = ?, password = ? WHERE id = ?',
                [newUsername, hashedPassword, users[0].id]
            );
            console.log(`\n✅ SUKSES: Akun Admin diperbarui.`);
        }

        console.log(`\n👉 Username : ${newUsername}`);
        console.log(`👉 Password : ${newPassword}`);
        console.log(`\nSilakan login dengan akun baru ini!\n`);

    } catch (error) {
        console.error('\n❌ ERROR:', error);
    } finally {
        pool.end();
    }
}

resetAdmin();
