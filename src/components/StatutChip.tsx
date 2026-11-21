import { Chip } from '@mui/material';
import { labelStatut } from '../lib/labels';
import type { statutPresenceType } from '../types';

const COULEURS = {
    present: 'success',
    absent_avec_justificatif: 'warning',
    absent_sans_justificatif: 'error',
} as const;

function StatutChip({ statut }: { statut: statutPresenceType | null }) {
    return (
        <Chip
            label={labelStatut(statut)}
            color={statut ? COULEURS[statut] : 'default'}
            variant={statut ? 'filled' : 'outlined'}
        />
    );
}

export { StatutChip };
