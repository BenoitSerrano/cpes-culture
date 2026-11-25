import type { etatEvenementType, statutPresenceType } from '../types';

const STATUTS: { value: statutPresenceType; label: string }[] = [
    { value: 'present', label: 'Présent' },
    { value: 'absent_avec_justificatif', label: 'Absent avec justificatif' },
    { value: 'absent_sans_justificatif', label: 'Absent sans justificatif' },
];

function labelStatut(statut: statutPresenceType | null) {
    return STATUTS.find((s) => s.value === statut)?.label ?? 'Pas encore pointé';
}

const ETATS: Record<etatEvenementType, string> = {
    brouillon: 'Non ouvert',
    ouvert: 'À venir',
    passe: 'Passé',
};

function telechargerCsv(filename: string, csv: string) {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = filename;
    lien.click();
    URL.revokeObjectURL(url);
}

export { STATUTS, labelStatut, ETATS, telechargerCsv };
