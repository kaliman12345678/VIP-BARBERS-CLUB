/**
 * VIP BARBERS CLUB - Lógica del Panel de Administración (Seguridad Reforzada)
 * Medellín, Colombia · Av. Nutibara
 */

// 1. Prevención Anti-Clickjacking (Frame Buster)
if (window.top !== window.self) {
    window.top.location = window.self.location;
}

const STORAGE_KEY = 'vipbarbers_site_data';
const PASS_HASH_KEY = 'vipbarbers_admin_passhash';
// Hash SHA-256 de 'vip2026'
const DEFAULT_PASS_HASH = 'daf3f58a971974790a943e8bbf216ada8ba72062e4eeee5540e15fa5a6d1076e';

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

// Datos predeterminados de la barbería
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
        postalCode: "050010",
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
        bgMediaType: "image"
    },
    socials: {
        instagram: "https://www.instagram.com/vipbarbersclub?dlrf=MWNwbzd5czJ4cXJ2bg==",
        facebook: "https://www.facebook.com/share/18VDVCjF9Z/?mibextid=wwXIfr",
        whatsapp: "https://wa.me/573043059911"
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
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    const loginErrorMsg = document.getElementById('loginErrorMsg');
    const loginLockout = document.getElementById('loginLockout');
    const btnLogout = document.getElementById('btnLogout');

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
        sessionStorage.removeItem('vipbarbers_login_time');
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (checkLockout()) return;

            const inputPass = loginPassword.value;
            const inputHash = await computeSHA256(inputPass);
            const storedHash = localStorage.getItem(PASS_HASH_KEY) || DEFAULT_PASS_HASH;

            if (inputHash === storedHash) {
                // Éxito: limpiar intentos
                localStorage.removeItem(ATTEMPTS_KEY);
                localStorage.removeItem(LOCKOUT_KEY);
                sessionStorage.setItem('vipbarbers_admin_logged', 'true');
                sessionStorage.setItem('vipbarbers_login_time', Date.now().toString());
                loginScreen.style.display = 'none';
                if (loginError) loginError.style.display = 'none';
                loginPassword.value = '';
                showToast('¡Sesión iniciada con éxito!');
            } else {
                // Fallo: registrar intento
                let attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0') + 1;
                localStorage.setItem(ATTEMPTS_KEY, attempts.toString());

                if (attempts >= MAX_ATTEMPTS) {
                    const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
                    localStorage.setItem(LOCKOUT_KEY, lockUntil.toString());
                    checkLockout();
                } else {
                    const left = MAX_ATTEMPTS - attempts;
                    if (loginErrorMsg) {
                        loginErrorMsg.textContent = `Contraseña incorrecta. Te quedan ${left} intento(s) antes del bloqueo temporal.`;
                    }
                    if (loginError) loginError.style.display = 'block';
                }
                loginPassword.value = '';
                loginPassword.focus();
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('vipbarbers_admin_logged');
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

    // Cambio Seguro de Contraseña (Validando Hash SHA-256)
    if (formPass) {
        formPass.addEventListener('submit', async (e) => {
            e.preventDefault();
            const current = document.getElementById('passActual').value;
            const newPass = document.getElementById('passNueva').value;
            const confirmPass = document.getElementById('passConfirm').value;

            const currentHash = await computeSHA256(current);
            const storedHash = localStorage.getItem(PASS_HASH_KEY) || DEFAULT_PASS_HASH;

            if (currentHash !== storedHash) {
                alert('La contraseña actual es incorrecta.');
                return;
            }

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
            formPass.reset();
            showToast('¡Contraseña actualizada de forma segura (cifrada con SHA-256)!');
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
