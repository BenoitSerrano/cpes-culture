import {
    Alert,
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
    IconButton,
    Tooltip,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeParcours } from '../../components/BadgeParcours';
import { ChampEtudiant } from '../../components/ChampEtudiant';
import { Chargement } from '../../components/Chargement';
import { StatutAvecIcone } from '../../components/IconeStatut';
import { Confirmation } from '../../components/Confirmation';
import { Erreur } from '../../components/Erreur';
import { Infos, Lieu } from '../../components/Lieu';
import { RendezVous } from '../../components/RendezVous';
import { api } from '../../lib/api';
import { getErrorMessage } from '../../lib/errors';
import { formatDateCourte, formatDateHeure } from '../../lib/format';
import { STATUTS, telechargerCsv } from '../../lib/labels';
import { useNotify } from '../../lib/notify';
import { useTri } from '../../lib/tri';
import { useAction } from '../../lib/useAction';
import { useActionConfirmee } from '../../lib/useActionConfirmee';
import type { sortieDetailType, statutPresenceType } from '../../types';

type inscritType = sortieDetailType['inscrits'][number];

// Message ajouté quand la liste d'attente a avancé.
const messagePromus = (promus: string[]) =>
    promus.length === 0
        ? ''
        : ` ${promus.join(', ')} ${promus.length > 1 ? 'sont inscrits' : 'est inscrit'} depuis la liste d'attente.`;

// Message ajouté quand des étudiants bloqués ont perdu des bonus.
const messageAnnulations = (n: number) =>
    n === 0 ? '' : ` ${n} place(s) bonus retirée(s) à des étudiants bloqués.`;

function Sortie() {
    const { sortieId = '' } = useParams();
    const notify = useNotify();
    const sortie = useQuery({ queryKey: ['admin', 'sortie', sortieId], queryFn: () => api.getSortie(sortieId) });
    const [aDesinscrire, setADesinscrire] = useState<inscritType>();

    const pointer = useActionConfirmee(
        ({ etudiantId, statut }: { etudiantId: string; statut: statutPresenceType | null }, confirme) =>
            api.pointer(sortieId, etudiantId, statut, confirme),
        {
            succes: ({ nbAnnulations }) =>
                nbAnnulations > 0 ? `Pointage enregistré.${messageAnnulations(nbAnnulations)}` : undefined,
        },
    );
    const inscrire = useAction((etudiantId: string) => api.inscrire(sortieId, etudiantId), {
        succes: 'Étudiant inscrit.',
    });
    const mettreEnAttente = useAction((etudiantId: string) => api.ajouterEnListeAttente(sortieId, etudiantId), {
        succes: ({ position }) =>
            `Étudiant ajouté à la liste d'attente (${position === 1 ? '1ʳᵉ' : `${position}ᵉ`} place).`,
    });
    const desinscrire = useActionConfirmee(
        (etudiantId: string, confirme) => api.desinscrire(sortieId, etudiantId, confirme),
        {
            succes: ({ promus, nbAnnulations }) =>
                `Étudiant désinscrit.${messagePromus(promus)}${messageAnnulations(nbAnnulations)}`,
            onSuccess: () => setADesinscrire(undefined),
        },
    );
    const [aRetirer, setARetirer] = useState<sortieDetailType['listeAttente'][number]>();
    const retirer = useAction((etudiantId: string) => api.retirerDeListeAttente(sortieId, etudiantId), {
        succes: "Étudiant retiré de la liste d'attente.",
        onSuccess: () => setARetirer(undefined),
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
            // Nom et prénom séparés : tri alphabétique par l'un ou par l'autre.
            nom: (i) => `${i.nom} ${i.prenom}`,
            prenom: (i) => `${i.prenom} ${i.nom}`,
            parcours: (i) => i.parcoursNom,
            // Pas encore pointés d'abord, puis absences, puis présents.
            presence: (i) => [null, 'absent_sans_justificatif', 'absent_avec_justificatif', 'present'].indexOf(i.statut),
        },
        { cle: 'prenom' },
    );

    if (sortie.isPending) return <Chargement />;
    if (sortie.isError) return <Erreur error={sortie.error} />;
    const s = sortie.data;

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
                <RendezVous texte={s.evenement.lieuRendezVous} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h2">Inscrits</Typography>
                <Tooltip title={s.inscrits.length === 0 ? 'Aucun inscrit à exporter' : 'Exporter les inscrits en CSV'}>
                    {/* span : l'infobulle reste visible quand le bouton est désactivé. */}
                    <span>
                        <IconButton
                            aria-label="Exporter les inscrits en CSV"
                            onClick={exporter}
                            disabled={s.inscrits.length === 0}
                        >
                            <FileDownloadOutlinedIcon />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
            <ChampEtudiant
                candidats={s.candidats}
                libelle="Inscrire un étudiant"
                bouton="Inscrire"
                enCours={inscrire.isPending}
                onValider={(id, onSuccess) => inscrire.mutate(id, { onSuccess })}
            />
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
                                {triInscrits.enTete('nom', 'Nom')}
                                {triInscrits.enTete('prenom', 'Prénom')}
                                {triInscrits.enTete('parcours', 'Parcours')}
                                {triInscrits.enTete('presence', 'Présence')}
                                <TableCell align="right" />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {triInscrits.lignes.map((inscrit) => (
                                <TableRow key={inscrit.id}>
                                    <TableCell>
                                        <Link to={`/admin/etudiants/${inscrit.id}`}>{inscrit.nom}</Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link to={`/admin/etudiants/${inscrit.id}`}>{inscrit.prenom}</Link>
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
                                            // Sans displayEmpty, « Pas encore pointé » ('') ne s'affiche pas.
                                            slotProps={{
                                                select: {
                                                    displayEmpty: true,
                                                    renderValue: (valeur) => (
                                                        <StatutAvecIcone
                                                            statut={(valeur || null) as statutPresenceType | null}
                                                        />
                                                    ),
                                                },
                                            }}
                                            onChange={(e) =>
                                                pointer.mutate({
                                                    etudiantId: inscrit.id,
                                                    statut: (e.target.value || null) as statutPresenceType | null,
                                                })
                                            }
                                        >
                                            <MenuItem value="">
                                                <StatutAvecIcone statut={null} />
                                            </MenuItem>
                                            {STATUTS.map((statut) => (
                                                <MenuItem key={statut.value} value={statut.value}>
                                                    <StatutAvecIcone statut={statut.value} />
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Désinscrire">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                aria-label={`Désinscrire ${inscrit.prenom} ${inscrit.nom}`}
                                                onClick={() => setADesinscrire(inscrit)}
                                            >
                                                <PersonRemoveOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {s.evenement.bonus && (
                <Stack spacing={1}>
                    <Typography variant="h2">Liste d'attente</Typography>
                    {s.inscrits.length >= s.places ? (
                        <ChampEtudiant
                            candidats={s.candidatsAttente}
                            libelle="Ajouter à la liste d'attente"
                            bouton="Ajouter"
                            discret
                            enCours={mettreEnAttente.isPending}
                            onValider={(id, onSuccess) => mettreEnAttente.mutate(id, { onSuccess })}
                        />
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            Il reste des places : on ne peut ajouter personne à la liste d'attente.
                        </Typography>
                    )}
                    {s.listeAttente.length === 0 ? (
                        <Typography color="text.secondary">Personne en attente.</Typography>
                    ) : (
                        <>
                            <Typography variant="body2" color="text.secondary">
                                Quand une place se libère (désinscription ou places ajoutées), le premier
                                étudiant qui remplit encore les règles est inscrit automatiquement.
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>#</TableCell>
                                            <TableCell>Prénom</TableCell>
                                            <TableCell>Nom</TableCell>
                                            <TableCell>Parcours</TableCell>
                                            <TableCell>En attente depuis</TableCell>
                                            <TableCell align="right" />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {s.listeAttente.map((attente) => (
                                            <TableRow key={attente.id}>
                                                <TableCell>{attente.position}</TableCell>
                                                <TableCell>
                                                    <Link to={`/admin/etudiants/${attente.id}`}>{attente.prenom}</Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Link to={`/admin/etudiants/${attente.id}`}>{attente.nom}</Link>
                                                    {attente.raisonMessage && (
                                                        <Typography variant="caption" color="warning.main" display="block">
                                                            Sera sauté : {attente.raisonMessage}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <BadgeParcours nom={attente.parcoursNom} couleur={attente.parcoursCouleur} />
                                                </TableCell>
                                                <TableCell>{formatDateCourte(attente.depuis)}</TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="Retirer de la liste d'attente">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            aria-label={`Retirer ${attente.prenom} ${attente.nom} de la liste d'attente`}
                                                            onClick={() => setARetirer(attente)}
                                                        >
                                                            <PersonRemoveOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </Stack>
            )}

            <Confirmation
                ouvert={!!aRetirer}
                titre="Retirer de la liste d'attente ?"
                libelle="Retirer"
                danger
                enCours={retirer.isPending}
                onAnnuler={() => setARetirer(undefined)}
                onConfirmer={() => aRetirer && retirer.mutate(aRetirer.id)}
            >
                <Typography>
                    {aRetirer?.prenom} {aRetirer?.nom} perdra sa place ({aRetirer?.position}ᵉ) dans la file.
                </Typography>
            </Confirmation>
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
            {pointer.dialogue}
            {desinscrire.dialogue}
        </Stack>
    );
}

export { Sortie };
