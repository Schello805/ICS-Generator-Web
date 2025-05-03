// Test Kommentar
/**
 * Komponenten-System für ICS Tools
 * Lädt Header und Footer dynamisch in alle Seiten
 * 
 * Verwendung:
 * 1. HTML-Struktur:
 *    <div id="header"></div>
 *    <div id="footer"></div>
 * 
 * 2. Skript einbinden:
 *    <script src="js/components.js"></script>
 * 
 * 3. Automatische Initialisierung beim DOMContentLoaded
 */

// Komponenten-Initialisierung

// Konfigurationsobjekt für die Navigation
const NAV_CONFIG = {
    'index.html': { id: 'nav-home', label: 'Startseite' },
    'generator.html': { id: 'nav-generator', label: 'Generator' },
    'validator.html': { id: 'nav-validator', label: 'Validator' }
};

// Fehlerbehandlung für fehlende Komponenten
function handleComponentError(componentName, error) {
    console.error(`Error loading ${componentName}:`, error);
    return `<div class="alert alert-danger" role="alert">
        Fehler beim Laden der ${componentName}-Komponente. 
        Bitte laden Sie die Seite neu.
    </div>`;
}

// Komponenten laden mit Fehlerbehandlung
async function loadComponent(elementId, path) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`[ICS Tools] Element with id "${elementId}" not found in DOM!`);
        return;
    }

    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`[ICS Tools] HTTP error! status: ${response.status} for ${path}`);
        }
        const html = await response.text();
        element.innerHTML = html;

        // Spezielle Behandlung für Header
        if (elementId === 'header') {
            setActiveNavItem();
            // Logo aktualisieren
            const logo = document.querySelector('.navbar-brand img');
            if (logo) {
                logo.src = 'Logo ICS Generator.png';
                logo.alt = 'ICS Generator Logo';
            }
        }
        console.info(`[ICS Tools] Komponente ${elementId} erfolgreich geladen.`);
    } catch (error) {
        element.innerHTML = handleComponentError(elementId, error);
        console.error(`[ICS Tools] Fehler beim Laden der Komponente ${elementId}:`, error);
    }
}

// Aktiven Navigationspunkt setzen
function setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navConfig = NAV_CONFIG[currentPage];

    if (navConfig) {
        const navItem = document.getElementById(navConfig.id);
        if (navItem) {
            navItem.classList.add('active');
            // Für Screenreader
            const link = navItem.querySelector('a');
            if (link) {
                link.setAttribute('aria-current', 'page');
                link.setAttribute('aria-label', `${navConfig.label} (aktuelle Seite)`);
            }
        }
    }
}

// Modal-Initialisierung nachladen, falls vorhanden
function tryInitICSImportModal() {
    if (typeof initializeICSImportModal === 'function') {
        initializeICSImportModal();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Lade Header
    loadComponent('header', 'components/header.html');
    // Lade Footer
    loadComponent('footer', 'components/footer.html');

    // Nach dem Nachladen des Headers das Modal initialisieren!
    window.waitForElement('#icsImportModal').then(() => {
        tryInitICSImportModal();
        // Workaround: Menüpunkt immer korrekt initialisieren, auch wenn Modal noch nicht im DOM ist
        const navBtn = document.getElementById('nav-import-ics');
        if (navBtn) {
            navBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // Suche das <a>-Element im Menüpunkt
                const link = navBtn.querySelector('a');
                if (document.getElementById('icsImportModal')) {
                    // Modal existiert, öffne es
                    link && link.setAttribute('data-toggle', 'modal');
                    link && link.setAttribute('data-target', '#icsImportModal');
                    link && link.click();
                } else {
                    window.location.href = 'generator.html#icsImport';
                }
            });
        }
    });
});

// Funktion zum Warten auf ein Element
window.waitForElement = function(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
};

try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            loadComponent,
            setActiveNavItem,
            handleComponentError
        };
    }
} catch (e) {
    // Ignorieren im Browser-Kontext
}
