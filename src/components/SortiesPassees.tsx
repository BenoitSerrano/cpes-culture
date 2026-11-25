import { Box, Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { formatDateCourte, formatDateHeure } from '../lib/format';
import type { sortiePasseeType } from '../types';
import { BadgeEvenement } from './BadgeParcours';
import { StatutChip } from './StatutChip';

const NB_VISIBLES = 10;

function Presence({ ligne }: { ligne: sortiePasseeType }) {
    if (ligne.inscrit) return <StatutChip statut={ligne.statut} />;
    return ligne.faute ? (
        <Chip label="Non inscrit (obligatoire)" color="error" />
    ) : (
        <Chip label="Non inscrit" variant="outlined" sx={{ color: 'text.secondary' }} />
    );
}

// Sorties passées de l'étudiant, de la plus récente à la plus ancienne.
function SortiesPassees({ lignes }: { lignes: sortiePasseeType[] }) {
    const [tout, setTout] = useState(false);
    if (lignes.length === 0) return null;
    const visibles = tout ? lignes : lignes.slice(0, NB_VISIBLES);
    const nbAutres = lignes.length - visibles.length;

    return (
        <Stack spacing={2}>
            <Typography variant="h2">Passées</Typography>
            <Paper>
                <Stack divider={<Divider flexItem />}>
                    {visibles.map((ligne) => (
                        <Box
                            key={ligne.id}
                            sx={{
                                p: 2,
                                display: 'flex',
                                gap: 1.5,
                                justifyContent: 'space-between',
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                flexDirection: { xs: 'column', sm: 'row' },
                            }}
                        >
                            <Box>
                                <BadgeEvenement evenement={ligne} />
                                <Typography fontWeight={500} sx={{ mt: 0.5 }}>
                                    {ligne.nom}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ '&::first-letter': { textTransform: 'uppercase' } }}
                                >
                                    {formatDateHeure(ligne.debut)}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: { sm: 'right' }, flexShrink: 0 }}>
                                <Presence ligne={ligne} />
                                {ligne.faute && (
                                    <Typography
                                        variant="caption"
                                        display="block"
                                        color={ligne.faute.compenseePar ? 'success.main' : 'error.main'}
                                        sx={{ mt: 0.5 }}
                                    >
                                        {ligne.faute.compenseePar
                                            ? `Compensée par ${ligne.faute.compenseePar.evenementNom}, ${formatDateCourte(ligne.faute.compenseePar.debut)}`
                                            : 'Non compensée'}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    ))}
                </Stack>
            </Paper>
            {nbAutres > 0 && (
                <Box>
                    <Button color="inherit" sx={{ color: 'text.secondary' }} onClick={() => setTout(true)}>
                        {nbAutres === 1 ? "Voir l'autre" : `Voir les ${nbAutres} autres`}
                    </Button>
                </Box>
            )}
        </Stack>
    );
}

export { SortiesPassees };
