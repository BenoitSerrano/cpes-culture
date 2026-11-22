import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Paper,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery } from '@tanstack/react-query';
import { ChangeEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgeParcours } from '../../components/BadgeParcours';
import { Chargement } from '../../components/Chargement';
import { Confirmation } from '../../components/Confirmation';
import { Erreur } from '../../components/Erreur';
import { api } from '../../lib/api';
import { useAction } from '../../lib/useAction';
import type {
    apercuImportType,
    etudiantAdminType,
    etudiantDtoType,
    statutRecapitulatifType,
} from '../../types';
import { FormulaireEtudiant } from './formulaires';

type filtreBooleenType = '' | 'oui' | 'non';

function normaliser(texte: string) {
    return texte
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

function Etudiants() {
    const etudiants = useQuery({ queryKey: ['admin', 'etudiants'], queryFn: api.getEtudiants });
    const parcours = useQuery({ queryKey: ['admin', 'parcours'], queryFn: api.getParcours });
    const [recherche, setRecherche] = useState('');
    // Vue courante dans l'URL (?parcours=<id>), absente pour la vue « Tous ».
    const [searchParams, setSearchParams] = useSearchParams();
    const parcoursId = searchParams.get('parcours') ?? '';
    const recapitulatif = useQuery({
        queryKey: ['admin', 'recapitulatif', parcoursId],
        queryFn: () => api.getRecapitulatifParcours(parcoursId),
        enabled: !!parcoursId,
    });
    const colonnesEvenements = parcoursId ? (recapitulatif.data?.evenements ?? []) : [];
    const [cotisation, setCotisation] = useState<filtreBooleenType>('');
    const [boursier, setBoursier] = useState<filtreBooleenType>('');
    const [creation, setCreation] = useState(false);
    const [importOuvert, setImportOuvert] = useState(false);
    const [cotisationAChanger, setCotisationAChanger] = useState<etudiantAdminType>();

    const creer = useAction((dto: etudiantDtoType) => api.createEtudiant(dto), {
        succes: 'Étudiant ajouté.',
        onSuccess: () => setCreation(false),
    });
    const basculerCotisation = useAction(
        ({ id, valeur }: { id: string; valeur: boolean }) => api.updateEtudiant(id, { cotisationPayee: valeur }),
        { succes: 'Cotisation mise à jour.', onSuccess: () => setCotisationAChanger(undefined) },
    );

    const filtres = useMemo(() => {
        const r = normaliser(recherche.trim());
        const correspond = (filtre: filtreBooleenType, valeur: boolean) =>
            filtre === '' || (filtre === 'oui') === valeur;
        return (etudiants.data ?? []).filter(
            (e) =>
                (!r || normaliser(`${e.prenom} ${e.nom} ${e.email}`).includes(r)) &&
                (!parcoursId || e.parcoursId === parcoursId) &&
                correspond(cotisation, e.cotisationPayee) &&
                correspond(boursier, e.boursier),
        );
    }, [etudiants.data, recherche, parcoursId, cotisation, boursier]);

    return (
        <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h1">Étudiants</Typography>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={() => setImportOuvert(true)}>
                        Importer un CSV
                    </Button>
                    <Button variant="contained" onClick={() => setCreation(true)}>
                        Ajouter
                    </Button>
                </Stack>
            </Box>

            <Tabs
                value={parcoursId}
                onChange={(_e, valeur: string) => setSearchParams(valeur ? { parcours: valeur } : {})}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab value="" label="Tous" />
                {(parcours.data ?? []).map((p) => (
                    <Tab key={p.id} value={p.id} label={p.nom} />
                ))}
            </Tabs>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField label="Rechercher" value={recherche} onChange={(e) => setRecherche(e.target.value)} sx={{ flexGrow: 1 }} />
                <FiltreBooleen label="Cotisation payée" valeur={cotisation} onChange={setCotisation} />
                <FiltreBooleen label="Boursier" valeur={boursier} onChange={setBoursier} />
            </Stack>

            {etudiants.isPending && <Chargement />}
            {etudiants.isError && <Erreur error={etudiants.error} />}
            {recapitulatif.isError && <Erreur error={recapitulatif.error} />}
            {etudiants.data && (
                <>
                    <Typography variant="body2" color="text.secondary">
                        {filtres.length} étudiant(s)
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Étudiant</TableCell>
                                    {!parcoursId && <TableCell>Parcours</TableCell>}
                                    <TableCell>Boursier</TableCell>
                                    <TableCell>Cotisation</TableCell>
                                    {!parcoursId && <TableCell>Présences</TableCell>}
                                    {colonnesEvenements.map((evenement) => (
                                        <TableCell key={evenement.id} sx={{ whiteSpace: 'nowrap' }}>
                                            <Tooltip title={evenement.nom}>
                                                <Link to={`/admin/evenements/${evenement.id}`}>{evenement.slug}</Link>
                                            </Tooltip>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtres.map((e) => (
                                    <TableRow key={e.id} hover>
                                        <TableCell>
                                            <Link to={`/admin/etudiants/${e.id}`}>
                                                {e.prenom} {e.nom}
                                            </Link>
                                            <Typography variant="body2" color="text.secondary">
                                                {e.email}
                                            </Typography>
                                        </TableCell>
                                        {!parcoursId && (
                                            <TableCell>
                                                <BadgeParcours nom={e.parcoursNom} couleur={e.parcoursCouleur} />
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <OuiNon valeur={e.boursier} label="Boursier" />
                                        </TableCell>
                                        <TableCell>
                                            {/* Action à sens unique : le retour à « non payée » se fait
                                                depuis la fiche de l'étudiant. */}
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ whiteSpace: 'nowrap' }}>
                                                <OuiNon valeur={e.cotisationPayee} label="Cotisation payée" />
                                                <Typography variant="body2">
                                                    {e.cotisationPayee ? 'Payée' : 'Non payée'}
                                                </Typography>
                                                {!e.cotisationPayee && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        disabled={basculerCotisation.isPending}
                                                        onClick={() => setCotisationAChanger(e)}
                                                    >
                                                        Marquer payée
                                                    </Button>
                                                )}
                                            </Stack>
                                        </TableCell>
                                        {!parcoursId && (
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                <Compteurs
                                                    present={e.nbPresent}
                                                    avecJustif={e.nbAbsentAvecJustificatif}
                                                    sansJustif={e.nbAbsentSansJustificatif}
                                                />
                                            </TableCell>
                                        )}
                                        {colonnesEvenements.map((evenement) => {
                                            const statut = recapitulatif.data?.cellules[e.id]?.[evenement.id];
                                            return (
                                                <TableCell key={evenement.id}>
                                                    {statut && <StatutRecapitulatif statut={statut} />}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {creation && (
                <FormulaireEtudiant
                    titre="Ajouter un étudiant"
                    enCours={creer.isPending}
                    onFermer={() => setCreation(false)}
                    onValider={(dto) => creer.mutate(dto)}
                />
            )}
            {importOuvert && <ImportCsv onFermer={() => setImportOuvert(false)} />}
            <Confirmation
                ouvert={!!cotisationAChanger}
                titre="Marquer la cotisation comme payée ?"
                libelle="Confirmer"
                enCours={basculerCotisation.isPending}
                onAnnuler={() => setCotisationAChanger(undefined)}
                onConfirmer={() =>
                    cotisationAChanger && basculerCotisation.mutate({ id: cotisationAChanger.id, valeur: true })
                }
            >
                <Typography>
                    {cotisationAChanger?.prenom} {cotisationAChanger?.nom} pourra s’inscrire aux sorties.
                </Typography>
            </Confirmation>
        </Stack>
    );
}

function FiltreBooleen(props: {
    label: string;
    valeur: filtreBooleenType;
    onChange: (valeur: filtreBooleenType) => void;
}) {
    return (
        <TextField
            select
            label={props.label}
            value={props.valeur}
            onChange={(e) => props.onChange(e.target.value as filtreBooleenType)}
            sx={{ minWidth: 150 }}
        >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="oui">Oui</MenuItem>
            <MenuItem value="non">Non</MenuItem>
        </TextField>
    );
}

const STATUTS_RECAPITULATIF: Record<
    statutRecapitulatifType,
    { label: string; titre: string; couleur?: { bg: string; fg: string } }
> = {
    non_inscrit: { label: 'Non-inscrit', titre: 'Inscrit à aucune sortie', couleur: { bg: '#F97316', fg: '#fff' } },
    non_pointe: { label: 'Non-pointé', titre: 'Inscrit, présence pas encore pointée' },
    abj: { label: 'ABJ', titre: 'Absent avec justificatif', couleur: { bg: '#FACC15', fg: '#111' } },
    abi: { label: 'ABI', titre: 'Absent sans justificatif', couleur: { bg: '#DC2626', fg: '#fff' } },
    ok: { label: 'OK', titre: 'Présent', couleur: { bg: '#16A34A', fg: '#fff' } },
};

function StatutRecapitulatif({ statut }: { statut: statutRecapitulatifType }) {
    const { label, titre, couleur } = STATUTS_RECAPITULATIF[statut];
    return (
        <Chip
            label={label}
            title={titre}
            variant={couleur ? 'filled' : 'outlined'}
            sx={couleur ? { bgcolor: couleur.bg, color: couleur.fg, fontWeight: 600 } : undefined}
        />
    );
}

function OuiNon({ valeur, label }: { valeur: boolean; label: string }) {
    return valeur ? (
        <CheckIcon color="success" fontSize="small" titleAccess={`${label} : oui`} />
    ) : (
        <CloseIcon color="error" fontSize="small" titleAccess={`${label} : non`} />
    );
}

function Compteurs(props: { present: number; avecJustif: number; sansJustif: number }) {
    return (
        <Typography variant="body2" component="span">
            <span title="Présent">✓ {props.present}</span>
            {' · '}
            <span title="Absent avec justificatif">{props.avecJustif} justifiée(s)</span>
            {' · '}
            <Box
                component="span"
                title="Absent sans justificatif"
                sx={{ color: props.sansJustif > 0 ? 'error.main' : undefined }}
            >
                {props.sansJustif} sans justificatif
            </Box>
        </Typography>
    );
}

function ImportCsv({ onFermer }: { onFermer: () => void }) {
    const [csv, setCsv] = useState<string>();
    const [nomFichier, setNomFichier] = useState('');
    const [apercu, setApercu] = useState<apercuImportType>();

    const previsualiser = useAction((contenu: string) => api.apercuImport(contenu), {
        onSuccess: setApercu,
    });
    const importer = useAction((contenu: string) => api.importer(contenu), {
        succes: ({ nbCrees, nbMisAJour }) => `${nbCrees} étudiant(s) créé(s), ${nbMisAJour} mis à jour.`,
        onSuccess: onFermer,
    });

    const choisirFichier = async (event: ChangeEvent<HTMLInputElement>) => {
        const fichier = event.target.files?.[0];
        if (!fichier) return;
        const contenu = await fichier.text();
        setNomFichier(fichier.name);
        setCsv(contenu);
        setApercu(undefined);
        previsualiser.mutate(contenu);
    };

    return (
        <Dialog open onClose={onFermer} maxWidth="md" fullWidth>
            <DialogTitle>Importer des étudiants</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                        Colonnes attendues : <code>nom, prenom, email, parcours, boursier, cotisation_payee</code>{' '}
                        (séparateur « ; » ou « , »). Le parcours est désigné par son nom ; boursier et
                        cotisation_payee valent oui ou non. Un e-mail déjà connu met l'étudiant à jour.
                    </Typography>
                    <Box>
                        <Button variant="outlined" component="label">
                            Choisir un fichier
                            <input type="file" accept=".csv,text/csv" hidden onChange={choisirFichier} />
                        </Button>
                        {nomFichier && (
                            <Typography component="span" sx={{ ml: 2 }} color="text.secondary">
                                {nomFichier}
                            </Typography>
                        )}
                    </Box>
                    {previsualiser.isPending && <Chargement />}
                    {apercu && (
                        <>
                            <Typography>
                                <strong>{apercu.aCreer.length}</strong> à créer ·{' '}
                                <strong>{apercu.aMettreAJour.length}</strong> à mettre à jour ·{' '}
                                <strong>{apercu.erreurs.length}</strong> en erreur
                            </Typography>
                            {apercu.erreurs.length > 0 && (
                                <Alert severity="error">
                                    Corrigez le fichier puis rechargez-le : rien n'est importé tant qu'il reste
                                    une erreur.
                                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                        {apercu.erreurs.map((erreur) => (
                                            <li key={erreur.ligne}>
                                                Ligne {erreur.ligne} : {erreur.message}
                                            </li>
                                        ))}
                                    </Box>
                                </Alert>
                            )}
                            {apercu.erreurs.length === 0 && (
                                <TableContainer component={Paper} sx={{ maxHeight: 320 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell />
                                                <TableCell>Étudiant</TableCell>
                                                <TableCell>Parcours</TableCell>
                                                <TableCell>Boursier</TableCell>
                                                <TableCell>Cotisation</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {[
                                                ...apercu.aCreer.map((l) => ({ ...l, action: 'Création' })),
                                                ...apercu.aMettreAJour.map((l) => ({ ...l, action: 'Mise à jour' })),
                                            ].map((l) => (
                                                <TableRow key={l.ligne}>
                                                    <TableCell>{l.action}</TableCell>
                                                    <TableCell>
                                                        {l.prenom} {l.nom}
                                                        <Typography variant="body2" color="text.secondary">
                                                            {l.email}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{l.parcoursNom}</TableCell>
                                                    <TableCell>{l.boursier ? 'Oui' : 'Non'}</TableCell>
                                                    <TableCell>{l.cotisationPayee ? 'Payée' : 'Non payée'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onFermer} color="inherit">
                    Annuler
                </Button>
                <Button
                    variant="contained"
                    disabled={
                        !csv ||
                        !apercu ||
                        apercu.erreurs.length > 0 ||
                        apercu.aCreer.length + apercu.aMettreAJour.length === 0 ||
                        importer.isPending
                    }
                    onClick={() => csv && importer.mutate(csv)}
                >
                    Importer
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export { Etudiants, Compteurs };
