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
    });

    // Navigation
    window.showSection = function (sectionId) {
        document.getElementById('dashboard-section').style.display = 'none';
        document.getElementById('packages-section').style.display = 'none';
        document.getElementById('tickets-section').style.display = 'none';

        document.getElementById(sectionId + '-section').style.display = 'block';

        document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
        const navItem = document.getElementById('nav-' + sectionId);
        if (navItem) navItem.classList.add('active');

        const titles = {
            'dashboard': 'Dashboard',
            'packages': 'Paket Internet',
            'tickets': 'Pengaduan'
        };
        document.getElementById('page-title').innerText = titles[sectionId];
    };

    // --- PACKAGES CRUD (Real API) ---
    const API_URL = 'http://localhost:3000/api';

    async function fetchPackages() {
        try {
            const res = await fetch(`${API_URL}/packages`);
            return await res.json();
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    async function renderPackages() {
        const tbody = document.getElementById('packages-table-body');
        const dashBody = document.getElementById('dashboard-packages-body');
        const countEl = document.getElementById('total-packages-dash');

        const packages = await fetchPackages();

        if (countEl) countEl.innerText = packages.length;

        // Render Admin Table
        if (tbody) {
            tbody.innerHTML = packages.map(p => `
                <tr>
                    <td style="font-weight: 600;">${p.name}</td>
                    <td>Rp ${p.price.toLocaleString('id-ID')}</td>
                    <td>${p.speed}</td>
                    <td>${p.period}</td>
                    <td>
                        <button class="action-btn btn-delete" onclick="deletePackage(${p.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // Render Dashboard Preview
        if (dashBody) {
            dashBody.innerHTML = packages.slice(0, 5).map(p => `
                <tr>
                    <td style="font-weight: 600;">${p.name}</td>
                    <td>Rp ${p.price.toLocaleString('id-ID')}</td>
                    <td>${p.speed}</td>
                    <td><span class="status-badge active">Active</span></td>
                </tr>
            `).join('');
        }
    }

    // Add Package
    const pkgForm = document.getElementById('package-form');
    if (pkgForm) {
        pkgForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const payload = {
                name: document.getElementById('pkg-name').value,
                price: document.getElementById('pkg-price').value.replace(/\D/g, ''), // Remove non-numeric
                period: document.getElementById('pkg-period').value,
                speed: document.getElementById('pkg-speed').value,
                features: document.getElementById('pkg-features').value
            };

            try {
                const res = await fetch(`${API_URL}/packages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    alert('Paket berhasil ditambahkan!');
                    closeModal();
                    renderPackages();
                } else {
                    alert('Gagal menambah paket.');
                }
            } catch (err) {
                console.error(err);
                alert('Terjadi kesalahan koneksi.');
            }
        });
    }

    // Delete Package
    window.deletePackage = async function (id) {
        if (confirm('Yakin hapus paket ini dari database?')) {
            try {
                await fetch(`${API_URL}/packages/${id}`, { method: 'DELETE' });
                renderPackages();
            } catch (err) {
                alert('Gagal menghapus paket.');
            }
        }
    };

    // Modal Functions
    window.openAddModal = function () {
        document.getElementById('package-form').reset();
        document.getElementById('package-modal').style.display = 'flex';
    };

    window.closeModal = function () {
        document.getElementById('package-modal').style.display = 'none';
    };

    // --- COMPLAINTS/TICKETS (Real API) ---
    async function renderTickets() {
        const tbody = document.getElementById('tickets-table-body');
        const countEl = document.getElementById('pending-tickets-dash');

        try {
            const res = await fetch(`${API_URL}/complaints`);
            const tickets = await res.json();

            const pending = tickets.filter(t => t.status === 'Pending').length;
            if (countEl) countEl.innerText = pending;

            if (tbody) {
                if (tickets.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada pengaduan.</td></tr>';
                } else {
                    tbody.innerHTML = tickets.map(t => `
                        <tr>
                            <td>${new Date(t.created_at).toLocaleDateString()}</td>
                            <td style="font-weight: 600;">${t.name}<br><small style="color:#666">${t.phone}</small></td>
                            <td><b>${t.subject}</b><br>${t.message}</td>
                            <td><span class="status-badge ${t.status === 'Pending' ? 'pending' : 'active'}">${t.status}</span></td>
                            <td>
                                ${t.status === 'Pending' ? `
                                <button class="action-btn btn-check" onclick="updateTicketStatus(${t.id}, 'Selesai')">
                                    <i class="fas fa-check"></i>
                                </button>` : '-'}
                            </td>
                        </tr>
                    `).join('');
                }
            }
        } catch (err) {
            console.error('Error fetching tickets:', err);
        }
    }

    window.updateTicketStatus = async function (id, status) {
        try {
            await fetch(`${API_URL}/complaints/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            renderTickets();
        } catch (err) {
            alert('Gagal mengupdate status.');
        }
    };
}
