const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showMenu() {
    console.log('\n--- MENU MANAJEMEN USER ---');
    console.log('1. Lihat Semua User (ID & Username)');
    console.log('2. Tambah User Baru');
    console.log('3. Ganti Password User');
    console.log('4. Hapus User');
    console.log('5. Keluar');
    rl.question('Pilih menu (1-5): ', handleMenu);
}

function handleMenu(choice) {
    if (choice === '1') {
        listUsers();
    } else if (choice === '2') {
        addUser();
    } else if (choice === '3') {
        updateUser();
    } else if (choice === '4') {
        deleteUser();
    } else if (choice === '5') {
        console.log('Bye!');
        connection.end();
        rl.close();
    } else {
        console.log('Pilihan tidak valid.');
        showMenu();
    }
}

function listUsers() {
    connection.query('SELECT id, username, email, created_at FROM users', (err, results) => {
        if (err) console.error(err.message);
        else {
            console.log('\nDAFTAR USER:');
            console.table(results);
        }
        showMenu();
    });
}

function addUser() {
    console.log('\n--- TAMBAH USER BARU ---');
    rl.question('Username: ', (username) => {
        rl.question('Email: ', (email) => {
            rl.question('Password: ', async (password) => {
                if (!username || !email || !password) {
                    console.log('Error: Semua data wajib diisi!');
                    showMenu();
                    return;
                }

                try {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
                    connection.query(query, [username, email, hashedPassword], (err) => {
                        if (err) console.error('Gagal menambah user:', err.message);
                        else console.log(`Sukses! User ${username} berhasil dibuat.`);
                        showMenu();
                    });
                } catch (e) {
                    console.error(e);
                    showMenu();
                }
            });
        });
    });
}

function updateUser() {
    console.log('\n--- GANTI PASSWORD USER ---');
    // First list users to help selecting ID
    connection.query('SELECT id, username FROM users', (err, results) => {
        if (err) {
            console.error(err);
            showMenu();
            return;
        }
        console.table(results);

        rl.question('Masukkan ID User ATAU Username yang akan diganti passwordnya: ', (input) => {
            rl.question('Password Baru: ', async (password) => {
                if (!password.trim()) {
                    console.log('Batal: Password tidak boleh kosong.');
                    showMenu();
                    return;
                }

                try {
                    const hashedPassword = await bcrypt.hash(password, 10);

                    // Determine if input is ID or Username
                    let query, params;
                    if (!isNaN(input)) {
                        // Input is ID
                        query = 'UPDATE users SET password = ? WHERE id = ?';
                        params = [hashedPassword, input];
                    } else {
                        // Input is Username
                        query = 'UPDATE users SET password = ? WHERE username = ?';
                        params = [hashedPassword, input];
                    }

                    connection.query(query, params, (err, result) => {
                        if (err) console.error(err.message);
                        else {
                            if (result.affectedRows === 0) console.log('User tidak ditemukan.');
                            else console.log('Password berhasil diubah!');
                        }
                        showMenu();
                    });
                } catch (e) {
                    console.error(e);
                    showMenu();
                }
            });
        });
    });
}

function deleteUser() {
    console.log('\n--- HAPUS USER ---');
    connection.query('SELECT id, username FROM users', (err, results) => {
        console.table(results);
        rl.question('Masukkan ID User yang akan dihapus: ', (id) => {
            if (id === '1') {
                console.log('PERINGATAN: Admin utama (ID 1) sebaiknya tidak dihapus!');
            }

            rl.question('Apakah Anda yakin? (y/n): ', (confirm) => {
                if (confirm.toLowerCase() === 'y') {
                    connection.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
                        if (err) console.error(err.message);
                        else {
                            if (result.affectedRows === 0) console.log('User ID tidak ditemukan.');
                            else console.log('User berhasil dihapus.');
                        }
                        showMenu();
                    });
                } else {
                    console.log('Dibatalkan.');
                    showMenu();
                }
            });
        });
    });
}

// Start Application
console.log('Connecting to database...');
setTimeout(showMenu, 500); // Small delay to let DB connect
