// Validator Handlers Module
import { validateICS } from './icsValidator.js';

function updateValidationResults(results) {
    const validationList = document.getElementById('validationResults');
    if (!validationList) return;

    validationList.innerHTML = '';

    // Zeige Fehler
    if (results.errors && results.errors.length > 0) {
        results.errors.forEach(error => {
            const li = document.createElement('li');
            li.className = 'list-group-item list-group-item-danger';
            li.innerHTML = `
                <i class="fas fa-times me-2"></i>
                ${error}
            `;
            validationList.appendChild(li);
        });
    }

    // Zeige Warnungen
    if (results.warnings && results.warnings.length > 0) {
        results.warnings.forEach(warning => {
            const li = document.createElement('li');
            li.className = 'list-group-item list-group-item-warning';
            li.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${warning}
            `;
            validationList.appendChild(li);
        });
    }

    // Wenn keine Fehler und Warnungen, zeige Erfolg
    if ((!results.errors || results.errors.length === 0) && 
        (!results.warnings || results.warnings.length === 0)) {
        const li = document.createElement('li');
        li.className = 'list-group-item list-group-item-success';
        li.innerHTML = `
            <i class="fas fa-check me-2"></i>
            Die ICS-Datei ist valide und entspricht dem RFC 5545 Standard
        `;
        validationList.appendChild(li);
    }
}

function displayFileContent(content) {
    const contentDisplay = document.getElementById('fileContent');
    if (contentDisplay) {
        contentDisplay.textContent = content;
    }
}

function handleFileUpload(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        displayFileContent(content);
        
        try {
            const validationResults = validateICS(content);
            updateValidationResults(validationResults);
        } catch (error) {
            console.error('Validation error:', error);
            updateValidationResults({
                errors: ['Fehler bei der Validierung: ' + error.message],
                warnings: []
            });
        }
    };

    reader.onerror = () => {
        updateValidationResults({
            errors: ['Fehler beim Lesen der Datei'],
            warnings: []
        });
    };

    reader.readAsText(file);
}

// Initialize file upload handler
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('icsFile');
    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                handleFileUpload(file);
            }
        });
    }
});
