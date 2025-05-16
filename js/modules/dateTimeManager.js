// Date Time Manager Module

/**
 * Aktualisiert das Enddatum wenn das Startdatum geändert wird
 * @param {HTMLElement} form - Das Formular-Element, das die Datums-Inputs enthält
 */
const updateEndDate = (form) => {
    const startDate = form.querySelector('.startDate');
    const endDate = form.querySelector('.endDate');
    
    if (startDate && endDate) {
        startDate.addEventListener('change', () => {
            // Setze das Enddatum nur, wenn es entweder leer ist oder vor dem Startdatum liegt
            if (!endDate.value || new Date(endDate.value) < new Date(startDate.value)) {
                endDate.value = startDate.value;
            }
        });
    }
};

export const toggleDateTimeFields = (form) => {
    try {
        if (!form) {
            console.error('Form element is required');
            return;
        }

        const checkbox = form.querySelector('.allDay');
        if (!checkbox) {
            console.error('Checkbox not found');
            return;
        }

        // Finde den Container mit den Zeitfeldern
        const timeContainer = form.querySelector('.time-field').closest('.row');
        
        if (timeContainer) {
            // Toggle Sichtbarkeit des gesamten Containers
            timeContainer.style.display = checkbox.checked ? 'none' : '';
            
            // Deaktiviere die Zeitfelder
            const timeInputs = timeContainer.querySelectorAll('input[type="time"]');
            timeInputs.forEach(input => {
                input.disabled = checkbox.checked;
                if (checkbox.checked) {
                    input.value = '';
                }
            });
        }
    } catch (error) {
        console.error('Error in toggleDateTimeFields:', error);
    }
};

export const initializeDateTimeFields = () => {
    try {
        // Setze Standardwerte für neue Datums- und Zeitfelder
        document.querySelectorAll('.eventForm').forEach(form => {
            // Initialisiere Datumswerte
            const today = new Date().toISOString().split('T')[0];
            const startDate = form.querySelector('.startDate');
            const endDate = form.querySelector('.endDate');
            
            if (startDate && !startDate.value) {
                startDate.value = today;
            }
            if (endDate && !endDate.value) {
                endDate.value = today;
            }

            // Initialisiere "Ganztägig" Checkbox und Zeitfelder
            const allDayCheckbox = form.querySelector('.allDay');
            if (allDayCheckbox) {
                // Initialer Status der Zeitfelder basierend auf Checkbox
                toggleDateTimeFields(form);
                
                // Event-Listener für Checkbox-Änderungen
                allDayCheckbox.addEventListener('change', () => {
                    toggleDateTimeFields(form);
                });
            }

            // Aktualisiere Enddatum wenn Startdatum sich ändert
            updateEndDate(form);
        });
    } catch (error) {
        console.error('Error in initializeDateTimeFields:', error);
    }
};
