import { Alert, Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import { formatDateCourte } from '../lib/format';
import type { annulationType, fauteType, situationType } from '../types';

function BadgeBonusBloque() {
    return (
        <Chip
            label="Bonus bloqué"
            color="error"
            title="Faute non compensée : absence injustifiée ou non-inscription"
        />
    );
}

function libelleFaute(faute: fauteType) {
    return faute.type === 'abi'
        ? `Absence sans justificatif : ${faute.evenementNom}, ${formatDateCourte(faute.date)}`
        : `Non-inscription : ${faute.evenementNom}, inscriptions closes le ${formatDateCourte(faute.date)}`;
}

// Fiche étudiant (prof) : chaque faute et la présence qui la compense.
function DetailFautes({ situation }: { situation: situationType }) {
    if (situation.fautes.length === 0) return null;
    return (
        <Stack spacing={1}>
            <Typography variant="h2">Fautes et compensations</Typography>
            <Paper>
                <Stack divider={<Divider flexItem />}>
                    {situation.fautes.map((faute) => (
                        <Box key={`${faute.type}:${faute.sortieId ?? faute.evenementId}`} sx={{ p: 2 }}>
                            <Typography>{libelleFaute(faute)}</Typography>
                            <Typography
                                variant="body2"
                                color={faute.compenseePar ? 'success.main' : 'error.main'}
                            >
                                {faute.compenseePar
                                    ? `Compensée par ${faute.compenseePar.evenementNom}, ${formatDateCourte(faute.compenseePar.debut)}`
                                    : 'Non compensée'}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </Paper>
        </Stack>
    );
}

// Accueil de l'étudiant : ce qui bloque les bonus et comment les débloquer.
function AlerteBonusBloque({ bonus }: { bonus: situationType }) {
    if (!bonus.bloque) return null;
    const pluriel = bonus.nbRestantes > 1 ? 's' : '';
    return (
        <Alert severity="warning">
            Votre accès aux évènements bonus est bloqué :
            <Box component="ul" sx={{ my: 1, pl: 2.5 }}>
                {bonus.fautes.map((faute) => (
                    <li key={`${faute.type}:${faute.sortieId ?? faute.evenementId}`}>{libelleFaute(faute)}</li>
                ))}
            </Box>
            Il vous reste {bonus.nbRestantes} présence{pluriel} à une sortie hors parcours pour débloquer
            les bonus.
        </Alert>
    );
}

// Inscriptions et rangs d'attente perdus à cause du blocage.
function Annulations({ annulations }: { annulations: annulationType[] }) {
    if (annulations.length === 0) return null;
    return (
        <Stack spacing={1}>
            <Typography variant="h2">Bonus annulés</Typography>
            <Paper>
                <Stack divider={<Divider flexItem />}>
                    {annulations.map((annulation) => (
                        <Box key={`${annulation.sortieId}:${annulation.annuleeLe}`} sx={{ p: 2 }}>
                            <Typography fontWeight={500}>
                                {annulation.evenementNom}, {formatDateCourte(annulation.debut)}
                            </Typography>
                            <Typography variant="body2" color="error.main">
                                {annulation.type === 'inscription'
                                    ? 'Inscription annulée'
                                    : "Retrait de la liste d'attente"}{' '}
                                le {formatDateCourte(annulation.annuleeLe)} : accès aux bonus bloqué
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </Paper>
        </Stack>
    );
}

export { BadgeBonusBloque, DetailFautes, AlerteBonusBloque, Annulations };
