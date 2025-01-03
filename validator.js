function addLoadingIndicator() {
    const resultsDiv = document.getElementById('validationResults');
    resultsDiv.innerHTML = `
        <div class="alert alert-info" role="status">
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm mr-2" role="status">
                    <span class="sr-only">Validierung läuft...</span>
                </div>
                <span>Datei wird validiert...</span>
            </div>
        </div>`;
}

document.getElementById('icsFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    addLoadingIndicator();

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const { errors, warnings } = validateICS(content);
        displayValidationResults(errors, warnings);
        displayFileContent(content);
    };
    reader.onerror = function() {
        displayValidationResults(
            ['Fehler beim Lesen der Datei'], 
            []
        );
    };
    reader.readAsText(file);

    // Update file input label
    const fileName = file.name;
    const label = document.querySelector('.custom-file-label');
    label.textContent = fileName;
});

function validateICSFile(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const icsContent = e.target.result;
            const { errors, warnings } = validateICS(icsContent);
            
            // Ergebnisse anzeigen
            displayValidationResults(errors, warnings);
        };
        reader.readAsText(input.files[0]);
    }
}

function isValidICSDate(dateString) {
    // Prüft ganztägige Termine
    if (dateString.includes('VALUE=DATE:')) {
        const date = dateString.split(':')[1];
        return /^\d{8}$/.test(date);
    }
    
    // Prüft Datum-Zeit-Werte
    const datetime = dateString.split(':')[1];
    return /^\d{8}T\d{6}(?:Z)?$/.test(datetime) || 
           /^\d{8}T\d{6}(?:[+-]\d{4})?$/.test(datetime);
}

function displayValidationResults(errors, warnings) {
    const resultsDiv = document.getElementById('validationResults');
    let html = '';
    
    if (errors.length > 0) {
        html += '<h3>Fehler:</h3><ul class="text-danger">';
        errors.forEach(error => {
            html += `<li>${error}</li>`;
        });
        html += '</ul>';
    }
    
    if (warnings.length > 0) {
        html += '<h3>Warnungen:</h3><ul class="text-warning">';
        warnings.forEach(warning => {
            html += `<li>${warning}</li>`;
        });
        html += '</ul>';
    }
    
    if (errors.length === 0 && warnings.length === 0) {
        html = '<div class="alert alert-success">Die ICS-Datei ist valide.</div>';
    }
    
    resultsDiv.innerHTML = html;
}

function displayFileContent(content) {
    const pre = document.getElementById('fileContent');
    const maxDisplayLength = 100000; // Zeichen-Limit für Performance
    
    if (content.length > maxDisplayLength) {
        showWarning(`Die Datei ist sehr groß (${content.length} Zeichen). Es werden nur die ersten ${maxDisplayLength} Zeichen angezeigt.`);
        content = content.substring(0, maxDisplayLength) + '\n[...]';
    }
    
    // Escape HTML um XSS zu verhindern
    const escapedContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    // Syntax-Highlighting für bessere Lesbarkeit
    const highlightedContent = escapedContent
        .replace(/(BEGIN:|END:)([^\r\n]+)/g, '<span class="text-primary">$1$2</span>')
        .replace(/([A-Z-]+):/g, '<span class="text-success">$1:</span>');
    
    pre.innerHTML = highlightedContent;
    pre.setAttribute('role', 'region');
    pre.setAttribute('aria-label', `ICS-Dateiinhalt mit ${content.length} Zeichen`);
}

function showWarning(message) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'alert alert-warning alert-dismissible fade show mt-2';
    warningDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Schließen">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    document.getElementById('fileContent').parentNode.insertBefore(warningDiv, document.getElementById('fileContent'));
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateICSFile,
        isValidICSDate,
        displayValidationResults,
        displayFileContent
    };
} 