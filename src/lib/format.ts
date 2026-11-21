const TIME_ZONE = 'Europe/Paris';

function formatDateHeure(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', {
        timeZone: TIME_ZONE,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}

function formatDateCourte(iso: string) {
    return new Intl.DateTimeFormat('fr-FR', {
        timeZone: TIME_ZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}

// Valeur d'un <input type="datetime-local"> (heure de Paris) ↔ ISO.
function isoVersSaisie(iso: string) {
    const parts = new Intl.DateTimeFormat('fr-CA', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(new Date(iso));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

function saisieVersIso(saisie: string) {
    // Décalage de Paris à cette date (heure d'été ou d'hiver).
    const approx = new Date(`${saisie}:00Z`);
    const parisVu = new Date(isoVersSaisie(approx.toISOString()) + ':00Z');
    const decalage = parisVu.getTime() - approx.getTime();
    return new Date(approx.getTime() - decalage).toISOString();
}

export { formatDateHeure, formatDateCourte, isoVersSaisie, saisieVersIso };
