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
            localStorage.setItem('viranet_admin_username', u);
            window.location.href = 'admin.html';
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    });
}

function logout() {
    localStorage.removeItem('viranet_admin_logged_in');
    window.location.href = 'login.html';
}

// Dashboard Logic
if (window.location.pathname.includes('admin.html')) {

    document.addEventListener('DOMContentLoaded', () => {
        // Set User Profile
        const username = localStorage.getItem('viranet_admin_username') || 'Admin';
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl) {
            adminNameEl.innerText = username.charAt(0).toUpperCase() + username.slice(1);
        }

        renderPackages();
        renderTickets();
        updateDashboard();
    });

    // Navigation
    window.showSection = function (sectionId) {
        // Hide all sections
        document.getElementById('dashboard-section').style.display = 'none';
        document.getElementById('packages-section').style.display = 'none';
        document.getElementById('tickets-section').style.display = 'none';

        // Show selected
        document.getElementById(sectionId + '-section').style.display = 'block';

        // Update Sidebar
        document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
        const navItem = document.getElementById('nav-' + sectionId);
        if (navItem) navItem.classList.add('active');

        // Update Page Title
        const titles = {
            'dashboard': 'Dashboard',
            'packages': 'Paket Internet',
            'tickets': 'Pengaduan'
        };
        document.getElementById('page-title').innerText = titles[sectionId];
    };

    function updateDashboard() {
        const pkgs = getPackages();
        const tickets = getTickets();
        const pending = tickets.filter(t => t.status === 'Pending').length;

        // Update Stats
        document.getElementById('total-packages-dash').innerText = pkgs.length;
        document.getElementById('pending-tickets-dash').innerText = pending;

        // Populate Dashboard Packages Preview
        const dashPkgBody = document.getElementById('dashboard-packages-body');
        if (dashPkgBody) {
            dashPkgBody.innerHTML = pkgs.slice(0, 5).map(p => `
                <tr>
                    <td style="font-weight: 600;">${p.name}</td>
                    <td>${p.price}</td>
                    <td>${p.speed}</td>
                    <td><span class="status-badge active">Active</span></td>
                </tr>
            `).join('');
        }
    }

    // --- PACKAGES CRUD ---
    function getPackages() {
        let pkgs = JSON.parse(localStorage.getItem('viranet_packages'));
        if (!pkgs || pkgs.length === 0) {
            // Default data matching main.js
            pkgs = [
                { id: 1, name: 'Paket Harian', price: 'Rp 5.000', period: '/ 24 Jam', speed: '10 Mbps', features: ['Unlimited Quota', 'No FUP', 'Game & Stream Lancar', '1 Device'], type: 'voucher' },
                { id: 2, name: 'Paket Mingguan', price: 'Rp 30.000', period: '/ 7 Hari', speed: '15 Mbps', features: ['Unlimited Quota', 'No FUP', 'Game & Stream Lancar', '2 Devices'], type: 'voucher' },
                { id: 3, name: 'Rumahan Basic', price: 'Rp 150.000', period: '/ Bulan', speed: '20 Mbps', features: ['Unlimited Quota', 'Router Pinjaman', 'Free Instalasi', 'Support 24/7'], type: 'monthly' },
                { id: 4, name: 'Rumahan Pro', price: 'Rp 250.000', period: '/ Bulan', speed: '50 Mbps', features: ['Unlimited Quota', 'Router Dual Band', 'Free Instalasi', 'Prioritas Support'], type: 'monthly' }
            ];
            localStorage.setItem('viranet_packages', JSON.stringify(pkgs));
        }
        return pkgs;
    }

    function renderPackages() {
        const tbody = document.getElementById('packages-table-body');
        if (!tbody) return;

        const pkgs = getPackages();
        tbody.innerHTML = pkgs.map(p => `
            <tr>
                <td style="font-weight: 600;">${p.name}</td>
                <td>${p.price}</td>
                <td>${p.speed}</td>
                <td>${p.period}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="editPackage(${p.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn btn-delete" onclick="deletePackage(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
        updateDashboard();
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
        if (confirm('Yakin hapus paket ini?')) {
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
                const idx = pkgs.findIndex(x => x.id == id);
                if (idx !== -1) pkgs[idx] = { ...pkgs[idx], name, price, period, speed, features };
            } else {
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
        if (!tbody) return;

        const tickets = getTickets();
        if (tickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #94A3B8;">Belum ada pengaduan.</td></tr>';
        } else {
            tbody.innerHTML = tickets.map(t => `
                <tr>
                    <td>${t.date}</td>
                    <td style="font-weight: 600;">${t.name}</td>
                    <td>${t.issue}</td>
                    <td><span class="status-badge ${t.status === 'Pending' ? 'pending' : 'active'}">${t.status}</span></td>
                    <td>
                        ${t.status === 'Pending' ? `<button class="action-btn btn-check" onclick="solveTicket(${t.id})"><i class="fas fa-check"></i></button>` : '-'}
                    </td>
                </tr>
            `).join('');
        }
        updateDashboard();
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
