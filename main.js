// Main JavaScript for ViraNet

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Sticky Header
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.9)';
            header.style.boxShadow = 'none';
        }
    });

    // Load Packages (if on packages page or homepage)
    loadPackages();
});

// Default Packages Data
const defaultPackages = [
    {
        id: 1,
        name: 'Paket Harian',
        price: 'Rp 5.000',
        period: '/ 24 Jam',
        speed: '10 Mbps',
        features: ['Unlimited Quota', 'No FUP', 'Game & Stream Lancar', '1 Device'],
        type: 'voucher'
    },
    {
        id: 2,
        name: 'Paket Mingguan',
        price: 'Rp 30.000',
        period: '/ 7 Hari',
        speed: '15 Mbps',
        features: ['Unlimited Quota', 'No FUP', 'Game & Stream Lancar', '2 Devices'],
        type: 'voucher'
    },
    {
        id: 3,
        name: 'Rumahan Basic',
        price: 'Rp 150.000',
        period: '/ Bulan',
        speed: '20 Mbps',
        features: ['Unlimited Quota', 'Router Pinjaman', 'Free Instalasi', 'Support 24/7'],
        type: 'monthly'
    },
    {
        id: 4,
        name: 'Rumahan Pro',
        price: 'Rp 250.000',
        period: '/ Bulan',
        speed: '50 Mbps',
        features: ['Unlimited Quota', 'Router Dual Band', 'Free Instalasi', 'Prioritas Support'],
        type: 'monthly'
    }
];

function loadPackages() {
    const packageContainer = document.getElementById('package-container');
    if (!packageContainer) return;

    // Get packages from localStorage or use default
    let packages = JSON.parse(localStorage.getItem('viranet_packages'));
    if (!packages || packages.length === 0) {
        packages = defaultPackages;
        localStorage.setItem('viranet_packages', JSON.stringify(packages));
    }

    packageContainer.innerHTML = packages.map(pkg => `
        <div class="package-card" data-aos="fade-up">
            <div class="package-header">
                <h3>${pkg.name}</h3>
                <div class="package-price">
                    ${pkg.price} <span>${pkg.period}</span>
                </div>
            </div>
            <div class="package-body">
                <ul class="package-features">
                    <li><i class="fas fa-tachometer-alt"></i> Speed up to ${pkg.speed}</li>
                    ${pkg.features.map(f => `<li><i class="fas fa-check-circle"></i> ${f}</li>`).join('')}
                </ul>
                <a href="https://wa.me/6285216315002?text=Halo%20ViraNet,%20saya%20ingin%20pesan%20${encodeURIComponent(pkg.name)}" 
                   class="btn btn-primary" style="width: 100%; margin-top: 2rem; text-align: center;">
                   <i class="fab fa-whatsapp"></i> Pesan Sekarang
                </a>
            </div>
        </div>
    `).join('');
}

// Support Form Handler
const supportForm = document.getElementById('support-form');
if (supportForm) {
    supportForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const issue = document.getElementById('issue').value;
        const message = document.getElementById('message').value;

        // Save to localStorage (Simulating backend)
        const tickets = JSON.parse(localStorage.getItem('viranet_tickets')) || [];
        const newTicket = {
            id: Date.now(),
            name,
            phone,
            issue,
            message,
            status: 'Pending',
            date: new Date().toLocaleDateString()
        };
        tickets.push(newTicket);
        localStorage.setItem('viranet_tickets', JSON.stringify(tickets));

        // Show success
        alert('Laporan Anda telah terkirim! Tim kami akan segera menghubungi Anda.');
        supportForm.reset();
    });
}
