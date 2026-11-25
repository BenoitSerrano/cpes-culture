import { Box, Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgeBonus, BadgeParcours } from '../../components/BadgeParcours';
import { Chargement } from '../../components/Chargement';
import { Confirmation } from '../../components/Confirmation';
import { Erreur } from '../../components/Erreur';
import { Annulations, BadgeBonusBloque, DetailFautes } from '../../components/SituationBonus';
import { StatutChip } from '../../components/StatutChip';
import { api } from '../../lib/api';
import { tokenStorage } from '../../lib/storage';
import { formatDateHeure, formatJour } from '../../lib/format';
import { useAction } from '../../lib/useAction';
import { useActionConfirmee } from '../../lib/useActionConfirmee';
import type { etudiantUpdateDtoType } from '../../types';
import { Compteurs } from './Etudiants';
import { FormulaireEditionEtudiant } from './formulaires';

function Etudiant() {
    const { etudiantId = '' } = useParams();
    const navigate = useNavigate();
    const fiche = useQuery({
        queryKey: ['admin', 'etudiant', etudiantId],
        queryFn: () => api.getEtudiant(etudiantId),
    });
    const [edition, setEdition] = useState(false);
    const [suppression, setSuppression] = useState(false);

    const modifier = useActionConfirmee(
        (dto: etudiantUpdateDtoType, confirme) => api.updateEtudiant(etudiantId, dto, confirme),
        { succes: 'Étudiant modifié.', onSuccess: () => setEdition(false) },
    );
    const voirCommeEtudiant = useAction(() => api.impersonifier(etudiantId), {
        onSuccess: ({ token }) => {
            tokenStorage.demarrerImpersonation(token, etudiantId);
            window.location.assign('/');
        },
    });
    const supprimer = useAction(() => api.deleteEtudiant(etudiantId), {
        succes: 'Étudiant supprimé.',
        onSuccess: () => navigate('/admin/etudiants'),
    });

    if (fiche.isPending) return <Chargement />;
    if (fiche.isError) return <Erreur error={fiche.error} />;
    const e = fiche.data;

    return (
        <Stack spacing={3}>
            <Box>
                <Button component={Link} to="/admin/etudiants" color="inherit" sx={{ color: 'text.secondary', mb: 1, ml: -1 }}>
                    ← Étudiants
                </Button>
                <Typography variant="h1">
                    {e.prenom} {e.nom}
                </Typography>
                <Typography color="text.secondary">
                    {e.email}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                    <BadgeParcours nom={e.parcoursNom} couleur={e.parcoursCouleur} prefixe />
                    <Chip
                        label={
                            e.cotisationPayeeLe
                                ? `Cotisation payée le ${formatJour(e.cotisationPayeeLe)}`
                                : 'Cotisation non payée'
                        }
                        color={e.cotisationPayeeLe ? 'success' : 'warning'}
                    />
                    {e.boursier && <Chip label="Boursier" variant="outlined" />}
                    {e.bonusBloque && <BadgeBonusBloque />}
                </Stack>
            </Box>

            <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => setEdition(true)}>
                    Modifier
                </Button>
                <Button
                    variant="outlined"
                    disabled={voirCommeEtudiant.isPending}
                    onClick={() => voirCommeEtudiant.mutate(undefined)}
                >
                    Voir comme cet étudiant
                </Button>
                <Button color="error" onClick={() => setSuppression(true)}>
                    Supprimer
                </Button>
            </Stack>

            <DetailFautes situation={e.situation} />
            <Annulations annulations={e.annulations} />

            <Box>
                <Typography variant="h2" gutterBottom>
                    Inscriptions
                </Typography>
                <Compteurs
                    present={e.nbPresent}
                    nonInscrit={e.nbNonInscrit}
                    abj={e.nbAbsentAvecJustificatif}
                    abi={e.nbAbsentSansJustificatif}
                />
            </Box>
            {e.inscriptions.length === 0 ? (
                <Typography color="text.secondary">Aucune inscription.</Typography>
            ) : (
                <Paper>
                    <Stack divider={<Divider flexItem />}>
                        {e.inscriptions.map((inscription) => (
                            <Box
                                key={inscription.sortieId}
                                sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}
                            >
                                <Box>
                                    <Link to={`/admin/sorties/${inscription.sortieId}`}>{inscription.evenementNom}</Link>
                                    {inscription.bonus && <BadgeBonus sx={{ ml: 1 }} />}
                                    <Typography variant="body2" color="text.secondary">
                                        {[inscription.institution, formatDateHeure(inscription.debut)].filter(Boolean).join(' · ')}
                                    </Typography>
                                </Box>
                                <StatutChip statut={inscription.statut} />
                            </Box>
                        ))}
                    </Stack>
                </Paper>
            )}

            {edition && (
                <FormulaireEditionEtudiant
                    initial={e}
                    enCours={modifier.isPending}
                    onFermer={() => setEdition(false)}
                    onValider={(dto) => modifier.mutate(dto)}
                />
            )}
            {modifier.dialogue}
            <Confirmation
                ouvert={suppression}
                titre="Supprimer cet étudiant ?"
                libelle="Supprimer définitivement"
                danger
                enCours={supprimer.isPending}
                onAnnuler={() => setSuppression(false)}
                onConfirmer={() => supprimer.mutate(undefined)}
            >
                <Typography>
                    {e.prenom} {e.nom} et ses {e.inscriptions.length} inscription(s), historique de présence
                    compris, seront supprimés. Cette action est irréversible.
                </Typography>
            </Confirmation>
        </Stack>
    );
}

export { Etudiant };
