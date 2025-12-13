// Main JavaScript for ViraNet

const API_URL = '/api';

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

    // Load Packages (home)
    loadPackages();

    // Load Pricing (packages page)
    loadPricingPackages();

    // Initialize Gallery (if on gallery page)
    if (typeof initGallery === 'function') initGallery();

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

// Load Packages from API (Home Page - Horizontal Cards)
async function loadPackages() {
    const packageContainer = document.getElementById('package-container');
    if (!packageContainer) return;

    try {
        const response = await fetch(`${API_URL}/packages`);
        const packages = await response.json();

        if (packages.length === 0) {
            packageContainer.innerHTML = '<p style="text-align:center; width:100%; color:#d32f2f;">Belum ada paket yang tersedia saat ini.</p>';
            return;
        }

        packageContainer.innerHTML = packages.map(pkg => `
            <div class="package-card" data-aos="fade-up">
                <div class="package-header">
                    <h3>${pkg.name}</h3>
                    <div class="package-price">
                        Rp ${parseInt(pkg.price).toLocaleString('id-ID')} <span>${pkg.period}</span>
                    </div>
                </div>
                <div class="package-body">
                    <ul class="package-features">
                        <li><i class="fas fa-tachometer-alt"></i> Speed up to ${pkg.speed}</li>
                        ${pkg.features ? pkg.features.split(',').map(f => `<li><i class="fas fa-check-circle"></i> ${f.trim()}</li>`).join('') : ''}
                    </ul>
                    <a href="https://wa.me/6285216315002?text=Halo%20ViraNet,%20saya%20ingin%20pesan%20${encodeURIComponent(pkg.name)}"
                       class="btn btn-primary" style="width: 100%; margin-top: 2rem; text-align: center;">
                       <i class="fab fa-whatsapp"></i> Pesan Sekarang
                    </a>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Gagal memuat paket:', error);
        packageContainer.innerHTML = '<p style="text-align:center; width:100%;">Gagal memuat data paket. Pastikan server aktif.</p>';
    }
}

// Load Pricing Packages (Services Page - Vertical/Pricing Cards)
async function loadPricingPackages() {
    const pricingContainer = document.getElementById('pricing-container');
    if (!pricingContainer) return;

    try {
        const response = await fetch(`${API_URL}/packages`);
        const packages = await response.json();

        if (packages.length === 0) {
            pricingContainer.innerHTML = '<div style="width:100%; text-align:center; grid-column: 1/-1;">Belum ada paket tersedia. Silakan hubungi admin.</div>';
            return;
        }

        pricingContainer.innerHTML = packages.map((pkg, index) => {
            // Check if popular (logic: maybe based on name containing 'Pro' or just 2nd item)
            // For now, let's make the 2nd item popular as per original design intention if available
            const isPopular = index === 1;

            return `
            <div class="pricing-card ${isPopular ? 'popular' : ''} scroll-reveal" style="transition-delay: ${0.1 * (index + 1)}s;">
                ${isPopular ? '<div class="popular-badge">Paling Laris</div>' : ''}
                <div class="pricing-header">
                    <h3>${pkg.name}</h3>
                    <div class="price">${parseInt(pkg.price / 1000)}K<span>${pkg.period}</span></div>
                    <p style="color: #64748B; font-size: 0.9rem;">${pkg.speed} High Speed Internet</p>
                </div>
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> Speed up to ${pkg.speed}</li>
                    ${pkg.features ? pkg.features.split(',').map(f => `<li><i class="fas fa-check-circle"></i> ${f.trim()}</li>`).join('') : ''}
                </ul>
                <a href="https://wa.me/6285216315002?text=Saya%20tertarik%20paket%20${encodeURIComponent(pkg.name)}"
                    class="btn ${isPopular ? 'btn-primary' : 'btn-outline'}" style="width: 100%; text-align: center;">Pilih Paket</a>
            </div>
            `;
        }).join('');

        // Re-trigger scroll reveal if needed, or simply let CSS handle it if already observed
        // Observer in main.js handles .scroll-reveal newly added?
        // The observer is set on DOMContentLoaded. Dynamic elements need re-observation.
        // We can manually trigger valid animation state or re-observe.
        // Simple fix: add 'active' class immediately to avoid complexity or re-run observer
        setTimeout(() => {
            document.querySelectorAll('#pricing-container .scroll-reveal').forEach(el => el.classList.add('active'));
        }, 100);

    } catch (error) {
        console.error('Gagal memuat pricing:', error);
        pricingContainer.innerHTML = '<div style="width:100%; text-align:center; grid-column: 1/-1;">Gagal memuat harga. Refresh halaman.</div>';
    }
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
