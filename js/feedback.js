/**
 * Feedback-System für ICS Tools
 * Zeigt benutzerfreundliche Meldungen für verschiedene Aktionen
 */

class FeedbackManager {
    constructor() {
        this.feedbackContainer = this.createFeedbackContainer();
    }

    createFeedbackContainer() {
        const container = document.createElement('div');
        container.id = 'feedback-container';
        container.className = 'feedback-container';
        document.body.appendChild(container);
        return container;
    }

    show(options) {
        const {
            type = 'info',
            message,
            duration = 5000,
            isSticky = false,
            action = null
        } = options;

        const feedback = document.createElement('div');
        feedback.className = `feedback-message alert alert-${type} alert-dismissible fade show`;
        feedback.setAttribute('role', 'alert');
        
        // Icon basierend auf Typ
        const icon = this.getIconForType(type);
        
        // HTML für die Nachricht
        feedback.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas ${icon} mr-2" aria-hidden="true"></i>
                <div class="feedback-content">
                    ${message}
                    ${action ? this.createActionButton(action) : ''}
                </div>
                <button type="button" class="close ml-auto" data-dismiss="alert" aria-label="Schließen">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `;

        // Accessibility
        if (type === 'error') {
            feedback.setAttribute('aria-live', 'assertive');
        } else {
            feedback.setAttribute('aria-live', 'polite');
        }

        this.feedbackContainer.appendChild(feedback);

        // Animation beim Einfügen
        requestAnimationFrame(() => {
            feedback.style.transform = 'translateY(0)';
            feedback.style.opacity = '1';
        });

        // Automatisches Ausblenden
        if (!isSticky) {
            setTimeout(() => {
                this.hide(feedback);
            }, duration);
        }

        return feedback;
    }

    hide(feedback) {
        feedback.classList.remove('show');
        feedback.classList.add('hiding');
        setTimeout(() => {
            feedback.remove();
        }, 300);
    }

    getIconForType(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    createActionButton(action) {
        return `
            <button class="btn btn-link btn-sm feedback-action" 
                    onclick="${action.handler}">
                ${action.text}
            </button>
        `;
    }

    // Vordefinierte Feedback-Typen
    success(message, options = {}) {
        return this.show({ type: 'success', message, ...options });
    }

    error(message, options = {}) {
        return this.show({ type: 'error', message, isSticky: true, ...options });
    }

    warning(message, options = {}) {
        return this.show({ type: 'warning', message, ...options });
    }

    info(message, options = {}) {
        return this.show({ type: 'info', message, ...options });
    }
}

// Globale Instanz erstellen
const feedback = new FeedbackManager();

// Export nur wenn in Node.js Umgebung
try {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { FeedbackManager };
    }
} catch (e) {
    // Ignorieren im Browser-Kontext
} 