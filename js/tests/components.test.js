// Importiere die zu testenden Funktionen
const {
    loadComponent,
    setActiveNavItem,
    handleComponentError
} = require('../components.js');

/**
 * Tests für ICS Tools Komponenten
 */

// Unit Tests für Komponenten-System
describe('Komponenten-System Tests', () => {
    // Test Setup
    beforeEach(() => {
        // DOM für Tests vorbereiten
        document.body.innerHTML = `
            <div id="header"></div>
            <div id="nav-generator"></div>
            <div id="footer"></div>
        `;
        // Mock für fetch zurücksetzen
        fetch.mockClear();
    });

    // Test: Header-Komponente wird geladen
    test('Header wird korrekt geladen', async () => {
        await loadComponent('header', 'components/header.html');
        const header = document.getElementById('header');
        expect(header.innerHTML).toContain('navbar');
    });

    // Test: Footer-Komponente wird geladen
    test('Footer wird korrekt geladen', async () => {
        await loadComponent('footer', 'components/footer.html');
        const footer = document.getElementById('footer');
        expect(footer.innerHTML).toContain('footer');
    });

    // Test: Navigation markiert aktive Seite
    test('Aktive Seite wird korrekt markiert', () => {
        // Aktuelle Seite simulieren
        Object.defineProperty(window, 'location', {
            value: { pathname: '/generator.html' }
        });
        
        setActiveNavItem();
        const activeItem = document.getElementById('nav-generator');
        expect(activeItem.classList.contains('active')).toBe(true);
    });

    // Test: Fehlerbehandlung bei fehlender Komponente
    test('Fehlerbehandlung funktioniert', () => {
        const error = handleComponentError('test', new Error('Test error'));
        expect(error).toContain('alert-danger');
    });

    // Test: Fehlerfall - Element nicht gefunden
    test('Behandelt fehlende DOM-Elemente', async () => {
        const consoleSpy = jest.spyOn(console, 'warn');
        await loadComponent('nicht-vorhanden', 'components/header.html');
        expect(consoleSpy).toHaveBeenCalledWith('Element with id "nicht-vorhanden" not found');
        consoleSpy.mockRestore();
    });

    // Test: Fehlerfall - HTTP Fehler
    test('Behandelt HTTP Fehler', async () => {
        fetch.mockImplementationOnce(() => Promise.resolve({
            ok: false,
            status: 404
        }));
        await loadComponent('header', 'components/header.html');
        const header = document.getElementById('header');
        expect(header.innerHTML).toContain('alert-danger');
    });

    // Test: Navigation - verschiedene Seiten
    test('Setzt Navigation für verschiedene Seiten', () => {
        // Index Seite
        window.location.pathname = '/index.html';
        setActiveNavItem();
        expect(document.getElementById('nav-home')?.classList.contains('active')).toBe(true);

        // Generator Seite
        window.location.pathname = '/generator.html';
        setActiveNavItem();
        expect(document.getElementById('nav-generator')?.classList.contains('active')).toBe(true);
    });

    // Test: DOMContentLoaded Event
    test('Lädt Komponenten beim DOMContentLoaded', () => {
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenCalledWith('components/header.html');
        expect(fetch).toHaveBeenCalledWith('components/footer.html');
    });

    // Test: Navigation - verschiedene Szenarien
    test('Navigation behandelt verschiedene Szenarien korrekt', () => {
        // Setup: DOM mit vollständiger Navigation
        document.body.innerHTML = `
            <div id="nav-home">
                <a href="#">Home</a>
            </div>
            <div id="nav-generator">
                <a href="#">Generator</a>
            </div>
        `;

        // Test 1: Standardseite (index.html)
        window.location.pathname = '/';
        setActiveNavItem();
        expect(document.getElementById('nav-home').querySelector('a').getAttribute('aria-current')).toBe('page');

        // Test 2: Nicht existierende Seite
        window.location.pathname = '/nicht-vorhanden.html';
        setActiveNavItem();
        expect(document.getElementById('nav-home').classList.contains('active')).toBe(false);

        // Test 3: Generator-Seite ohne Link-Element
        document.getElementById('nav-generator').innerHTML = '';
        window.location.pathname = '/generator.html';
        setActiveNavItem();
        expect(document.getElementById('nav-generator').classList.contains('active')).toBe(true);
    });

    // Test: Navigation - komplette Abdeckung
    test('Navigation behandelt alle Szenarien', () => {
        // Setup: Vollständige Navigation mit allen Elementen
        document.body.innerHTML = `
            <div id="nav-home">
                <a href="#">Home</a>
            </div>
            <div id="nav-generator">
                <a href="#">Generator</a>
            </div>
            <div id="nav-validator">
                <a href="#">Validator</a>
            </div>
        `;

        // Test 1: Standardseite
        window.location.pathname = '/index.html';
        setActiveNavItem();
        const homeLink = document.getElementById('nav-home').querySelector('a');
        expect(homeLink.getAttribute('aria-current')).toBe('page');
        expect(homeLink.getAttribute('aria-label')).toBe('Startseite (aktuelle Seite)');

        // Test 2: Generator Seite
        window.location.pathname = '/generator.html';
        setActiveNavItem();
        const generatorLink = document.getElementById('nav-generator').querySelector('a');
        expect(generatorLink.getAttribute('aria-current')).toBe('page');
        expect(generatorLink.getAttribute('aria-label')).toBe('Generator (aktuelle Seite)');

        // Test 3: Nicht existierende Seite
        window.location.pathname = '/nicht-vorhanden.html';
        setActiveNavItem();
        expect(document.querySelector('[aria-current="page"]')).toBe(null);

        // Test 4: Seite ohne Link-Element
        document.getElementById('nav-validator').innerHTML = '';
        window.location.pathname = '/validator.html';
        setActiveNavItem();
        const validatorNav = document.getElementById('nav-validator');
        expect(validatorNav.classList.contains('active')).toBe(true);
    });

    // Test: DOMContentLoaded Event Handler
    test('DOMContentLoaded lädt alle Komponenten', () => {
        const errorSpy = jest.spyOn(console, 'error');
        
        // Event auslösen
        document.dispatchEvent(new Event('DOMContentLoaded'));
        
        // Prüfen ob beide Komponenten geladen wurden
        expect(fetch).toHaveBeenCalledWith('components/header.html');
        expect(fetch).toHaveBeenCalledWith('components/footer.html');
        
        // Fehlerbehandlung prüfen
        expect(errorSpy).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });
}); 