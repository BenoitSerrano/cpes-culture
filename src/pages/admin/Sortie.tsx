import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Chip,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeParcours } from '../../components/BadgeParcours';
import { Chargement } from '../../components/Chargement';
import { Confirmation } from '../../components/Confirmation';
import { Erreur } from '../../components/Erreur';
import { Infos, Lieu } from '../../components/Lieu';
import { api } from '../../lib/api';
import { getErrorMessage } from '../../lib/errors';
import { formatDateHeure } from '../../lib/format';
import { STATUTS, telechargerCsv } from '../../lib/labels';
import { useNotify } from '../../lib/notify';
import { useTri } from '../../lib/tri';
import { useAction } from '../../lib/useAction';
import type { sortieDetailType, statutPresenceType } from '../../types';

type inscritType = sortieDetailType['inscrits'][number];
type candidatType = sortieDetailType['candidats'][number];

function Sortie() {
    const { sortieId = '' } = useParams();
    const notify = useNotify();
    const sortie = useQuery({ queryKey: ['admin', 'sortie', sortieId], queryFn: () => api.getSortie(sortieId) });
    const [candidat, setCandidat] = useState<candidatType | null>(null);
    const [aDesinscrire, setADesinscrire] = useState<inscritType>();

    const pointer = useAction(
        ({ etudiantId, statut }: { etudiantId: string; statut: statutPresenceType | null }) =>
            api.pointer(sortieId, etudiantId, statut),
    );
    const inscrire = useAction((etudiantId: string) => api.inscrire(sortieId, etudiantId), {
        succes: 'Étudiant inscrit.',
        onSuccess: () => setCandidat(null),
    });
    const desinscrire = useAction((etudiantId: string) => api.desinscrire(sortieId, etudiantId), {
        succes: 'Étudiant désinscrit.',
        onSuccess: () => setADesinscrire(undefined),
    });

    const exporter = async () => {
        try {
            const { filename, csv } = await api.exporterSortie(sortieId);
            telechargerCsv(filename, csv);
        } catch (error) {
            notify(getErrorMessage(error), 'error');
        }
    };

    const triInscrits = useTri(
        sortie.data?.inscrits ?? [],
        {
            etudiant: (i) => `${i.nom} ${i.prenom}`,
            parcours: (i) => i.parcoursNom,
            // Non pointés d'abord, puis absences, puis présents.
            presence: (i) => [null, 'absent_sans_justificatif', 'absent_avec_justificatif', 'present'].indexOf(i.statut),
        },
        { cle: 'etudiant' },
    );

    if (sortie.isPending) return <Chargement />;
    if (sortie.isError) return <Erreur error={sortie.error} />;
    const s = sortie.data;
    const candidatsTries = [...s.candidats].sort(
        (a, b) => Number(!!a.raison) - Number(!!b.raison) || a.nom.localeCompare(b.nom, 'fr'),
    );

    return (
        <Stack spacing={3}>
            <Box>
                <Button
                    component={Link}
                    to={`/admin/evenements/${s.evenementId}`}
                    color="inherit"
                    sx={{ color: 'text.secondary', mb: 1, ml: -1 }}
                >
                    ← {s.evenement.nom}
                </Button>
                <Typography variant="h1" sx={{ '&::first-letter': { textTransform: 'uppercase' } }}>
                    {formatDateHeure(s.debut)}
                </Typography>
                <Typography color="text.secondary">
                    <Infos>
                        {[
                            s.evenement.institution,
                            s.evenement.lieu && <Lieu url={s.evenement.lieu} />,
                            `${s.inscrits.length} / ${s.places} inscrits`,
                        ]}
                    </Infos>
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h2">Inscrits</Typography>
                <Button variant="outlined" onClick={exporter} disabled={s.inscrits.length === 0}>
                    Exporter en CSV
                </Button>
            </Box>
            {!s.pointable && s.inscrits.length > 0 && (
                <Alert severity="info">Le pointage sera possible à partir du jour de la sortie.</Alert>
            )}
            {s.inscrits.length === 0 ? (
                <Typography color="text.secondary">Aucun inscrit.</Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {triInscrits.enTete('etudiant', 'Étudiant')}
                                {triInscrits.enTete('parcours', 'Parcours')}
                                {triInscrits.enTete('presence', 'Présence')}
                                <TableCell align="right" />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {triInscrits.lignes.map((inscrit) => (
                                <TableRow key={inscrit.id}>
                                    <TableCell>
                                        <Link to={`/admin/etudiants/${inscrit.id}`}>
                                            {inscrit.prenom} {inscrit.nom}
                                        </Link>
                                        {inscrit.boursier && <Chip label="Boursier" variant="outlined" sx={{ ml: 1 }} />}
                                    </TableCell>
                                    <TableCell>
                                        <BadgeParcours nom={inscrit.parcoursNom} couleur={inscrit.parcoursCouleur} />
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 220 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            disabled={!s.pointable || pointer.isPending}
                                            value={inscrit.statut ?? ''}
                                            onChange={(e) =>
                                                pointer.mutate({
                                                    etudiantId: inscrit.id,
                                                    statut: (e.target.value || null) as statutPresenceType | null,
                                                })
                                            }
                                        >
                                            <MenuItem value="">Non pointé</MenuItem>
                                            {STATUTS.map((statut) => (
                                                <MenuItem key={statut.value} value={statut.value}>
                                                    {statut.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button color="error" size="small" onClick={() => setADesinscrire(inscrit)}>
                                            Désinscrire
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <Typography variant="h3">Inscrire un étudiant</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Autocomplete
                            sx={{ flexGrow: 1 }}
                            options={candidatsTries}
                            value={candidat}
                            onChange={(_e, valeur) => setCandidat(valeur)}
                            getOptionLabel={(c) => `${c.prenom} ${c.nom} (${c.parcoursNom})`}
                            getOptionDisabled={(c) => !!c.raison}
                            renderOption={(props, c) => (
                                <li {...props} key={c.id}>
                                    <Box>
                                        <Typography>
                                            {c.prenom} {c.nom}{' '}
                                            <Typography component="span" color="text.secondary" variant="body2">
                                                {c.parcoursNom} · {c.email}
                                            </Typography>
                                        </Typography>
                                        {c.raisonMessage && (
                                            <Typography variant="caption" color="text.secondary">
                                                {c.raisonMessage}
                                            </Typography>
                                        )}
                                    </Box>
                                </li>
                            )}
                            renderInput={(params) => <TextField {...params} label="Étudiant" />}
                        />
                        <Button
                            variant="contained"
                            disabled={!candidat || inscrire.isPending}
                            onClick={() => candidat && inscrire.mutate(candidat.id)}
                        >
                            Inscrire
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            <Confirmation
                ouvert={!!aDesinscrire}
                titre="Désinscrire cet étudiant ?"
                libelle="Désinscrire"
                danger
                enCours={desinscrire.isPending}
                onAnnuler={() => setADesinscrire(undefined)}
                onConfirmer={() => aDesinscrire && desinscrire.mutate(aDesinscrire.id)}
            >
                <Typography>
                    {aDesinscrire?.prenom} {aDesinscrire?.nom} sera retiré de cette sortie et sa place libérée.
                </Typography>
            </Confirmation>
        </Stack>
    );
}

export { Sortie };
