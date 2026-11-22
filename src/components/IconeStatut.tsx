import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpIcon from '@mui/icons-material/Help';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { Box } from '@mui/material';
import { labelStatut } from '../lib/labels';
import type { statutPresenceType } from '../types';

// Mêmes couleurs que le récapitulatif par parcours (OK vert, ABJ jaune, ABI rouge).
const ICONES = {
    present: { Icone: CheckCircleIcon, couleur: '#16A34A' },
    absent_avec_justificatif: { Icone: HelpIcon, couleur: '#CA8A04' },
    absent_sans_justificatif: { Icone: CancelIcon, couleur: '#DC2626' },
    aucun: { Icone: RadioButtonUncheckedIcon, couleur: '#9CA3AF' },
} as const;

function IconeStatut({ statut }: { statut: statutPresenceType | null }) {
    const { Icone, couleur } = ICONES[statut ?? 'aucun'];
    return <Icone fontSize="small" sx={{ color: couleur }} />;
}

// Icône + libellé, pour les options et la valeur du menu de pointage.
function StatutAvecIcone({ statut }: { statut: statutPresenceType | null }) {
    return (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <IconeStatut statut={statut} />
            {labelStatut(statut)}
        </Box>
    );
}

export { IconeStatut, StatutAvecIcone };
