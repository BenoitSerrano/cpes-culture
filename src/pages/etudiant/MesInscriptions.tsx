import { BadgeBonus } from '../../components/BadgeParcours';
import { Box, Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Confirmation } from '../../components/Confirmation';
import { Chargement } from '../../components/Chargement';
import { Erreur } from '../../components/Erreur';
import { StatutChip } from '../../components/StatutChip';
import { Infos, Lieu } from '../../components/Lieu';
import { RendezVous } from '../../components/RendezVous';
import { api } from '../../lib/api';
import { formatDateHeure } from '../../lib/format';
import { tokenStorage } from '../../lib/storage';
import { useAction } from '../../lib/useAction';
import type { attenteEtudiantType, inscriptionEtudiantType } from '../../types';

function MesInscriptions() {
    const inscriptions = useQuery({
        queryKey: ['moi', 'inscriptions'],
        queryFn: api.getMesInscriptions,
        // La position en liste d'attente évolue : rafraîchie régulièrement.
        refetchInterval: 10_000,
    });

    if (inscriptions.isPending) return <Chargement />;
    if (inscriptions.isError) return <Erreur error={inscriptions.error} />;

    return (
        <Stack spacing={4}>
            <Section titre="À venir" vide="Aucune inscription à venir." lignes={inscriptions.data.aVenir} />
            {inscriptions.data.listeAttente.length > 0 && (
                <ListeAttente lignes={inscriptions.data.listeAttente} />
            )}
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
                                    {/* Utile seulement pour les sorties à venir. */}
                                    {!props.avecStatut && <RendezVous texte={ligne.lieuRendezVous} />}
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

function ListeAttente({ lignes }: { lignes: attenteEtudiantType[] }) {
    const [aQuitter, setAQuitter] = useState<attenteEtudiantType>();
    const quitter = useAction((sortieId: string) => api.quitterListeAttente(sortieId), {
        succes: "Vous avez quitté la liste d'attente.",
        onSuccess: () => setAQuitter(undefined),
    });

    return (
        <Stack spacing={2}>
            <Typography variant="h2">Liste d'attente</Typography>
            <Typography variant="body2" color="text.secondary">
                Si une place se libère, vous êtes inscrit automatiquement.
            </Typography>
            <Paper>
                <Stack divider={<Divider flexItem />}>
                    {lignes.map((ligne) => (
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
                            <Box sx={{ textAlign: 'right' }}>
                                <Chip
                                    icon={<HourglassTopIcon />}
                                    label={`${ligne.position === 1 ? '1ʳᵉ' : `${ligne.position}ᵉ`} sur ${ligne.nbEnAttente}`}
                                    sx={{ bgcolor: '#FEF3C7' }}
                                />
                                <Box>
                                    <Button
                                        size="small"
                                        color="inherit"
                                        sx={{ color: 'text.secondary', mt: 0.5 }}
                                        disabled={tokenStorage.estEnImpersonation()}
                                        onClick={() => setAQuitter(ligne)}
                                    >
                                        Quitter la liste
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Stack>
            </Paper>
            <Confirmation
                ouvert={!!aQuitter}
                titre="Quitter la liste d'attente ?"
                libelle="Quitter"
                danger
                enCours={quitter.isPending}
                onAnnuler={() => setAQuitter(undefined)}
                onConfirmer={() => aQuitter && quitter.mutate(aQuitter.sortieId)}
            >
                <Typography>
                    Vous perdrez votre place dans la file pour <strong>{aQuitter?.evenementNom}</strong>.
                </Typography>
            </Confirmation>
        </Stack>
    );
}

export { MesInscriptions };
