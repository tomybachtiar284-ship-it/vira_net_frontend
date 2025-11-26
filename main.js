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

    // Sticky Header logic removed to preserve red gradient background
    const header = document.querySelector('header');
    // Header style is now fully controlled by CSS

    // Load Packages (if on packages page or homepage)
    loadPackages();

    // Initialize Gallery (if on gallery page)
    initGallery();

    // Navbar Scroll Effect
    const transparentNavbar = document.querySelector('.navbar-transparent');
    if (transparentNavbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                transparentNavbar.classList.add('scrolled');
            } else {
                transparentNavbar.classList.remove('scrolled');
            }
        });
    }
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
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;

        // Save to localStorage (Simulating backend)
        const tickets = JSON.parse(localStorage.getItem('viranet_tickets')) || [];
        const newTicket = {
            id: Date.now(),
            name,
            phone,
            subject,
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

// ===== GALLERY FUNCTIONALITY =====

let currentLightboxIndex = 0;
let galleryItems = [];

function initGallery() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryGrid = document.getElementById('gallery-grid');

    if (!galleryGrid) return; // Not on gallery page

    // Get all gallery items
    galleryItems = Array.from(document.querySelectorAll('.gallery-item-enhanced, .gallery-card-modern, .gallery-card-premium'));

    // Filter button click handlers
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Get filter category
            const filter = btn.getAttribute('data-filter');

            // Filter gallery items
            filterGallery(filter);
        });
    });

    // Gallery item click handlers (open lightbox)
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            openLightbox(index);
        });
    });

    // Lightbox controls
    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateLightbox(-1));
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateLightbox(1));
    }

    // Close on background click
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox || lightbox.style.display !== 'flex') return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            navigateLightbox(-1);
        } else if (e.key === 'ArrowRight') {
            navigateLightbox(1);
        }
    });
}

function filterGallery(category) {
    galleryItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');

        if (category === 'all' || itemCategory === category) {
            item.style.display = 'block';
            // Add fade-in animation
            item.style.animation = 'fadeIn 0.5s ease';
        } else {
            item.style.display = 'none';
        }
    });
}

function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxVideo = document.getElementById('lightbox-video');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDesc = document.getElementById('lightbox-desc');

    if (!lightbox) return;

    currentLightboxIndex = index;
    const item = galleryItems[index];
    const isVideo = item.classList.contains('video-item');

    // Get item details
    const overlay = item.querySelector('.gallery-overlay, .gallery-overlay-modern');
    const title = overlay.querySelector('h3').textContent;
    const desc = overlay.querySelector('p').textContent;

    // Update lightbox content
    lightboxTitle.textContent = title;
    lightboxDesc.textContent = desc;

    if (isVideo) {
        // Show video, hide image
        const videoUrl = item.getAttribute('data-video');
        lightboxVideo.src = videoUrl;
        lightboxVideo.style.display = 'block';
        lightboxImg.style.display = 'none';
    } else {
        // Show image, hide video
        const img = item.querySelector('img');
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxImg.style.display = 'block';
        lightboxVideo.style.display = 'none';
        lightboxVideo.src = ''; // Stop video if any
    }

    // Show lightbox
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scroll
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxVideo = document.getElementById('lightbox-video');

    if (!lightbox) return;

    lightbox.style.display = 'none';
    lightboxVideo.src = ''; // Stop video
    document.body.style.overflow = 'auto'; // Restore scroll
}

function navigateLightbox(direction) {
    // Get only visible items (current filter)
    const visibleItems = galleryItems.filter(item => item.style.display !== 'none');

    if (visibleItems.length === 0) return;

    // Find current index in visible items
    const currentVisibleIndex = visibleItems.findIndex(item =>
        item === galleryItems[currentLightboxIndex]
    );

    // Calculate new index
    let newVisibleIndex = currentVisibleIndex + direction;

    // Wrap around
    if (newVisibleIndex < 0) {
        newVisibleIndex = visibleItems.length - 1;
    } else if (newVisibleIndex >= visibleItems.length) {
        newVisibleIndex = 0;
    }

    // Get actual index in all items
    const newItem = visibleItems[newVisibleIndex];
    const newIndex = galleryItems.indexOf(newItem);

    // Open new lightbox
    openLightbox(newIndex);
}

// ===== SCROLL ANIMATION =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target); // Only animate once
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const scrollElements = document.querySelectorAll('.scroll-reveal');
    scrollElements.forEach(el => observer.observe(el));

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                // Close other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                // Toggle current item
                item.classList.toggle('active');
            });
        }
    });

    // Coverage Check Form
    const coverageForm = document.getElementById('check-coverage-form');
    if (coverageForm) {
        coverageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = coverageForm.querySelector('input').value;
            alert(`Terima kasih! Kami sedang mengecek ketersediaan jaringan di "${input}". Tim kami akan segera menghubungi Anda jika area tersebut tercover.`);
            coverageForm.reset();
        });
    }

    // Support Form
    const supportForm = document.getElementById('support-form');
    if (supportForm) {
        supportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Pesan Anda telah terkirim! Tim kami akan segera menghubungi Anda.');
            supportForm.reset();
        });
    }
});
