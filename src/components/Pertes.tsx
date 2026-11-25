import { Alert, Box } from '@mui/material';
import { formatDateCourte } from '../lib/format';
import type { perteType } from '../types';

function Pertes({ pertes }: { pertes: perteType[] }) {
    return (
        <Alert severity="warning">
            L'accès aux bonus serait bloqué, et ces places seraient perdues définitivement :
            <Box component="ul" sx={{ my: 1, pl: 2.5 }}>
                {pertes.map((perte) => (
                    <li key={`${perte.etudiantId}:${perte.sortieId}:${perte.type}`}>
                        {perte.etudiantNom} : {perte.evenementNom}, {formatDateCourte(perte.debut)}
                        {perte.type === 'attente' && " (liste d'attente)"}
                    </li>
                ))}
            </Box>
        </Alert>
    );
}

export { Pertes };
