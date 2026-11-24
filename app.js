/**
 * VIP BARBERS CLUB - Interactividad y Experiencia de Usuario
 * Medellín, Colombia · Av. Nutibara
 * Soporte Dinámico para Panel de Administración
 */

document.addEventListener('DOMContentLoaded', () => {
    // 0. Sincronización Dinámica con el Panel de Administración (localStorage)
    applyAdminSiteData();

    // Acceso Discreto y Seguro al Panel Administrativo
    // Método 1: Atajo de teclado (Ctrl + Shift + A o Cmd + Shift + A)
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            e.preventDefault();
            window.location.href = 'admin.html';
        }
    });

    // Método 2: 5 clics rápidos consecutivos en el ícono de la corona del logo
    const brandIcon = document.querySelector('.brand-icon');
    if (brandIcon) {
        let clickCount = 0;
        let clickTimer = null;
        brandIcon.addEventListener('click', (e) => {
            clickCount++;
            clearTimeout(clickTimer);
            if (clickCount >= 5) {
                clickCount = 0;
                window.location.href = 'admin.html';
            } else {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 2000);
            }
        });
    }

    // 1. Navegación Móvil Fluida y Ergonomía Táctil
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        function closeMobileMenu() {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }

        hamburger.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isOpen);
            // Bloquea el scroll de fondo mientras el menú esté abierto en móviles
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Cierra el menú al tocar cualquier enlace dentro del drawer
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });

        // Cierra el menú al tocar fuera del panel en pantalla móvil
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !hamburger.contains(e.target)) {
                closeMobileMenu();
            }
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

        // Tema Oficial de la Marca (Negro & Dorado)
        if (data.theme) {
            document.documentElement.setAttribute('data-theme', data.theme);
        } else {
            document.documentElement.setAttribute('data-theme', 'gold-classic');
        }

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

        // c) Portada & Banner Principal
        if (data.hero) {
            const heroTag = document.querySelector('.hero-tag');
            if (heroTag && data.hero.tag) {
                heroTag.innerHTML = `<i class="fa-solid fa-gem"></i> ${data.hero.tag}`;
            }

            const heroTitleEl = document.querySelector('.hero-title');
            if (heroTitleEl && data.hero.title) {
                if (data.hero.accentText) {
                    heroTitleEl.innerHTML = `${data.hero.title} <span class="text-gold">${data.hero.accentText}</span>`;
                } else {
                    heroTitleEl.textContent = data.hero.title;
                }
            }

            const heroQuote = document.querySelector('.hero-subtitle-quote');
            if (heroQuote && data.hero.quote) {
                heroQuote.textContent = data.hero.quote;
            }

            const heroDesc = document.querySelector('.hero-description');
            if (heroDesc && data.hero.description) {
                heroDesc.innerHTML = data.hero.description;
            }

            // Opacidad del filtro de contraste de la portada
            if (data.hero.overlayOpacity !== undefined) {
                const opacVal = (data.hero.overlayOpacity / 100).toFixed(2);
                document.documentElement.style.setProperty('--hero-overlay-opacity', opacVal);
            }

            // Fondo del Hero (imagen o video, con soporte para borrado a placer)
            const heroBgContainer = document.querySelector('.hero-bg-container');
            if (heroBgContainer) {
                if (!data.hero.bgMedia) {
                    heroBgContainer.innerHTML = `
                        <div class="hero-bg-img" style="background: linear-gradient(135deg, #0b0b0b 0%, #171717 50%, #0b0b0b 100%); width:100%; height:100%;"></div>
                        <div class="hero-overlay"></div>
                    `;
                } else if (data.hero.bgMediaType === 'video') {
                    heroBgContainer.innerHTML = `
                        <video autoplay muted loop playsinline class="hero-bg-img" style="object-fit:cover; width:100%; height:100%;">
                            <source src="${data.hero.bgMedia}" type="video/mp4">
                        </video>
                        <div class="hero-overlay"></div>
                    `;
                } else {
                    const heroImg = heroBgContainer.querySelector('.hero-bg-img');
                    if (heroImg && heroImg.tagName && heroImg.tagName.toLowerCase() === 'img') {
                        heroImg.src = data.hero.bgMedia;
                    } else {
                        heroBgContainer.innerHTML = `
                            <img src="${data.hero.bgMedia}" alt="VIP Barbers Club Fondo" class="hero-bg-img">
                            <div class="hero-overlay"></div>
                        `;
                    }
                }
            }
        }

        // d) Información Institucional y Ficha Legal Oficial (Edición y eliminación a placer)
        if (data.business) {
            // Razón Social: Si el dueño la quitó (está vacía), se oculta la tarjeta por completo
            if (data.business.name !== undefined) {
                const bName = data.business.name.trim();
                document.querySelectorAll('[data-legal="biz-name"]').forEach(el => {
                    el.textContent = bName;
                    const item = el.closest('.legal-item');
                    if (item) {
                        item.style.display = bName ? '' : 'none';
                    }
                });
            }

            // NIT: Si el dueño lo quitó, se oculta la tarjeta y el enlace
            if (data.business.nit !== undefined) {
                const bNit = data.business.nit.trim();
                document.querySelectorAll('[data-legal="biz-nit"]').forEach(el => {
                    el.textContent = bNit;
                    const item = el.closest('.legal-item');
                    if (item) {
                        item.style.display = bNit ? '' : 'none';
                    }
                });
                document.querySelectorAll('[data-footer="link-nit"]').forEach(el => {
                    if (bNit) {
                        el.style.display = '';
                        const span = el.querySelector('span');
                        if (span) span.textContent = `NIT: ${bNit}`;
                    } else {
                        el.style.display = 'none';
                    }
                });
            }

            // Régimen tributario
            if (data.footer && data.footer.legalRegime !== undefined) {
                const regimeText = data.footer.legalRegime.trim();
                document.querySelectorAll('[data-legal="biz-regime"]').forEach(el => {
                    el.textContent = regimeText;
                    el.style.display = regimeText ? '' : 'none';
                });
            }

            // Domicilio Principal
            if (data.business.city !== undefined) {
                const bCity = data.business.city.trim();
                document.querySelectorAll('[data-legal="biz-city"]').forEach(el => {
                    el.textContent = bCity;
                    const item = el.closest('.legal-item');
                    if (item) item.style.display = bCity ? '' : 'none';
                });
            }

            // Dirección del Establecimiento
            if (data.business.address !== undefined) {
                const bAddr = data.business.address.trim();
                document.querySelectorAll('[data-legal="biz-address"]').forEach(el => {
                    el.textContent = bAddr;
                    const item = el.closest('.legal-item');
                    if (item) item.style.display = bAddr ? '' : 'none';
                });
                const addressEl = document.querySelector('.contact-card-item span');
                if (addressEl) {
                    addressEl.textContent = bAddr;
                }
            }

            // Código Postal
            if (data.business.postalCode !== undefined) {
                const bPostal = data.business.postalCode.trim();
                document.querySelectorAll('.postal-code-val, [data-legal="biz-postal"]').forEach(el => {
                    el.textContent = bPostal;
                    const item = el.closest('.legal-item');
                    if (item) item.style.display = bPostal ? '' : 'none';
                });
            }

            // Teléfono
            if (data.business.phone !== undefined) {
                const bPhone = data.business.phone.trim();
                document.querySelectorAll('[data-legal="biz-phone"]').forEach(link => {
                    link.textContent = bPhone;
                    link.href = bPhone ? `tel:${bPhone}` : '#';
                    const item = link.closest('.legal-item');
                    if (item) item.style.display = bPhone ? '' : 'none';
                });
                if (bPhone) {
                    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
                        link.href = `tel:${bPhone}`;
                        link.textContent = bPhone;
                    });
                }
            }

            // Correo
            if (data.business.email !== undefined) {
                const bEmail = data.business.email.trim();
                document.querySelectorAll('[data-legal="biz-email"]').forEach(link => {
                    link.textContent = bEmail;
                    link.href = bEmail ? `mailto:${bEmail}` : '#';
                    const item = link.closest('.legal-item');
                    if (item) item.style.display = bEmail ? '' : 'none';
                });
                if (bEmail) {
                    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
                        link.href = `mailto:${bEmail}`;
                        link.textContent = bEmail;
                    });
                }
            }

            // Dominio / Web
            if (data.business.website !== undefined) {
                const bWeb = data.business.website.trim();
                document.querySelectorAll('[data-legal="biz-website"]').forEach(el => {
                    el.textContent = bWeb;
                    const item = el.closest('.legal-item');
                    if (item) item.style.display = bWeb ? '' : 'none';
                });
            }
        }

        // e) Pie de Página (Footer) Completo (Edición y eliminación a placer)
        if (data.footer || data.business) {
            // Descripción de Marca en el Footer: Si está vacía se oculta
            if (data.footer && data.footer.description !== undefined) {
                const fDesc = data.footer.description.trim();
                document.querySelectorAll('[data-footer="brand-desc"]').forEach(p => {
                    p.textContent = fDesc;
                    p.style.display = fDesc ? '' : 'none';
                });
            }

            // Insignia Legal del Footer: Si se borra o la razón social no existe, se oculta
            if (data.footer && data.footer.badge !== undefined) {
                const fBadge = data.footer.badge.trim();
                document.querySelectorAll('[data-footer="legal-badge"]').forEach(b => {
                    if (fBadge) {
                        b.innerHTML = `<i class="fa-solid fa-stamp"></i> ${fBadge}`;
                        b.style.display = '';
                    } else {
                        b.innerHTML = '';
                        b.style.display = 'none';
                    }
                });
            } else if (data.business && data.business.name !== undefined) {
                const bName = data.business.name.trim();
                const bNit = (data.business.nit || '').trim();
                document.querySelectorAll('[data-footer="legal-badge"]').forEach(b => {
                    if (!bName && !bNit) {
                        b.innerHTML = '';
                        b.style.display = 'none';
                    } else if (bName && bNit) {
                        b.innerHTML = `<i class="fa-solid fa-stamp"></i> Razón Social: ${bName} · NIT: ${bNit}`;
                        b.style.display = '';
                    } else if (bName) {
                        b.innerHTML = `<i class="fa-solid fa-stamp"></i> Razón Social: ${bName}`;
                        b.style.display = '';
                    } else {
                        b.innerHTML = `<i class="fa-solid fa-stamp"></i> NIT: ${bNit}`;
                        b.style.display = '';
                    }
                });
            }

            // Contacto del Footer (Dirección, Teléfono, Correo, Web)
            if (data.business) {
                const fullAddressText = `${data.business.address || ''}${data.business.city ? ', ' + data.business.city : ''}${data.business.postalCode ? ' (C.P. ' + data.business.postalCode + ')' : ''}`;
                document.querySelectorAll('[data-footer="contact-address"]').forEach(el => {
                    el.textContent = fullAddressText;
                    const li = el.closest('li');
                    if (li) li.style.display = fullAddressText.trim() ? '' : 'none';
                });

                if (data.business.phone !== undefined) {
                    const bPhone = data.business.phone.trim();
                    document.querySelectorAll('[data-footer="contact-phone"]').forEach(a => {
                        a.textContent = bPhone;
                        a.href = bPhone ? `tel:${bPhone}` : '#';
                        const li = a.closest('li');
                        if (li) li.style.display = bPhone ? '' : 'none';
                    });
                }
                if (data.business.email !== undefined) {
                    const bEmail = data.business.email.trim();
                    document.querySelectorAll('[data-footer="contact-email"]').forEach(a => {
                        a.textContent = bEmail;
                        a.href = bEmail ? `mailto:${bEmail}` : '#';
                        const li = a.closest('li');
                        if (li) li.style.display = bEmail ? '' : 'none';
                    });
                }
                if (data.business.website !== undefined) {
                    const bWeb = data.business.website.trim();
                    document.querySelectorAll('[data-footer="contact-website"]').forEach(span => {
                        span.textContent = bWeb;
                        const li = span.closest('li');
                        if (li) li.style.display = bWeb ? '' : 'none';
                    });
                }
            }

            // Leyenda de Derechos Reservados / Copyright en la barra inferior
            if (data.footer && data.footer.copyright !== undefined) {
                const fCopy = data.footer.copyright.trim();
                document.querySelectorAll('[data-footer="copyright-text"]').forEach(el => {
                    el.innerHTML = fCopy;
                    el.style.display = fCopy ? '' : 'none';
                });
            } else if (data.business && data.business.name !== undefined) {
                const bName = data.business.name.trim();
                const bNit = (data.business.nit || '').trim();
                document.querySelectorAll('[data-footer="copyright-text"]').forEach(el => {
                    if (bName || bNit) {
                        el.innerHTML = `&copy; 2026 <strong>${bName}</strong> ${bNit ? '(NIT: ' + bNit + ')' : ''}. Todos los derechos reservados.`;
                        el.style.display = '';
                    } else {
                        el.innerHTML = '&copy; 2026. Todos los derechos reservados.';
                        el.style.display = '';
                    }
                });
            }

            // Enlaces legales del footer
            if (data.footer && data.footer.privacyUrl) {
                document.querySelectorAll('[data-footer="link-privacidad"], [data-footer="bottom-privacidad"]').forEach(a => {
                    a.href = data.footer.privacyUrl;
                });
            }
            if (data.footer && data.footer.termsUrl) {
                document.querySelectorAll('[data-footer="link-terminos"], [data-footer="bottom-terminos"]').forEach(a => {
                    a.href = data.footer.termsUrl;
                });
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

        // e) Direccionamiento y Personalización de Todos los Botones
        if (data.buttons) {
            function sanitizeUrl(url) {
                if (typeof url !== 'string') return '';
                const trimmed = url.trim();
                if (!trimmed) return '';
                if (trimmed.startsWith('#')) return trimmed;
                if (/^(https?:\/\/|tel:|mailto:)/i.test(trimmed)) return trimmed;
                if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) return 'https://' + trimmed;
                return '#contacto';
            }

            function configureButton(elements, url, text) {
                if (!elements) return;
                const list = (elements instanceof NodeList || Array.isArray(elements)) ? elements : [elements];
                list.forEach(btn => {
                    if (!btn) return;
                    if (url) {
                        const safeUrl = sanitizeUrl(url);
                        btn.setAttribute('href', safeUrl);
                        if (safeUrl.startsWith('http://') || safeUrl.startsWith('https://')) {
                            btn.setAttribute('target', '_blank');
                            btn.setAttribute('rel', 'noopener noreferrer');
                        } else {
                            btn.removeAttribute('target');
                            btn.removeAttribute('rel');
                        }
                    }
                    if (text) {
                        const span = btn.querySelector('span');
                        if (span) {
                            span.textContent = text;
                        }
                    }
                });
            }

            // 1. Botón "Reservar Cita" (Navbar & Menú Móvil)
            configureButton(
                document.querySelectorAll('[data-btn-id="nav-reserve"], .btn-nav-reserve, .nav-cta-btn'),
                data.buttons.navReserveUrl,
                data.buttons.navReserveText
            );

            // 2. Botón Principal del Hero ("Agendar Mi Cita VIP")
            configureButton(
                document.querySelectorAll('[data-btn-id="hero-primary"]'),
                data.buttons.heroPrimaryUrl,
                data.buttons.heroPrimaryText
            );

            // 3. Botón Secundario del Hero ("Ver Catálogo")
            configureButton(
                document.querySelectorAll('[data-btn-id="hero-secondary"]'),
                data.buttons.heroSecondaryUrl,
                data.buttons.heroSecondaryText
            );

            // 4. Botón de Rituales ("Reservar Este Ritual" y "Vivir Experiencia")
            if (data.buttons.ritualReserveUrl) {
                configureButton(
                    document.querySelectorAll('[data-btn-id="ritual-reserve"], [data-btn-id="experience-reserve"]'),
                    data.buttons.ritualReserveUrl
                );
            }

            // 5. Botón Flotante de WhatsApp y Enlaces Rápidos (wa.link)
            if (data.buttons.whatsappFloatUrl) {
                document.querySelectorAll('.floating-whatsapp').forEach(a => {
                    a.href = data.buttons.whatsappFloatUrl;
                });
                document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com"], a[href*="wa.link"]').forEach(a => {
                    if (!a.classList.contains('service-cta-btn') && !a.classList.contains('btn-book-service')) {
                        a.href = data.buttons.whatsappFloatUrl;
                    }
                });
            }

            // 6. Botón "¿Cómo llegar? / Ver Mapa" (Google Maps)
            if (data.buttons.mapsDirectionUrl) {
                configureButton(
                    document.querySelectorAll('[data-btn-id="maps-direction"], .maps-direction-btn'),
                    data.buttons.mapsDirectionUrl
                );
                document.querySelectorAll('a[href*="maps.google.com/maps/dir"]').forEach(a => {
                    a.href = data.buttons.mapsDirectionUrl;
                });
            }

            // 7. Botones del Catálogo de Servicios
            if (data.buttons.servicesReserveUrl && (data.buttons.servicesReserveUrl.startsWith('http://') || data.buttons.servicesReserveUrl.startsWith('https://') || data.buttons.servicesReserveUrl.startsWith('#'))) {
                document.querySelectorAll('.service-cta-btn, .btn-book-service').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (data.buttons.servicesReserveUrl.startsWith('#')) {
                            const targetEl = document.querySelector(data.buttons.servicesReserveUrl);
                            if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
                        } else {
                            window.open(data.buttons.servicesReserveUrl, '_blank', 'noopener,noreferrer');
                        }
                    }, { capture: true });
                });
            }
        }
    } catch (e) {
        console.error('Error aplicando datos dinámicos:', e);
    }
}
