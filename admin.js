/**
 * VIP BARBERS CLUB - Lógica del Panel de Administración (Seguridad Reforzada)
 * Medellín, Colombia · Av. Nutibara
 */

// 1. Prevención Anti-Clickjacking (Frame Buster)
if (window.top !== window.self) {
    window.top.location = window.self.location;
}

const STORAGE_KEY = 'vipbarbers_site_data';
const EMAIL_HASH_KEY = 'vipbarbers_admin_emailhash';
const PASS_HASH_KEY = 'vipbarbers_admin_passhash';

// HASHES CRIPTOGRÁFICOS UNIDIRECCIONALES (SHA-256)
// Las credenciales NUNCA están expuestas en texto plano en el repositorio.
// Hash SHA-256 del correo administrativo autorizado
const DEFAULT_EMAIL_HASH = '6fadbda381fbf3b94a33da2379227d5a8c13da4e5a797364b5387adafcfd2fd7';
// Hash SHA-256 de la contraseña configurada
const DEFAULT_PASS_HASH = 'd4ac8475751fe9d33b81c8d90e339cc330531908cee560b8d1dd809f3805840f';

const ATTEMPTS_KEY = 'vipbarbers_login_attempts';
const LOCKOUT_KEY = 'vipbarbers_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos de inactividad

// Función de Hash Criptográfico SHA-256 nativo
async function computeSHA256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Sanitización contra inyección de código (XSS)
function sanitizeText(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>]/g, tag => ({ '<': '&lt;', '>': '&gt;' }[tag] || tag));
}

// Sanitización de URLs contra inyección de protocolos maliciosos (javascript:, data:)
function sanitizeUrl(url) {
    if (typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('#')) return trimmed;
    if (/^(https?:\/\/|tel:|mailto:)/i.test(trimmed)) return trimmed;
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) return 'https://' + trimmed;
    return '#contacto';
}

// Datos predeterminados de la barbería
const DEFAULT_BANNER_PRESETS = [
    { id: 'b1', name: 'Interior Barbershop', desc: 'Sillones & estilo clásico', src: 'hero-vip-barbershop.jpg', type: 'image' },
    { id: 'b2', name: 'Técnica de Precisión', desc: 'Navaja & barbero pro', src: 'corte-precision-barbero.jpg', type: 'image' },
    { id: 'b3', name: 'Ritual Vapor Ozono', desc: 'Spa facial masculino', src: 'vapor-ozono-ritual.jpg', type: 'image' },
    { id: 'b4', name: 'Lavado & Masaje', desc: 'Relax & descanso capilar', src: 'lavado-masaje-capilar.jpg', type: 'image' },
    { id: 'b5', name: 'Corte Fade VIP', desc: 'Perfilado magistral', src: 'trabajo-corte-precision.jpg', type: 'image' }
];

const DEFAULT_SITE_DATA = {
    business: {
        name: "Vip Barbers Club",
        brandTitle: "VIP BARBERS",
        brandSubtitle: "CLUB · MEDELLÍN",
        nit: "1152218409-9",
        phone: "3043059911",
        phoneFormatted: "+57 304 305 9911",
        email: "servicioalcliente@vipbarbersclub.space",
        website: "vipbarbersclub.space",
        address: "Transversal 39B #72-101 segundo piso Av nutibara",
        city: "MEDELLÍN, ANTIOQUIA, COLOMBIA",
        postalCode: "050031",
        hoursWeek: "Lun - Sáb: 9:00 a.m. - 8:00 p.m. (Jornada Continua)",
        hoursWeekend: "Domingos y Festivos: 10:00 a.m. a 4:00 p.m. (Bajo reserva previa)"
    },
    hero: {
        tag: "Cuidado Masculino Premium · Av. Nutibara",
        title: "VIP BARBERS CLUB",
        accentText: "Más que un corte, una experiencia",
        quote: "«En VIP BARBERS CLUB llevamos la barbería a otro nivel, combinando técnica profesional, asesoría de imagen personalizada y atención a cada detalle.»",
        description: "Encontramos el estilo que mejor se adapta a tu rostro, cabello y personalidad, mientras disfrutas de una experiencia integral de bienestar que incluye vapor de ozono, lavado capilar y masaje descontracturante. Porque sabemos que verte bien no es un lujo, es parte de quién eres.",
        bgMedia: "hero-vip-barbershop.jpg",
        bgMediaType: "image",
        overlayOpacity: 88,
        banners: DEFAULT_BANNER_PRESETS
    },
    theme: "gold-classic",
    socials: {
        instagram: "https://www.instagram.com/vipbarbersclub?dlrf=MWNwbzd5czJ4cXJ2bg==",
        facebook: "https://www.facebook.com/share/18VDVCjF9Z/?mibextid=wwXIfr",
        whatsapp: "https://wa.me/573043059911"
    },
    buttons: {
        navReserveText: "Reservar Cita",
        navReserveUrl: "#contacto",
        heroPrimaryText: "Agendar Mi Cita VIP",
        heroPrimaryUrl: "#contacto",
        heroSecondaryText: "Ver Catálogo de Servicios",
        heroSecondaryUrl: "#servicios",
        whatsappFloatUrl: "https://wa.me/573043059911?text=Hola%20VIP%20Barbers%20Club,%20deseo%20agendar%20una%20cita%20exclusiva...",
        ritualReserveUrl: "#contacto",
        servicesReserveUrl: "",
        mapsDirectionUrl: "https://www.google.com/maps/dir/?api=1&destination=Transversal+39B+%2372-101%2C+Av+Nutibara%2C+Medellin%2C+Antioquia"
    },
    services: [
        {
            id: 1,
            badge: "Firma VIP",
            icon: "fa-scissors",
            title: "Corte VIP & Asesoría",
            desc: "Estudio visagista facial, corte de cabello adaptado a tu rostro con tijera y máquina, lavado capilar tonificante, peinado y productos de fijación premium.",
            price: "$35.000",
            perks: ["Asesoría morfológica de rostro", "Lavado con champú vigorizante", "Peinado con pomada o cera mate"]
        },
        {
            id: 2,
            badge: "Popular",
            icon: "fa-user-tie",
            title: "Perfilado & Spa de Barba",
            desc: "Diseño geométrico de barba, aplicación de vapor de ozono purificante, toalla caliente emoliente, afeitado a navaja y masaje con óleo hidratante.",
            price: "$30.000",
            perks: ["Vapor de ozono antibacterial", "Delimitación milimétrica a navaja", "Aceite y bálsamo de barba VIP"]
        },
        {
            id: 3,
            badge: "Experiencia Total",
            icon: "fa-crown",
            title: "Experiencia Completa VIP",
            desc: "El paquete definitivo: Asesoría de imagen, corte magistral, diseño de barba con vapor de ozono, lavado capilar y masaje craneofacial relajante.",
            price: "$60.000",
            perks: ["Corte + Barba + Vapor de Ozono", "Lavado capilar & Masaje sensorial", "Bebida de cortesía en el bar"]
        },
        {
            id: 4,
            badge: "Precisión",
            icon: "fa-star",
            title: "Cortes Infantiles & Juveniles",
            desc: "Cortes modernos con estilo, paciencia y técnica especializada para niños y jóvenes que buscan lucir las últimas tendencias con total comodidad.",
            price: "$28.000",
            perks: ["Diseños urbanos y desvanecidos", "Trato cercano, profesional y seguro", "Acabado nítido con estilizado"]
        }
    ],
    gallery: [
        {
            id: 1,
            type: "image",
            src: "trabajo-corte-precision.jpg",
            title: "El Estilo Que Marca La Diferencia",
            subtitle: "Cortes con precisión y actitud · Av. Nutibara"
        },
        {
            id: 2,
            type: "image",
            src: "trabajo-corte-infantil.jpg",
            title: "Cortes Premium Para Los Más Exigentes",
            subtitle: "Técnica profesional para todas las edades"
        },
        {
            id: 3,
            type: "image",
            src: "corte-precision-barbero.jpg",
            title: "Técnica de Desvanecido Impecable",
            subtitle: "Herramientas de precisión milimétrica"
        },
        {
            id: 4,
            type: "image",
            src: "hero-vip-barbershop.jpg",
            title: "Santuario de Grooming Masculino",
            subtitle: "Instalaciones exclusivas pensadas para tu confort"
        },
        {
            id: 5,
            type: "image",
            src: "vapor-ozono-ritual.jpg",
            title: "Ritual de Purificación con Vapor",
            subtitle: "Cuidado de la piel sin irritación"
        },
        {
            id: 6,
            type: "image",
            src: "lavado-masaje-capilar.jpg",
            title: "Masaje Craneal & Lavado",
            subtitle: "Desconexión y bienestar en cada visita"
        }
    ]
};

// Estado global de la aplicación
let siteData = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    loadSiteData();
    initNavigationTabs();
    initThemesController();
    initBannerController();
    populateAllForms();
    renderServicesList();
    renderGalleryList();
    initMediaUploadHandlers();
    initBackupHandlers();
    initSessionTimeoutTracker();
});

// 2. Autenticación con Protección Contra Fuerza Bruta y Hashing SHA-256
function initAuth() {
    const loginScreen = document.getElementById('loginScreen');
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const togglePassBtn = document.getElementById('togglePasswordVisibility');
    const loginError = document.getElementById('loginError');
    const loginErrorMsg = document.getElementById('loginErrorMsg');
    const loginLockout = document.getElementById('loginLockout');
    const btnLogout = document.getElementById('btnLogout');

    // Botón para alternar visibilidad de la contraseña
    if (togglePassBtn && loginPassword) {
        togglePassBtn.addEventListener('click', () => {
            const isPass = loginPassword.type === 'password';
            loginPassword.type = isPass ? 'text' : 'password';
            togglePassBtn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
        });
    }

    // Auto-migración en caso de hash residual de la versión inicial
    if (localStorage.getItem(PASS_HASH_KEY) === 'daf3f58a971974790a943e8bbf216ada8ba72062e4eeee5540e15fa5a6d1076e') {
        localStorage.setItem(PASS_HASH_KEY, DEFAULT_PASS_HASH);
    }
    if (!localStorage.getItem(EMAIL_HASH_KEY)) {
        localStorage.setItem(EMAIL_HASH_KEY, DEFAULT_EMAIL_HASH);
    }

    // Verificar si está en período de bloqueo
    function checkLockout() {
        const lockUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0');
        const now = Date.now();
        if (lockUntil > now) {
            const minutesLeft = Math.ceil((lockUntil - now) / 60000);
            if (loginLockout) {
                loginLockout.innerHTML = `<i class="fa-solid fa-shield-halved"></i> <strong>Acceso bloqueado por seguridad:</strong> Demasiados intentos fallidos. Intenta nuevamente en ${minutesLeft} minuto(s).`;
                loginLockout.style.display = 'block';
            }
            if (loginForm) {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = true;
            }
            return true;
        } else {
            if (loginLockout) loginLockout.style.display = 'none';
            if (loginForm) {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = false;
            }
            return false;
        }
    }

    checkLockout();

    // Comprobar sesión activa y no expirada
    const isLogged = sessionStorage.getItem('vipbarbers_admin_logged');
    const loginTime = parseInt(sessionStorage.getItem('vipbarbers_login_time') || '0');
    if (isLogged === 'true' && (Date.now() - loginTime) < SESSION_TIMEOUT_MS) {
        if (loginScreen) loginScreen.style.display = 'none';
        sessionStorage.setItem('vipbarbers_login_time', Date.now().toString());
    } else {
        sessionStorage.removeItem('vipbarbers_admin_logged');
        sessionStorage.removeItem('vipbarbers_admin_user');
        sessionStorage.removeItem('vipbarbers_login_time');
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (checkLockout()) return;

            const inputEmail = sanitizeText((loginEmail ? loginEmail.value : '').trim().toLowerCase());
            const inputPass = loginPassword ? loginPassword.value : '';

            const inputEmailHash = await computeSHA256(inputEmail);
            const inputPassHash = await computeSHA256(inputPass);

            const storedEmailHash = localStorage.getItem(EMAIL_HASH_KEY) || DEFAULT_EMAIL_HASH;
            const storedPassHash = localStorage.getItem(PASS_HASH_KEY) || DEFAULT_PASS_HASH;

            if (inputEmailHash === storedEmailHash && inputPassHash === storedPassHash) {
                // Éxito: limpiar intentos
                localStorage.removeItem(ATTEMPTS_KEY);
                localStorage.removeItem(LOCKOUT_KEY);
                sessionStorage.setItem('vipbarbers_admin_logged', 'true');
                sessionStorage.setItem('vipbarbers_admin_user', inputEmail);
                sessionStorage.setItem('vipbarbers_login_time', Date.now().toString());
                loginScreen.style.display = 'none';
                if (loginError) loginError.style.display = 'none';
                if (loginPassword) loginPassword.value = '';
                showToast('¡Sesión iniciada con éxito!');
            } else {
                // Fallo: registrar intento fallido
                let attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0') + 1;
                localStorage.setItem(ATTEMPTS_KEY, attempts.toString());

                if (attempts >= MAX_ATTEMPTS) {
                    const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
                    localStorage.setItem(LOCKOUT_KEY, lockUntil.toString());
                    checkLockout();
                } else {
                    const left = MAX_ATTEMPTS - attempts;
                    if (loginErrorMsg) {
                        loginErrorMsg.textContent = `Correo o contraseña incorrectos. Te quedan ${left} intento(s) antes del bloqueo temporal.`;
                    }
                    if (loginError) loginError.style.display = 'block';
                }
                if (loginPassword) {
                    loginPassword.value = '';
                    loginPassword.focus();
                }
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('vipbarbers_admin_logged');
            sessionStorage.removeItem('vipbarbers_admin_user');
            sessionStorage.removeItem('vipbarbers_login_time');
            location.reload();
        });
    }
}

// Control de expiración por inactividad (30 minutos)
function initSessionTimeoutTracker() {
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
        window.addEventListener(evt, () => {
            if (sessionStorage.getItem('vipbarbers_admin_logged') === 'true') {
                sessionStorage.setItem('vipbarbers_login_time', Date.now().toString());
            }
        }, { passive: true });
    });
}

// 3. Carga y Guardado de Datos
function loadSiteData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            siteData = JSON.parse(saved);
            if (siteData && siteData.business && siteData.business.postalCode === '050010') {
                siteData.business.postalCode = '050031';
                localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
            }
            if (!siteData.buttons) {
                siteData.buttons = JSON.parse(JSON.stringify(DEFAULT_SITE_DATA.buttons));
            }
            if (!siteData.theme) {
                siteData.theme = 'gold-classic';
            }
            if (!siteData.hero) siteData.hero = {};
            if (siteData.hero.overlayOpacity === undefined) {
                siteData.hero.overlayOpacity = 88;
            }
            if (!Array.isArray(siteData.hero.banners) || siteData.hero.banners.length === 0) {
                siteData.hero.banners = JSON.parse(JSON.stringify(DEFAULT_BANNER_PRESETS));
            }
        } catch (e) {
            console.error('Error parseando datos:', e);
            siteData = JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
        }
    } else {
        siteData = JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
        saveSiteData(false);
    }
}

function saveSiteData(showNotification = true) {
    if (showNotification && sessionStorage.getItem('vipbarbers_admin_logged') !== 'true') {
        alert('Acceso no autorizado. Inicia sesión con tus credenciales.');
        location.reload();
        return;
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
        if (showNotification) {
            showToast('¡Cambios guardados con éxito en la página!');
        }
    } catch (e) {
        console.error('Error guardando:', e);
        alert('Atención: El archivo de imagen o video es demasiado grande para el almacenamiento local. Te sugerimos usar imágenes optimizadas o URLs de video.');
    }
}

// 4. Navegación por Pestañas
function initNavigationTabs() {
    const menuButtons = document.querySelectorAll('.sidebar-menu .menu-item button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const tabTitleHeader = document.getElementById('currentTabTitle');

    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            document.querySelectorAll('.sidebar-menu .menu-item').forEach(li => li.classList.remove('active'));
            btn.parentElement.classList.add('active');

            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === targetTab) {
                    pane.classList.add('active');
                }
            });

            if (tabTitleHeader) {
                tabTitleHeader.textContent = btn.innerText.trim();
            }
        });
    });

    const btnSaveTop = document.getElementById('btnSaveAll');
    if (btnSaveTop) {
        btnSaveTop.addEventListener('click', () => {
            gatherFormData();
            saveSiteData(true);
        });
    }
}

// 5. Poblar Formularios con los datos actuales
function populateAllForms() {
    if (!siteData) return;

    setVal('bizName', siteData.business.name);
    setVal('bizNit', siteData.business.nit);
    setVal('bizPhone', siteData.business.phone);
    setVal('bizEmail', siteData.business.email);
    setVal('bizAddress', siteData.business.address);
    setVal('bizCity', siteData.business.city);
    setVal('bizPostal', siteData.business.postalCode);
    setVal('bizHoursWeek', siteData.business.hoursWeek);
    setVal('bizHoursWeekend', siteData.business.hoursWeekend);

    setVal('socInstagram', siteData.socials.instagram);
    setVal('socFacebook', siteData.socials.facebook);
    setVal('socWhatsapp', siteData.socials.whatsapp);

    setVal('heroTag', siteData.hero.tag);
    setVal('heroTitle', siteData.hero.title);
    setVal('heroAccent', siteData.hero.accentText);
    setVal('heroQuote', siteData.hero.quote);
    setVal('heroDesc', siteData.hero.description);
    setVal('heroBgMedia', siteData.hero.bgMedia);
    setVal('heroBgType', siteData.hero.bgMediaType || 'image');
    const opacity = siteData.hero.overlayOpacity !== undefined ? siteData.hero.overlayOpacity : 88;
    setVal('heroOverlayOpacity', opacity);
    const opacityLabel = document.getElementById('overlayOpacityVal');
    if (opacityLabel) opacityLabel.textContent = opacity + '%';

    // Seleccionar tema activo en el panel
    if (siteData.theme) {
        document.documentElement.setAttribute('data-theme', siteData.theme);
        updateActiveThemeCard(siteData.theme);
    }

    // Renderizar galería de banners dinámicos y activar seleccionado
    renderPresetBanners();
    updateActivePresetBanner(siteData.hero.bgMedia);

    // Actualizar previsualización en vivo
    updateHeroLivePreview();

    if (siteData.buttons) {
        setVal('btnNavReserveText', siteData.buttons.navReserveText || 'Reservar Cita');
        setVal('btnNavReserveUrl', siteData.buttons.navReserveUrl || '#contacto');
        setVal('btnHeroPrimaryText', siteData.buttons.heroPrimaryText || 'Agendar Mi Cita VIP');
        setVal('btnHeroPrimaryUrl', siteData.buttons.heroPrimaryUrl || '#contacto');
        setVal('btnHeroSecondaryText', siteData.buttons.heroSecondaryText || 'Ver Catálogo de Servicios');
        setVal('btnHeroSecondaryUrl', siteData.buttons.heroSecondaryUrl || '#servicios');
        setVal('btnWhatsappFloatUrl', siteData.buttons.whatsappFloatUrl || 'https://wa.me/573043059911?text=Hola%20VIP%20Barbers%20Club,%20deseo%20agendar%20una%20cita%20exclusiva...');
        setVal('btnRitualReserveUrl', siteData.buttons.ritualReserveUrl || '#contacto');
        setVal('btnServicesReserveUrl', siteData.buttons.servicesReserveUrl || '');
        setVal('btnMapsDirectionUrl', siteData.buttons.mapsDirectionUrl || 'https://www.google.com/maps/dir/?api=1&destination=Transversal+39B+%2372-101%2C+Av+Nutibara%2C+Medellin%2C+Antioquia');
    }
}

function setVal(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined) {
        el.value = value;
    }
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function gatherFormData() {
    siteData.business.name = sanitizeText(getVal('bizName'));
    siteData.business.nit = sanitizeText(getVal('bizNit'));
    siteData.business.phone = sanitizeText(getVal('bizPhone'));
    siteData.business.email = sanitizeText(getVal('bizEmail'));
    siteData.business.address = sanitizeText(getVal('bizAddress'));
    siteData.business.city = sanitizeText(getVal('bizCity'));
    siteData.business.postalCode = sanitizeText(getVal('bizPostal'));
    siteData.business.hoursWeek = sanitizeText(getVal('bizHoursWeek'));
    siteData.business.hoursWeekend = sanitizeText(getVal('bizHoursWeekend'));

    siteData.socials.instagram = getVal('socInstagram');
    siteData.socials.facebook = getVal('socFacebook');
    siteData.socials.whatsapp = getVal('socWhatsapp');

    siteData.hero.tag = sanitizeText(getVal('heroTag'));
    siteData.hero.title = sanitizeText(getVal('heroTitle'));
    siteData.hero.accentText = sanitizeText(getVal('heroAccent'));
    siteData.hero.quote = sanitizeText(getVal('heroQuote'));
    siteData.hero.description = sanitizeText(getVal('heroDesc'));
    siteData.hero.bgMedia = getVal('heroBgMedia');
    siteData.hero.bgMediaType = getVal('heroBgType');
    siteData.hero.overlayOpacity = parseInt(getVal('heroOverlayOpacity') || '88');
    siteData.hero.banners = (siteData.hero && Array.isArray(siteData.hero.banners)) ? siteData.hero.banners : JSON.parse(JSON.stringify(DEFAULT_BANNER_PRESETS));
    siteData.theme = siteData.theme || 'gold-classic';

    if (!siteData.buttons) siteData.buttons = {};
    siteData.buttons.navReserveText = sanitizeText(getVal('btnNavReserveText')) || 'Reservar Cita';
    siteData.buttons.navReserveUrl = sanitizeUrl(getVal('btnNavReserveUrl')) || '#contacto';
    siteData.buttons.heroPrimaryText = sanitizeText(getVal('btnHeroPrimaryText')) || 'Agendar Mi Cita VIP';
    siteData.buttons.heroPrimaryUrl = sanitizeUrl(getVal('btnHeroPrimaryUrl')) || '#contacto';
    siteData.buttons.heroSecondaryText = sanitizeText(getVal('btnHeroSecondaryText')) || 'Ver Catálogo de Servicios';
    siteData.buttons.heroSecondaryUrl = sanitizeUrl(getVal('btnHeroSecondaryUrl')) || '#servicios';
    siteData.buttons.whatsappFloatUrl = sanitizeUrl(getVal('btnWhatsappFloatUrl')) || 'https://wa.me/573043059911?text=Hola%20VIP%20Barbers%20Club,%20deseo%20agendar%20una%20cita%20exclusiva...';
    siteData.buttons.ritualReserveUrl = sanitizeUrl(getVal('btnRitualReserveUrl')) || '#contacto';
    siteData.buttons.servicesReserveUrl = getVal('btnServicesReserveUrl') ? sanitizeUrl(getVal('btnServicesReserveUrl')) : '';
    siteData.buttons.mapsDirectionUrl = sanitizeUrl(getVal('btnMapsDirectionUrl')) || 'https://www.google.com/maps/dir/?api=1&destination=Transversal+39B+%2372-101%2C+Av+Nutibara%2C+Medellin%2C+Antioquia';
}

// 6. Gestión de Servicios
function renderServicesList() {
    const container = document.getElementById('servicesListContainer');
    if (!container) return;

    container.innerHTML = '';
    siteData.services.forEach(srv => {
        const card = document.createElement('div');
        card.className = 'admin-item-card';
        card.innerHTML = `
            <div class="item-card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="background: rgba(212,175,55,0.15); color: #F4D068; padding: 0.2rem 0.65rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 700;">
                        ${srv.badge || 'Servicio'}
                    </span>
                    <strong style="color: #D4AF37; font-size: 1.1rem;">${srv.price || ''}</strong>
                </div>
                <h4 class="item-card-title">${srv.title}</h4>
                <p class="item-card-desc">${srv.desc}</p>
                <div style="font-size: 0.78rem; color: #888; margin-bottom: 1rem;">
                    ${srv.perks ? srv.perks.map(p => `<div>• ${p}</div>`).join('') : ''}
                </div>
                <div class="item-card-footer">
                    <button class="btn-admin btn-admin-outline btn-admin-sm" onclick="editService(${srv.id})">
                        <i class="fa-solid fa-pen"></i> Editar
                    </button>
                    <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteService(${srv.id})">
                        <i class="fa-solid fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

const serviceModal = document.getElementById('serviceModal');
const serviceForm = document.getElementById('serviceForm');

window.openNewServiceModal = function() {
    document.getElementById('serviceModalTitle').textContent = 'Agregar Nuevo Servicio';
    document.getElementById('serviceEditId').value = '';
    serviceForm.reset();
    serviceModal.classList.add('active');
};

window.closeServiceModal = function() {
    serviceModal.classList.remove('active');
};

window.editService = function(id) {
    const srv = siteData.services.find(s => s.id === id);
    if (!srv) return;

    document.getElementById('serviceModalTitle').textContent = 'Editar Servicio';
    document.getElementById('serviceEditId').value = srv.id;
    document.getElementById('srvTitle').value = srv.title;
    document.getElementById('srvBadge').value = srv.badge || '';
    document.getElementById('srvPrice').value = srv.price || '';
    document.getElementById('srvDesc').value = srv.desc;
    document.getElementById('srvPerks').value = srv.perks ? srv.perks.join('\n') : '';

    serviceModal.classList.add('active');
};

window.deleteService = function(id) {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
        siteData.services = siteData.services.filter(s => s.id !== id);
        saveSiteData(true);
        renderServicesList();
    }
};

if (serviceForm) {
    serviceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('serviceEditId').value;
        const title = sanitizeText(document.getElementById('srvTitle').value.trim());
        const badge = sanitizeText(document.getElementById('srvBadge').value.trim());
        const price = sanitizeText(document.getElementById('srvPrice').value.trim());
        const desc = sanitizeText(document.getElementById('srvDesc').value.trim());
        const perks = document.getElementById('srvPerks').value.split('\n').map(p => sanitizeText(p.trim())).filter(Boolean);

        if (editId) {
            const srv = siteData.services.find(s => s.id === parseInt(editId));
            if (srv) {
                srv.title = title;
                srv.badge = badge;
                srv.price = price;
                srv.desc = desc;
                srv.perks = perks;
            }
        } else {
            const newId = Date.now();
            siteData.services.push({
                id: newId,
                title,
                badge,
                price,
                desc,
                perks,
                icon: "fa-scissors"
            });
        }

        saveSiteData(true);
        renderServicesList();
        closeServiceModal();
    });
}

// 7. Gestión de Medios (Galería de Imágenes & Videos)
function renderGalleryList() {
    const container = document.getElementById('galleryListContainer');
    if (!container) return;

    container.innerHTML = '';
    siteData.gallery.forEach(item => {
        const card = document.createElement('div');
        card.className = 'admin-item-card';

        const isVideo = item.type === 'video';
        let mediaHtml = '';
        if (isVideo) {
            mediaHtml = `
                <div class="item-thumb-container">
                    <span class="item-type-badge"><i class="fa-solid fa-video"></i> Video</span>
                    <video src="${item.src}" controls preload="metadata"></video>
                </div>
            `;
        } else {
            mediaHtml = `
                <div class="item-thumb-container">
                    <span class="item-type-badge"><i class="fa-solid fa-image"></i> Imagen</span>
                    <img src="${item.src}" alt="${item.title}" loading="lazy">
                </div>
            `;
        }

        card.innerHTML = `
            ${mediaHtml}
            <div class="item-card-body">
                <h4 class="item-card-title">${item.title || 'Elemento Multimedia'}</h4>
                <p class="item-card-desc">${item.subtitle || ''}</p>
                <div class="item-card-footer">
                    <span style="font-size: 0.75rem; color: #777;">ID: ${item.id}</span>
                    <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteGalleryItem(${item.id})">
                        <i class="fa-solid fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

window.deleteGalleryItem = function(id) {
    if (confirm('¿Deseas eliminar este elemento de la galería?')) {
        siteData.gallery = siteData.gallery.filter(g => g.id !== id);
        saveSiteData(true);
        renderGalleryList();
    }
};

function initMediaUploadHandlers() {
    const fileInput = document.getElementById('mediaFileInput');
    const dropzone = document.getElementById('mediaDropzone');
    const btnAddUrlMedia = document.getElementById('btnAddUrlMedia');

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleUploadedFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                handleUploadedFile(fileInput.files[0]);
            }
        });
    }

    if (btnAddUrlMedia) {
        btnAddUrlMedia.addEventListener('click', () => {
            const url = prompt('Ingresa la URL o nombre del archivo (ej. video.mp4 o https://...):');
            if (!url) return;
            const title = sanitizeText(prompt('Título para la galería:') || 'Nuevo Elemento');
            const subtitle = sanitizeText(prompt('Subtítulo o descripción:') || 'Cortes con precisión y actitud');
            const isVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video');

            siteData.gallery.unshift({
                id: Date.now(),
                type: isVideo ? 'video' : 'image',
                src: url,
                title,
                subtitle
            });

            saveSiteData(true);
            renderGalleryList();
        });
    }
}

function handleUploadedFile(file) {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
        alert('Por favor selecciona un archivo de imagen (JPG, PNG, WebP) o video (MP4, WebM).');
        return;
    }

    if (file.size > 4 * 1024 * 1024) {
        const proceed = confirm('El archivo pesa más de 4MB. ¿Deseas cargarlo de todas formas?');
        if (!proceed) return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const resultBase64 = e.target.result;
        const title = sanitizeText(prompt('Título para este nuevo elemento:', file.name.replace(/\.[^/.]+$/, '')) || 'Nuevo Estilo VIP');
        const subtitle = sanitizeText(prompt('Subtítulo o descripción:') || 'Cortes con actitud · Av. Nutibara');

        siteData.gallery.unshift({
            id: Date.now(),
            type: isVideo ? 'video' : 'image',
            src: resultBase64,
            title,
            subtitle
        });

        saveSiteData(true);
        renderGalleryList();
    };

    reader.readAsDataURL(file);
}

// 8. Respaldo, Restauración y Cambio Seguro de Clave con SHA-256
function initBackupHandlers() {
    const btnExport = document.getElementById('btnExportJson');
    const btnImport = document.getElementById('btnImportJson');
    const importInput = document.getElementById('importJsonFile');
    const btnResetDefaults = document.getElementById('btnResetDefaults');
    const formPass = document.getElementById('formChangePass');

    if (btnExport) {
        btnExport.addEventListener('click', () => {
            gatherFormData();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(siteData, null, 2));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute("href", dataStr);
            dlAnchor.setAttribute("download", `vip_barbers_config_${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(dlAnchor);
            dlAnchor.click();
            dlAnchor.remove();
            showToast('Archivo de respaldo JSON generado.');
        });
    }

    if (btnImport && importInput) {
        btnImport.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', () => {
            if (importInput.files.length > 0) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const parsed = JSON.parse(e.target.result);
                        if (parsed.business && parsed.services) {
                            siteData = parsed;
                            saveSiteData(true);
                            populateAllForms();
                            renderServicesList();
                            renderGalleryList();
                            alert('¡Configuración importada exitosamente!');
                        } else {
                            alert('El archivo no contiene un formato de configuración válido.');
                        }
                    } catch (err) {
                        alert('Error al leer el archivo JSON.');
                    }
                };
                reader.readAsText(importInput.files[0]);
            }
        });
    }

    if (btnResetDefaults) {
        btnResetDefaults.addEventListener('click', () => {
            if (confirm('¿Seguro que deseas restaurar todos los textos, servicios e imágenes a sus valores iniciales?')) {
                siteData = JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
                saveSiteData(true);
                populateAllForms();
                renderServicesList();
                renderGalleryList();
                showToast('Valores de fábrica restablecidos.');
            }
        });
    }

    // Cambio Seguro de Credenciales (Validando Hash SHA-256)
    if (formPass) {
        formPass.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('emailNuevo');
            const current = document.getElementById('passActual').value;
            const newPass = document.getElementById('passNueva').value;
            const confirmPass = document.getElementById('passConfirm').value;

            const currentHash = await computeSHA256(current);
            const storedHash = localStorage.getItem(PASS_HASH_KEY) || DEFAULT_PASS_HASH;

            if (currentHash !== storedHash) {
                alert('La contraseña actual es incorrecta.');
                return;
            }

            let msg = '';
            // Si proporcionó nuevo correo
            if (emailInput && emailInput.value.trim()) {
                const newEmail = sanitizeText(emailInput.value.trim().toLowerCase());
                const newEmailHash = await computeSHA256(newEmail);
                localStorage.setItem(EMAIL_HASH_KEY, newEmailHash);
                msg = 'Correo actualizado.';
            }

            // Si proporcionó nueva contraseña
            if (newPass) {
                if (newPass.length < 6) {
                    alert('Por seguridad, la nueva contraseña debe tener al menos 6 caracteres.');
                    return;
                }
                if (newPass !== confirmPass) {
                    alert('Las contraseñas no coinciden.');
                    return;
                }
                const newHash = await computeSHA256(newPass);
                localStorage.setItem(PASS_HASH_KEY, newHash);
                msg += (msg ? ' Y contraseña' : 'Contraseña') + ' actualizada de forma segura (cifrada con SHA-256).';
            }

            formPass.reset();
            showToast(msg || 'Credenciales validadas con éxito.');
        });
    }
}

// Notificación Toast
function showToast(message) {
    let toast = document.getElementById('adminToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'adminToast';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${message}</span>`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// ==========================================================================
// 8. CONTROLADOR DE TEMAS DE MARCA (NEGRO & ORO)
// ==========================================================================
function updateActiveThemeCard(activeThemeId) {
    const cards = document.querySelectorAll('.theme-card');
    cards.forEach(card => {
        const themeId = card.getAttribute('data-theme-id');
        const btn = card.querySelector('.btn-theme-select');
        if (themeId === activeThemeId) {
            card.classList.add('active');
            if (btn) {
                btn.className = 'btn-admin btn-admin-gold btn-theme-select';
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Tema Activo';
            }
        } else {
            card.classList.remove('active');
            if (btn) {
                btn.className = 'btn-admin btn-admin-outline btn-theme-select';
                btn.innerHTML = 'Activar Este Tema';
            }
        }
    });
}

function initThemesController() {
    const cards = document.querySelectorAll('.theme-card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            const themeId = card.getAttribute('data-theme-id');
            if (!themeId) return;

            siteData.theme = themeId;
            document.documentElement.setAttribute('data-theme', themeId);
            updateActiveThemeCard(themeId);
            showToast('Tema visual previsualizado: ' + themeId);
        });
    });
}

// ==========================================================================
// 9. CONTROLADOR DEL BANNER PRINCIPAL DE PORTADA & LIVE PREVIEW (ELIMINAR Y AGREGAR A PLACER)
// ==========================================================================
function renderPresetBanners() {
    const grid = document.getElementById('presetBannersGrid');
    if (!grid) return;

    if (!siteData.hero) siteData.hero = {};
    if (!Array.isArray(siteData.hero.banners)) {
        siteData.hero.banners = JSON.parse(JSON.stringify(DEFAULT_BANNER_PRESETS));
    }

    const currentMedia = getVal('heroBgMedia') || siteData.hero.bgMedia || '';

    if (siteData.hero.banners.length === 0) {
        grid.innerHTML = `
            <div class="preset-banners-empty">
                <i class="fa-regular fa-images"></i>
                <p style="margin: 0 0 0.5rem; font-weight: 600; color: #ccc;">No hay fotos en la galería de portada</p>
                <p style="margin: 0; font-size: 0.8rem; color: #777;">Sube una foto personalizada o haz clic en "Restaurar Fotos Prediseñadas".</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = siteData.hero.banners.map((b) => {
        const isActive = (b.src === currentMedia);
        return `
            <div class="preset-banner-card ${isActive ? 'active' : ''}" data-id="${b.id}" data-src="${b.src}" data-type="${b.type || 'image'}">
                <span class="preset-banner-active-badge"><i class="fa-solid fa-check"></i> Activo</span>
                <button type="button" class="btn-delete-banner-card" title="Eliminar foto del banner" data-delete-id="${b.id}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
                <img src="${b.src}" alt="${b.name}">
                <div class="preset-banner-info">
                    <strong>${b.name}</strong>
                    <span>${b.desc || ''}</span>
                </div>
            </div>
        `;
    }).join('');

    // Eventos de selección de tarjeta
    grid.querySelectorAll('.preset-banner-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete-banner-card')) return;
            const src = card.getAttribute('data-src');
            const type = card.getAttribute('data-type') || 'image';
            setVal('heroBgMedia', src);
            setVal('heroBgType', type);
            if (siteData.hero) {
                siteData.hero.bgMedia = src;
                siteData.hero.bgMediaType = type;
            }
            updateActivePresetBanner(src);
            updateHeroLivePreview();
            showToast('Banner seleccionado: ' + (card.querySelector('strong') ? card.querySelector('strong').textContent : ''));
        });
    });

    // Eventos de eliminación directa de cada foto
    grid.querySelectorAll('.btn-delete-banner-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const idToDelete = btn.getAttribute('data-delete-id');
            deleteBannerCard(idToDelete);
        });
    });
}

function deleteBannerCard(id) {
    if (!siteData.hero || !Array.isArray(siteData.hero.banners)) return;

    const bannerToDelete = siteData.hero.banners.find(b => b.id === id);
    const bannerName = bannerToDelete ? bannerToDelete.name : 'esta foto';

    if (!confirm(`¿Estás seguro de que deseas eliminar la foto "${bannerName}" de los banners de portada?`)) {
        return;
    }

    const currentMedia = getVal('heroBgMedia') || (siteData.hero ? siteData.hero.bgMedia : '');
    const wasActive = bannerToDelete && (bannerToDelete.src === currentMedia);

    siteData.hero.banners = siteData.hero.banners.filter(b => b.id !== id);

    if (wasActive) {
        if (siteData.hero.banners.length > 0) {
            const nextBanner = siteData.hero.banners[0];
            setVal('heroBgMedia', nextBanner.src);
            setVal('heroBgType', nextBanner.type || 'image');
            siteData.hero.bgMedia = nextBanner.src;
            siteData.hero.bgMediaType = nextBanner.type || 'image';
        } else {
            setVal('heroBgMedia', '');
            siteData.hero.bgMedia = '';
        }
        updateHeroLivePreview();
    }

    // Guardar inmediatamente y refrescar
    saveSiteData(false);
    renderPresetBanners();
    showToast(`Foto eliminada: "${bannerName}"`);
}

function updateActivePresetBanner(currentSrc) {
    const cards = document.querySelectorAll('.preset-banner-card');
    cards.forEach(card => {
        if (card.getAttribute('data-src') === currentSrc) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

function updateHeroLivePreview() {
    const prevTag = document.getElementById('prevHeroTag');
    const prevTitle = document.getElementById('prevHeroTitle');
    const prevQuote = document.getElementById('prevHeroQuote');
    const prevDesc = document.getElementById('prevHeroDesc');
    const previewLayer = document.getElementById('heroPreviewBgLayer');
    const previewOverlay = document.getElementById('heroPreviewOverlay');
    const opacityInput = document.getElementById('heroOverlayOpacity');

    const tagVal = getVal('heroTag') || (siteData && siteData.hero ? siteData.hero.tag : 'Cuidado Masculino Premium');
    const titleVal = getVal('heroTitle') || (siteData && siteData.hero ? siteData.hero.title : 'VIP BARBERS CLUB');
    const quoteVal = getVal('heroQuote') || (siteData && siteData.hero ? siteData.hero.quote : '«Más que un corte, una experiencia»');
    const descVal = getVal('heroDesc') || (siteData && siteData.hero ? siteData.hero.description : 'Encontramos el estilo que mejor se adapta a tu rostro...');
    const bgMediaVal = getVal('heroBgMedia') || (siteData && siteData.hero ? siteData.hero.bgMedia : '');
    const bgTypeVal = getVal('heroBgType') || 'image';
    const opacityVal = opacityInput ? parseInt(opacityInput.value || '88') : 88;

    if (prevTag) prevTag.innerHTML = `<i class="fa-solid fa-gem"></i> ${tagVal}`;
    if (prevTitle) prevTitle.textContent = titleVal;
    if (prevQuote) prevQuote.textContent = quoteVal;
    if (prevDesc) prevDesc.textContent = descVal;

    // Actualizar fondo de previsualización
    if (previewLayer) {
        if (!bgMediaVal) {
            previewLayer.innerHTML = `
                <div style="width:100%; height:100%; background: linear-gradient(135deg, #161616 0%, #242424 50%, #161616 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#888; gap:0.5rem;">
                    <i class="fa-regular fa-image" style="font-size:2rem; color:#666;"></i>
                    <span style="font-size:0.85rem;">Sin imagen de fondo activa</span>
                </div>
                <div class="hero-preview-overlay" id="heroPreviewOverlay"></div>
            `;
        } else if (bgTypeVal === 'video') {
            previewLayer.innerHTML = `
                <video autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover;">
                    <source src="${bgMediaVal}" type="video/mp4">
                </video>
                <div class="hero-preview-overlay" id="heroPreviewOverlay"></div>
            `;
        } else {
            previewLayer.innerHTML = `
                <img src="${bgMediaVal}" id="heroPreviewImg" alt="Fondo Portada" style="width:100%; height:100%; object-fit:cover; object-position:center 30%;">
                <div class="hero-preview-overlay" id="heroPreviewOverlay"></div>
            `;
        }
    }

    const updatedOverlay = document.getElementById('heroPreviewOverlay');
    if (updatedOverlay) {
        const opacDec = (opacityVal / 100).toFixed(2);
        const opacMid = Math.max(0.1, opacDec - 0.12).toFixed(2);
        updatedOverlay.style.background = `linear-gradient(135deg, rgba(10, 10, 10, ${opacDec}) 0%, rgba(17, 17, 17, ${opacMid}) 50%, rgba(10, 10, 10, ${opacDec}) 100%)`;
    }
}

function initBannerController() {
    // 1. Renderizar galería de banners dinámicos
    renderPresetBanners();

    // 2. Botón restaurar fotos oficiales prediseñadas
    const btnResetBanners = document.getElementById('btnResetBanners');
    if (btnResetBanners) {
        btnResetBanners.addEventListener('click', () => {
            if (!confirm('¿Deseas restaurar la lista oficial de fotos prediseñadas del banner?')) return;
            if (!siteData.hero) siteData.hero = {};
            siteData.hero.banners = JSON.parse(JSON.stringify(DEFAULT_BANNER_PRESETS));
            saveSiteData(false);
            renderPresetBanners();
            showToast('Fotos oficiales del banner restauradas');
        });
    }

    // 3. Botón quitar fondo actual
    const btnClearHeroBg = document.getElementById('btnClearHeroBg');
    if (btnClearHeroBg) {
        btnClearHeroBg.addEventListener('click', () => {
            if (!confirm('¿Deseas quitar la imagen de fondo actual del banner?')) return;
            setVal('heroBgMedia', '');
            if (siteData.hero) siteData.hero.bgMedia = '';
            updateActivePresetBanner('');
            updateHeroLivePreview();
            saveSiteData(false);
            showToast('Fondo de portada quitado');
        });
    }

    // 4. Subida de imagen propia con compresión y agregado automático a la galería
    const fileInput = document.getElementById('heroBgFileInput');
    const fileNameSpan = document.getElementById('heroFileName');

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (fileNameSpan) fileNameSpan.textContent = file.name;

            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxW = 1280;

                    if (width > maxW) {
                        height = Math.round((height * maxW) / width);
                        width = maxW;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.78);
                    setVal('heroBgMedia', optimizedDataUrl);
                    setVal('heroBgType', 'image');

                    if (!siteData.hero) siteData.hero = {};
                    if (!Array.isArray(siteData.hero.banners)) {
                        siteData.hero.banners = JSON.parse(JSON.stringify(DEFAULT_BANNER_PRESETS));
                    }

                    const shortName = file.name.length > 18 ? file.name.substring(0, 15) + '...' : file.name;
                    const newBanner = {
                        id: 'banner_' + Date.now(),
                        name: 'Foto Subida (' + shortName + ')',
                        desc: 'Subida desde tu dispositivo',
                        src: optimizedDataUrl,
                        type: 'image'
                    };
                    siteData.hero.banners.unshift(newBanner);
                    siteData.hero.bgMedia = optimizedDataUrl;
                    siteData.hero.bgMediaType = 'image';

                    saveSiteData(false);
                    renderPresetBanners();
                    updateHeroLivePreview();
                    showToast('¡Foto cargada y agregada a tu galería de banners!');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // 5. Slider de opacidad
    const opacitySlider = document.getElementById('heroOverlayOpacity');
    const opacityVal = document.getElementById('overlayOpacityVal');
    if (opacitySlider) {
        opacitySlider.addEventListener('input', (e) => {
            if (opacityVal) opacityVal.textContent = e.target.value + '%';
            updateHeroLivePreview();
        });
    }

    // 6. Inputs en tiempo real
    ['heroTag', 'heroTitle', 'heroAccent', 'heroQuote', 'heroDesc', 'heroBgMedia', 'heroBgType'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                if (id === 'heroBgMedia') {
                    updateActivePresetBanner(el.value);
                }
                updateHeroLivePreview();
            });
        }
    });
}
