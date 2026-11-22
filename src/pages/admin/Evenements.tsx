import {
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeParcours } from '../../components/BadgeParcours';
import { Chargement } from '../../components/Chargement';
import { Erreur } from '../../components/Erreur';
import { Lieu } from '../../components/Lieu';
import { api, evenementDtoType } from '../../lib/api';
import { formatDateCourte } from '../../lib/format';
import { ETATS } from '../../lib/labels';
import { useAction } from '../../lib/useAction';
import type { etatEvenementType } from '../../types';
import { FormulaireEvenement } from './formulaires';

const ORDRE_ETATS: etatEvenementType[] = ['ouvert', 'brouillon', 'passe'];

function Evenements() {
    const navigate = useNavigate();
    const evenements = useQuery({ queryKey: ['admin', 'evenements'], queryFn: api.getEvenements });
    const [creation, setCreation] = useState(false);
    const creer = useAction((dto: evenementDtoType) => api.createEvenement(dto), {
        succes: 'Évènement créé. Ajoutez ses sorties avant de l’ouvrir.',
        onSuccess: (evenement) => navigate(`/admin/evenements/${evenement.id}`),
    });

    return (
        <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Box>
                    <Typography variant="h1">Évènements</Typography>
                    <Button
                        component={Link}
                        to="/admin/parcours"
                        size="small"
                        color="inherit"
                        sx={{ color: 'text.secondary', ml: -0.75 }}
                    >
                        Gérer les parcours
                    </Button>
                </Box>
                <Button variant="contained" onClick={() => setCreation(true)}>
                    Nouvel évènement
                </Button>
            </Box>

            {evenements.isPending && <Chargement />}
            {evenements.isError && <Erreur error={evenements.error} />}
            {evenements.data?.length === 0 && (
                <Typography color="text.secondary">Aucun évènement pour le moment.</Typography>
            )}
            {ORDRE_ETATS.map((etat) => {
                const liste = (evenements.data ?? []).filter((e) => e.etat === etat);
                if (liste.length === 0) return null;
                return (
                    <Stack spacing={1} key={etat}>
                        <Typography variant="h2">{ETATS[etat]}</Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Évènement</TableCell>
                                        <TableCell>Parcours</TableCell>
                                        <TableCell>Sorties</TableCell>
                                        <TableCell>Dates</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {liste.map((evenement) => (
                                        <TableRow
                                            key={evenement.id}
                                            hover
                                            component={Link}
                                            to={`/admin/evenements/${evenement.id}`}
                                            sx={{ textDecoration: 'none' }}
                                        >
                                            <TableCell>
                                                <Typography fontWeight={500}>{evenement.nom}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {evenement.institution} <Lieu url={evenement.lieu} compact />
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {evenement.bonus ? (
                                                    <Chip label="Bonus" variant="outlined" />
                                                ) : (
                                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                        <BadgeParcours nom={evenement.parcoursNom} couleur={evenement.parcoursCouleur} />
                                                        {evenement.ouvertAutresParcoursLe && <Chip label="Ouvert à tous" />}
                                                    </Stack>
                                                )}
                                            </TableCell>
                                            <TableCell>{evenement.nbSorties}</TableCell>
                                            <TableCell>
                                                {evenement.premierDebut ? formatDateCourte(evenement.premierDebut) : '—'}
                                                {evenement.dernierDebut &&
                                                    evenement.dernierDebut !== evenement.premierDebut &&
                                                    ` → ${formatDateCourte(evenement.dernierDebut)}`}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Stack>
                );
            })}

            {creation && (
                <FormulaireEvenement
                    titre="Nouvel évènement"
                    enCours={creer.isPending}
                    onFermer={() => setCreation(false)}
                    onValider={(dto) => creer.mutate(dto)}
                />
            )}
        </Stack>
    );
}

export { Evenements };
