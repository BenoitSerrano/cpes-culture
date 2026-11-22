import { BadgeBonus } from '../../components/BadgeParcours';
import { Box, Divider, Paper, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Chargement } from '../../components/Chargement';
import { Erreur } from '../../components/Erreur';
import { StatutChip } from '../../components/StatutChip';
import { Infos, Lieu } from '../../components/Lieu';
import { api } from '../../lib/api';
import { formatDateHeure } from '../../lib/format';
import type { inscriptionEtudiantType } from '../../types';

function MesInscriptions() {
    const inscriptions = useQuery({ queryKey: ['moi', 'inscriptions'], queryFn: api.getMesInscriptions });

    if (inscriptions.isPending) return <Chargement />;
    if (inscriptions.isError) return <Erreur error={inscriptions.error} />;

    return (
        <Stack spacing={4}>
            <Section titre="À venir" vide="Aucune inscription à venir." lignes={inscriptions.data.aVenir} />
            <Section
                titre="Historique"
                vide="Aucune sortie passée."
                lignes={inscriptions.data.historique}
                avecStatut
            />
        </Stack>
    );
}

function Section(props: {
    titre: string;
    vide: string;
    lignes: inscriptionEtudiantType[];
    avecStatut?: boolean;
}) {
    return (
        <Stack spacing={2}>
            <Typography variant="h2">{props.titre}</Typography>
            {props.lignes.length === 0 ? (
                <Typography color="text.secondary">{props.vide}</Typography>
            ) : (
                <Paper>
                    <Stack divider={<Divider flexItem />}>
                        {props.lignes.map((ligne) => (
                            <Box
                                key={ligne.sortieId}
                                sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}
                            >
                                <Box>
                                    <Typography fontWeight={500}>
                                        {ligne.evenementNom}{' '}
                                        {ligne.bonus && <BadgeBonus sx={{ ml: 0.5 }} />}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <Infos>
                                            {[
                                                ligne.institution,
                                                formatDateHeure(ligne.debut),
                                                ligne.lieu && <Lieu url={ligne.lieu} />,
                                            ]}
                                        </Infos>
                                    </Typography>
                                </Box>
                                {props.avecStatut && <StatutChip statut={ligne.statut} />}
                            </Box>
                        ))}
                    </Stack>
                </Paper>
            )}
        </Stack>
    );
}

export { MesInscriptions };
