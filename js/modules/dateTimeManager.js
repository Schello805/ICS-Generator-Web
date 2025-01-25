// Date Time Manager Module

export const toggleDateTimeFields = (eventNumber) => {
    try {
        const form = document.querySelector(`#eventForm${eventNumber}`);
        if (!form) {
            console.error(`Form #eventForm${eventNumber} nicht gefunden`);
            return;
        }

        const allDayCheckbox = form.querySelector('.allDay');
        const startTimeInput = form.querySelector('.startTime');
        const endTimeInput = form.querySelector('.endTime');
        const timeFormatHelp = form.querySelector('#time-format-help');

        if (!allDayCheckbox || !startTimeInput || !endTimeInput) {
            console.error('Zeit-Elemente nicht gefunden');
            return;
        }

        const isAllDay = allDayCheckbox.checked;
        startTimeInput.style.display = isAllDay ? 'none' : 'block';
        endTimeInput.style.display = isAllDay ? 'none' : 'block';
        if (timeFormatHelp) {
            timeFormatHelp.style.display = isAllDay ? 'none' : 'block';
        }

        // Setze Standardzeiten für ganztägige Events
        if (isAllDay) {
            startTimeInput.value = '00:00';
            endTimeInput.value = '23:59';
        }

        console.log(`Zeitfelder für Event ${eventNumber} aktualisiert. Ganztägig: ${isAllDay}`);
    } catch (error) {
        console.error('Fehler beim Umschalten der Zeitfelder:', error);
    }
};

export const updateEndDate = (eventNumber) => {
    try {
        const form = document.querySelector(`#eventForm${eventNumber}`);
        if (!form) {
            console.error(`Form #eventForm${eventNumber} nicht gefunden`);
            return;
        }

        const startDateInput = form.querySelector('.startDate');
        const endDateInput = form.querySelector('.endDate');
        const repeatUntilInput = form.querySelector('.repeatUntil');

        if (!startDateInput || !endDateInput) {
            console.error('Datum-Elemente nicht gefunden');
            return;
        }

        const startDate = startDateInput.value;
        
        // Setze das Enddatum auf das Startdatum, wenn es leer ist oder vor dem Startdatum liegt
        if (!endDateInput.value || endDateInput.value < startDate) {
            endDateInput.value = startDate;
        }

        // Aktualisiere auch das "Wiederholung bis" Datum
        if (repeatUntilInput && (!repeatUntilInput.value || repeatUntilInput.value < startDate)) {
            repeatUntilInput.value = startDate;
        }

        // Setze die Mindestdaten
        endDateInput.min = startDate;
        if (repeatUntilInput) {
            repeatUntilInput.min = startDate;
        }

        console.log(`Enddatum für Event ${eventNumber} aktualisiert`);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Enddatums:', error);
    }
};
