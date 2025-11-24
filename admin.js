// Admin Panel Logic

// Check Auth
function checkAuth() {
    const isLoginPage = window.location.pathname.includes('login.html');
    const isLoggedIn = localStorage.getItem('viranet_admin_logged_in') === 'true';

    if (!isLoggedIn && !isLoginPage) {
        window.location.href = 'login.html';
    } else if (isLoggedIn && isLoginPage) {
        window.location.href = 'admin.html';
    }
}

// Run auth check immediately
checkAuth();

// Login Handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;

        if (u === 'admin' && p === 'admin') {
            localStorage.setItem('viranet_admin_logged_in', 'true');
            window.location.href = 'admin.html';
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    });
}

// Logout
function logout() {
    localStorage.removeItem('viranet_admin_logged_in');
    window.location.href = 'login.html';
}

// Dashboard Logic
if (window.location.pathname.includes('admin.html')) {

    // Initial Load
    document.addEventListener('DOMContentLoaded', () => {
        renderPackages();
        renderTickets();
    });

    // Navigation
    window.showSection = function (sectionId) {
        document.getElementById('packages-section').style.display = sectionId === 'packages' ? 'block' : 'none';
        document.getElementById('tickets-section').style.display = sectionId === 'tickets' ? 'block' : 'none';

        // Update Sidebar Active State
        document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
        if (sectionId === 'packages') document.querySelector('.sidebar-menu li:nth-child(1) a').classList.add('active');
        if (sectionId === 'tickets') document.querySelector('.sidebar-menu li:nth-child(2) a').classList.add('active');
    };

    // --- PACKAGES CRUD ---

    function getPackages() {
        // Reuse default packages if empty (same logic as main.js)
        let pkgs = JSON.parse(localStorage.getItem('viranet_packages'));
        if (!pkgs || pkgs.length === 0) {
            // Default data needs to be defined here too or shared. 
            // For simplicity, we assume main.js has run once or we re-define defaults.
            pkgs = [
                { id: 1, name: 'Paket Harian', price: 'Rp 5.000', period: '/ 24 Jam', speed: '10 Mbps', features: ['Unlimited Quota'], type: 'voucher' },
                { id: 2, name: 'Paket Mingguan', price: 'Rp 30.000', period: '/ 7 Hari', speed: '15 Mbps', features: ['Unlimited Quota'], type: 'voucher' },
                { id: 3, name: 'Rumahan Basic', price: 'Rp 150.000', period: '/ Bulan', speed: '20 Mbps', features: ['Unlimited Quota'], type: 'monthly' },
                { id: 4, name: 'Rumahan Pro', price: 'Rp 250.000', period: '/ Bulan', speed: '50 Mbps', features: ['Unlimited Quota'], type: 'monthly' }
            ];
            localStorage.setItem('viranet_packages', JSON.stringify(pkgs));
        }
        return pkgs;
    }

    function renderPackages() {
        const tbody = document.getElementById('packages-table-body');
        const pkgs = getPackages();

        tbody.innerHTML = pkgs.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.price}</td>
                <td>${p.speed}</td>
                <td>${p.period}</td>
                <td>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" onclick="editPackage(${p.id})">Edit</button>
                    <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem; background: #EF4444;" onclick="deletePackage(${p.id})">Hapus</button>
                </td>
            </tr>
        `).join('');
    }

    window.openAddModal = function () {
        document.getElementById('package-form').reset();
        document.getElementById('pkg-id').value = '';
        document.getElementById('modal-title').innerText = 'Tambah Paket';
        document.getElementById('package-modal').style.display = 'flex';
    };

    window.closeModal = function () {
        document.getElementById('package-modal').style.display = 'none';
    };

    window.editPackage = function (id) {
        const pkgs = getPackages();
        const p = pkgs.find(x => x.id === id);
        if (p) {
            document.getElementById('pkg-id').value = p.id;
            document.getElementById('pkg-name').value = p.name;
            document.getElementById('pkg-price').value = p.price;
            document.getElementById('pkg-period').value = p.period;
            document.getElementById('pkg-speed').value = p.speed;
            document.getElementById('pkg-features').value = p.features.join(', ');

            document.getElementById('modal-title').innerText = 'Edit Paket';
            document.getElementById('package-modal').style.display = 'flex';
        }
    };

    window.deletePackage = function (id) {
        if (confirm('Yakin ingin menghapus paket ini?')) {
            let pkgs = getPackages();
            pkgs = pkgs.filter(x => x.id !== id);
            localStorage.setItem('viranet_packages', JSON.stringify(pkgs));
            renderPackages();
        }
    };

    const pkgForm = document.getElementById('package-form');
    if (pkgForm) {
        pkgForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('pkg-id').value;
            const name = document.getElementById('pkg-name').value;
            const price = document.getElementById('pkg-price').value;
            const period = document.getElementById('pkg-period').value;
            const speed = document.getElementById('pkg-speed').value;
            const features = document.getElementById('pkg-features').value.split(',').map(s => s.trim());

            let pkgs = getPackages();

            if (id) {
                // Edit
                const idx = pkgs.findIndex(x => x.id == id);
                if (idx !== -1) {
                    pkgs[idx] = { ...pkgs[idx], name, price, period, speed, features };
                }
            } else {
                // Add
                const newId = pkgs.length > 0 ? Math.max(...pkgs.map(p => p.id)) + 1 : 1;
                pkgs.push({ id: newId, name, price, period, speed, features, type: 'custom' });
            }

            localStorage.setItem('viranet_packages', JSON.stringify(pkgs));
            closeModal();
            renderPackages();
        });
    }

    // --- TICKETS LOGIC ---

    function getTickets() {
        return JSON.parse(localStorage.getItem('viranet_tickets')) || [];
    }

    function renderTickets() {
        const tbody = document.getElementById('tickets-table-body');
        const tickets = getTickets();

        if (tickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Belum ada pengaduan.</td></tr>';
            return;
        }

        tbody.innerHTML = tickets.map(t => `
            <tr>
                <td>${t.date}</td>
                <td>${t.name}</td>
                <td>${t.phone}</td>
                <td>${t.issue}</td>
                <td><span class="status-badge ${t.status === 'Pending' ? 'status-pending' : 'status-solved'}">${t.status}</span></td>
                <td>
                    ${t.status === 'Pending' ? `<button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem; background: #10B981;" onclick="solveTicket(${t.id})">Selesai</button>` : '-'}
                </td>
            </tr>
        `).join('');
    }

    window.solveTicket = function (id) {
        let tickets = getTickets();
        const idx = tickets.findIndex(t => t.id === id);
        if (idx !== -1) {
            tickets[idx].status = 'Selesai';
            localStorage.setItem('viranet_tickets', JSON.stringify(tickets));
            renderTickets();
        }
    };
}
