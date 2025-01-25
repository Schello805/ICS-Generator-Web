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
        const timeFields = form.querySelectorAll('.time-field');
        
        if (!checkbox || timeFields.length === 0) {
            console.error('Required elements not found');
            return;
        }

        console.log('Checkbox checked:', checkbox.checked);
        console.log('Found time fields:', timeFields.length);

        timeFields.forEach(field => {
            field.style.display = checkbox.checked ? 'none' : '';
            // Deaktiviere auch die Eingabefelder
            const inputs = field.querySelectorAll('input');
            inputs.forEach(input => {
                input.disabled = checkbox.checked;
                if (checkbox.checked) {
                    input.value = '';  // Leere die Zeitfelder wenn ganztägig
                }
            });
        });
    } catch (error) {
        console.error('Error in toggleDateTimeFields:', error);
    }
};

export const initializeDateTimeFields = () => {
    try {
        document.querySelectorAll('.eventForm').forEach(form => {
            // Setze das aktuelle Datum für alle Datumsfelder
            const today = new Date().toISOString().split('T')[0];
            const dateInputs = form.querySelectorAll('input[type="date"]');
            dateInputs.forEach(dateInput => {
                if (!dateInput.value) {
                    dateInput.value = today;
                }
            });

            // Initialisiere die Aktualisierung des Enddatums
            updateEndDate(form);

            // Setze die aktuelle Zeit für Startzeit-Felder
            const now = new Date();
            const currentHour = String(now.getHours()).padStart(2, '0');
            const currentMinute = String(now.getMinutes()).padStart(2, '0');
            const startTimeInput = form.querySelector('.startTime');
            if (startTimeInput && !startTimeInput.value) {
                startTimeInput.value = `${currentHour}:${currentMinute}`;
            }

            // Setze die Zeit eine Stunde später für Endzeit-Felder
            const later = new Date(now.getTime() + 60 * 60 * 1000);
            const laterHour = String(later.getHours()).padStart(2, '0');
            const laterMinute = String(later.getMinutes()).padStart(2, '0');
            const endTimeInput = form.querySelector('.endTime');
            if (endTimeInput && !endTimeInput.value) {
                endTimeInput.value = `${laterHour}:${laterMinute}`;
            }
        });
    } catch (error) {
        console.error('Error in initializeDateTimeFields:', error);
    }
};
