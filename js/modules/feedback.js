/**
 * Feedback Module
 * Adds a feedback button and modal to the page.
 */

const ADMIN_EMAIL = 'info@schellenberger.biz';

export function initializeFeedback() {
    injectFeedbackStyles();
    createFeedbackButton();
    createFeedbackModal();
    initVoteHandlers();
}

function injectFeedbackStyles() {
    // Styles are already added to styles.css, but we can double check or add specific overrides if needed.
    // Kept empty as styles.css handles it.
}

function createFeedbackButton() {
    if (document.getElementById('feedbackBtn')) return; // Already exists

    const btn = document.createElement('button');
    btn.id = 'feedbackBtn';
    btn.className = 'btn btn-primary feedback-btn';
    btn.innerHTML = '<i class="fas fa-comment-dots"></i> Feedback';
    btn.setAttribute('data-bs-toggle', 'modal');
    btn.setAttribute('data-bs-target', '#feedbackModal');

    document.body.appendChild(btn);
}

function createFeedbackModal() {
    if (document.getElementById('feedbackModal')) return;

    const modalHtml = `
    <div class="modal fade" id="feedbackModal" tabindex="-1" aria-labelledby="feedbackModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="feedbackModalLabel">Feedback & Wünsche</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p class="text-muted mb-4">Hast Du Wünsche oder Verbesserungsvorschläge für den ICS Generator?</p>
                    
                    <form id="feedbackForm">
                        <div class="mb-3">
                            <label for="feedbackMessage" class="form-label">Deine Nachricht / Wunsch</label>
                            <textarea class="form-control" id="feedbackMessage" rows="4" placeholder="Was kann ich besser machen?"></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="feedbackEmail" class="form-label">E-Mail (optional, für Rückfragen)</label>
                            <input type="email" class="form-control" id="feedbackEmail" placeholder="name@beispiel.de">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Schließen</button>
                    <button type="button" class="btn btn-primary" id="sendFeedbackBtn">
                        <i class="fas fa-paper-plane me-1"></i> Senden
                    </button>
                </div>
            </div>
        </div>
    </div>`;

    // Append modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Initialise listeners for the modal
    document.getElementById('sendFeedbackBtn').addEventListener('click', sendFeedback);
}

function initVoteHandlers() {
    // Voting logic removed
}

async function sendFeedback() {
    const messageInput = document.getElementById('feedbackMessage');
    const emailInput = document.getElementById('feedbackEmail');
    const sendBtn = document.getElementById('sendFeedbackBtn');

    const message = messageInput.value.trim();
    const email = emailInput.value.trim();
    const originalBtnText = sendBtn.innerHTML;

    if (!message) {
        alert('Bitte geben Sie eine Nachricht ein.');
        return;
    }

    // UI Loading State
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Sende...';

    try {
        const response = await fetch('feedback.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                email: email
            })
        });

        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('SERVER RESPONSE:', text);
            throw new Error('Ungültige Server-Antwort. (Kein JSON)');
        }

        if (response.ok && result.success) {
            // Success Message within Modal
            const modalBody = document.querySelector('#feedbackModal .modal-body');
            const alertSuccess = document.createElement('div');
            alertSuccess.className = 'alert alert-success mt-3';
            alertSuccess.innerHTML = '<i class="fas fa-check-circle me-1"></i> Vielen Dank für Dein Feedback!';

            // Remove old alerts if any
            const existingAlert = modalBody.querySelector('.alert');
            if (existingAlert) existingAlert.remove();

            modalBody.appendChild(alertSuccess);

            // Reset Form
            document.getElementById('feedbackForm').reset();

            // Close Modal after delay
            setTimeout(() => {
                const modalEl = document.getElementById('feedbackModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                setTimeout(() => alertSuccess.remove(), 500);
            }, 2000);

        } else {
            throw new Error(result.message || 'Ein unbekannter Fehler ist aufgetreten.');
        }

    } catch (error) {
        console.error('Feedback Error:', error);

        if (confirm(`Fehler beim Senden: ${error.message}\n\nDies erfordert PHP auf dem Server.\n\nMöchtest Du stattdessen Dein Email-Programm öffnen?`)) {
            // Fallback to Mailto
            const subject = encodeURIComponent('Feedback ICS Tools');
            let body = encodeURIComponent(message);
            if (email) body += encodeURIComponent(`\n\n--- Kontaktdaten ---\nEmail: ${email}`);
            window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
        }
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalBtnText;
    }
}
