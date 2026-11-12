/**
 * VIP BARBERS CLUB - Interactividad y Experiencia de Usuario
 * Medellín, Colombia · Av. Nutibara
 * Soporte Dinámico para Panel de Administración
 */

document.addEventListener('DOMContentLoaded', () => {
    // 0. Sincronización Dinámica con el Panel de Administración (localStorage)
    applyAdminSiteData();

    // 1. Navegación Móvil
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const navItems = document.querySelectorAll('.nav-link');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isOpen);
        });

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // 2. Navbar Scrolled State & Active Spy
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section[id]');

    function handleScroll() {
        if (!navbar) return;
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link spy
        const scrollY = window.pageYOffset;
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120;
            const sectionId = current.getAttribute('id');
            const correspondingLink = document.querySelector(`.nav-links a[href*="${sectionId}"]`);

            if (correspondingLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    correspondingLink.classList.add('active');
                } else {
                    correspondingLink.classList.remove('active');
                }
            }
        });
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // 3. Banner de Cookies / Privacidad
    const cookieBanner = document.getElementById('cookieBanner');
    const cookieAccept = document.getElementById('cookieAccept');
    const cookieDetails = document.getElementById('cookieDetails');

    const cookiesAccepted = localStorage.getItem('vipbarbers_cookies_accepted');
    if (!cookiesAccepted && cookieBanner) {
        setTimeout(() => {
            cookieBanner.classList.add('visible');
        }, 1200);
    }

    if (cookieAccept) {
        cookieAccept.addEventListener('click', () => {
            localStorage.setItem('vipbarbers_cookies_accepted', 'true');
            if (cookieBanner) cookieBanner.classList.remove('visible');
        });
    }

    if (cookieDetails) {
        cookieDetails.addEventListener('click', () => {
            openModal('modal-privacidad');
        });
    }

    // 4. Gestión de Modales (Privacidad y Términos)
    const modalLinks = document.querySelectorAll('.modal-link');
    const closeTriggers = document.querySelectorAll('.modal-close-trigger');

    function openModal(modalId) {
        const targetModal = document.getElementById(modalId);
        if (targetModal) {
            targetModal.classList.add('active');
            targetModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeAllModals() {
        const activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(m => {
            m.classList.remove('active');
            m.setAttribute('aria-hidden', 'true');
        });
        document.body.style.overflow = '';
    }

    modalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-modal');
            if (targetId) {
                openModal(targetId);
            }
        });
    });

    closeTriggers.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // 5. Asignación de Eventos para Botones de Reserva
    bindBookingButtons();

    // 6. Formulario de Agendamiento Interactivo
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('bookNombre').value.trim();
            const phone = document.getElementById('bookTelefono').value.trim();
            const service = document.getElementById('bookServicio').value;
            const date = document.getElementById('bookFecha').value;
            const time = document.getElementById('bookHora').value;
            const notes = document.getElementById('bookNotas').value.trim();
            const policyCheck = document.getElementById('policyCheck');

            if (!name || !phone) {
                alert('Por favor indica tu nombre y teléfono móvil.');
                return;
            }

            if (policyCheck && !policyCheck.checked) {
                alert('Debes aceptar la Política de Privacidad para continuar.');
                return;
            }

            // Obtener el número oficial configurado en el panel o el por defecto
            let targetPhone = '573043059911';
            const savedData = localStorage.getItem('vipbarbers_site_data');
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    if (parsed.business && parsed.business.phone) {
                        const cleanPhone = parsed.business.phone.replace(/\D/g, '');
                        targetPhone = cleanPhone.startsWith('57') ? cleanPhone : '57' + cleanPhone;
                    }
                } catch(e) {}
            }

            let waMessage = `💈 *NUEVA SOLICITUD DE CITA - VIP BARBERS CLUB*\n\n`;
            waMessage += `👤 *Cliente:* ${name}\n`;
            waMessage += `📱 *Teléfono:* ${phone}\n`;
            waMessage += `✂️ *Servicio solicitado:* ${service}\n`;
            if (date) waMessage += `📅 *Fecha sugerida:* ${date}\n`;
            if (time) waMessage += `⏰ *Hora preferida:* ${time}\n`;
            if (notes) waMessage += `📝 *Observaciones:* ${notes}\n`;
            waMessage += `\n_Enviado desde el portal vipbarbersclub.space_`;

            const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(waMessage)}`;
            window.open(waUrl, '_blank', 'noopener,noreferrer');

            const submitBtn = bookingForm.querySelector('.btn-form-submit');
            const originalHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Redirigiendo a WhatsApp...';
            setTimeout(() => {
                submitBtn.innerHTML = originalHtml;
                bookingForm.reset();
            }, 3000);
        });
    }
});

// Enlazar eventos de reserva a los botones de servicio
function bindBookingButtons() {
    const quickBookingBtns = document.querySelectorAll('.btn-book-service');
    quickBookingBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const serviceName = btn.getAttribute('data-service') || 'un servicio exclusivo';
            let targetPhone = '573043059911';
            const savedData = localStorage.getItem('vipbarbers_site_data');
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    if (parsed.business && parsed.business.phone) {
                        const cleanPhone = parsed.business.phone.replace(/\D/g, '');
                        targetPhone = cleanPhone.startsWith('57') ? cleanPhone : '57' + cleanPhone;
                    }
                } catch(e) {}
            }
            const msg = `¡Hola VIP Barbers Club! 💈 Deseo agendar una cita para *${serviceName}*. ¿Qué horarios tienen disponibles?`;
            const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
            window.open(waUrl, '_blank', 'noopener,noreferrer');
        });
    });
}

// 7. APLICAR DATOS GUARDADOS DESDE EL PANEL DE ADMINISTRACIÓN
function applyAdminSiteData() {
    const raw = localStorage.getItem('vipbarbers_site_data');
    if (!raw) return;

    try {
        const data = JSON.parse(raw);

        // a) Servicios Dinámicos
        if (Array.isArray(data.services) && data.services.length > 0) {
            const servicesGrid = document.querySelector('.services-grid');
            if (servicesGrid) {
                servicesGrid.innerHTML = data.services.map(srv => `
                    <div class="service-card">
                        ${srv.badge ? `<span class="service-badge">${srv.badge}</span>` : ''}
                        <div class="service-icon"><i class="fa-solid ${srv.icon || 'fa-scissors'}"></i></div>
                        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.5rem;">
                            <h4 style="margin:0;">${srv.title}</h4>
                            ${srv.price ? `<span style="color:#D4AF37; font-weight:800; font-size:1.1rem;">${srv.price}</span>` : ''}
                        </div>
                        <p class="service-desc">${srv.desc}</p>
                        ${Array.isArray(srv.perks) && srv.perks.length > 0 ? `
                            <ul class="service-perks">
                                ${srv.perks.map(p => `<li><i class="fa-solid fa-check"></i> ${p}</li>`).join('')}
                            </ul>
                        ` : ''}
                        <button class="service-cta-btn btn-book-service" data-service="${srv.title} (${srv.price || 'Tarifa VIP'})">
                            <i class="fa-brands fa-whatsapp"></i> Reservar Servicio
                        </button>
                    </div>
                `).join('');
                bindBookingButtons();
            }

            // Actualizar opciones del select del formulario de contacto
            const bookSelect = document.getElementById('bookServicio');
            if (bookSelect) {
                bookSelect.innerHTML = data.services.map(s => 
                    `<option value="${s.title} ${s.price ? '(' + s.price + ')' : ''}">${s.title} ${s.price ? '— ' + s.price : ''}</option>`
                ).join('') + `<option value="Otro Servicio Personalizado">Otro Servicio Personalizado</option>`;
            }
        }

        // b) Galería Dinámica (Imágenes y Videos)
        if (Array.isArray(data.gallery) && data.gallery.length > 0) {
            const galleryGrid = document.querySelector('.gallery-grid');
            if (galleryGrid) {
                galleryGrid.innerHTML = data.gallery.map(item => {
                    const isVideo = item.type === 'video';
                    if (isVideo) {
                        return `
                            <div class="gallery-item">
                                <video src="${item.src}" controls preload="metadata" style="width:100%; height:100%; object-fit:cover;"></video>
                                <div class="gallery-caption" style="pointer-events:none;">
                                    <h4>${item.title || 'Video VIP Barbers'}</h4>
                                    <p>${item.subtitle || 'Experiencia en movimiento'}</p>
                                </div>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="gallery-item">
                                <img src="${item.src}" alt="${item.title || 'Galería VIP Barbers Club'}" loading="lazy">
                                <div class="gallery-caption">
                                    <h4>${item.title || 'El Estilo Que Marca La Diferencia'}</h4>
                                    <p>${item.subtitle || 'Cortes con actitud · Av. Nutibara'}</p>
                                </div>
                            </div>
                        `;
                    }
                }).join('');
            }
        }

        // c) Textos del Hero
        if (data.hero) {
            const heroTag = document.querySelector('.hero-tag');
            if (heroTag && data.hero.tag) {
                heroTag.innerHTML = `<i class="fa-solid fa-gem"></i> ${data.hero.tag}`;
            }

            const heroQuote = document.querySelector('.hero-subtitle-quote');
            if (heroQuote && data.hero.quote) {
                heroQuote.textContent = data.hero.quote;
            }

            const heroDesc = document.querySelector('.hero-description');
            if (heroDesc && data.hero.description) {
                heroDesc.innerHTML = data.hero.description;
            }

            // Fondo del Hero (imagen o video)
            const heroBgContainer = document.querySelector('.hero-bg-container');
            if (heroBgContainer && data.hero.bgMedia) {
                if (data.hero.bgMediaType === 'video') {
                    heroBgContainer.innerHTML = `
                        <video autoplay muted loop playsinline class="hero-bg-img" style="object-fit:cover; width:100%; height:100%;">
                            <source src="${data.hero.bgMedia}" type="video/mp4">
                        </video>
                        <div class="hero-overlay"></div>
                    `;
                } else {
                    const heroImg = heroBgContainer.querySelector('.hero-bg-img');
                    if (heroImg) {
                        heroImg.src = data.hero.bgMedia;
                    }
                }
            }
        }

        // d) Información de Contacto y Redes
        if (data.business) {
            // Teléfono y WhatsApp
            if (data.business.phone) {
                const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
                phoneLinks.forEach(link => {
                    link.href = `tel:${data.business.phone}`;
                    link.textContent = data.business.phone;
                });
            }

            // Correo
            if (data.business.email) {
                const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
                emailLinks.forEach(link => {
                    link.href = `mailto:${data.business.email}`;
                    link.textContent = data.business.email;
                });
            }

            // Dirección
            if (data.business.address) {
                const addressEl = document.querySelector('.contact-card-item span');
                if (addressEl) {
                    addressEl.textContent = data.business.address;
                }
            }
        }

        // Redes Sociales
        if (data.socials) {
            if (data.socials.instagram) {
                document.querySelectorAll('a[href*="instagram.com"]').forEach(a => a.href = data.socials.instagram);
            }
            if (data.socials.facebook) {
                document.querySelectorAll('a[href*="facebook.com"]').forEach(a => a.href = data.socials.facebook);
            }
            if (data.socials.whatsapp) {
                document.querySelectorAll('.floating-whatsapp').forEach(a => a.href = data.socials.whatsapp);
            }
        }
    } catch (e) {
        console.error('Error aplicando datos dinámicos:', e);
    }
}
