import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    ListItemIcon,
    Menu,
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
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery } from '@tanstack/react-query';
import { ChangeEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgeParcours } from '../../components/BadgeParcours';
import { Chargement } from '../../components/Chargement';
import { Pertes } from '../../components/Pertes';
import { BadgeBonusBloque } from '../../components/SituationBonus';
import { Confirmation } from '../../components/Confirmation';
import { Erreur } from '../../components/Erreur';
import { api } from '../../lib/api';
import { useTri } from '../../lib/tri';
import { formatJour, getAujourdhui } from '../../lib/format';
import { useAction } from '../../lib/useAction';
import { useActionConfirmee } from '../../lib/useActionConfirmee';
import type {
    apercuImportType,
    celluleRecapitulatifType,
    etudiantAdminType,
    etudiantDtoType,
    statutRecapitulatifType,
} from '../../types';
import { FormulaireCreationEtudiant } from './formulaires';

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
    const [creation, setCreation] = useState(false);
    const [importOuvert, setImportOuvert] = useState(false);
    const [menuAjout, setMenuAjout] = useState<HTMLElement | null>(null);
    const [cotisationAChanger, setCotisationAChanger] = useState<etudiantAdminType>();

    const creer = useAction((dto: etudiantDtoType) => api.createEtudiant(dto), {
        succes: 'Étudiant ajouté.',
        onSuccess: () => setCreation(false),
    });
    const [datePaiement, setDatePaiement] = useState(getAujourdhui);
    const basculerCotisation = useActionConfirmee(
        ({ id, jour }: { id: string; jour: string }, confirme) =>
            api.updateEtudiant(id, { cotisationPayeeLe: jour }, confirme),
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
                correspond(cotisation, e.cotisationPayeeLe !== null),
        );
    }, [etudiants.data, recherche, parcoursId, cotisation]);

    const colonnesTri: Record<string, (e: etudiantAdminType) => string | number | boolean | null> = {
        // Nom et prénom séparés : tri alphabétique par l'un ou par l'autre.
        nom: (e) => `${e.nom} ${e.prenom}`,
        prenom: (e) => `${e.prenom} ${e.nom}`,
        parcours: (e) => e.parcoursNom,
        statut: (e) => e.boursier,
        cotisation: (e) => e.cotisationPayeeLe,
        // Tri par nombre de problèmes (non-inscriptions + absences injustifiées).
        presences: (e) => e.nbNonInscrit + e.nbAbsentSansJustificatif,
    };
    for (const evenement of colonnesEvenements) {
        colonnesTri[`evenement:${evenement.id}`] = (e) => {
            const statut = recapitulatif.data?.cellules[e.id]?.[evenement.id]?.statut;
            return statut ? ORDRE_STATUTS_RECAPITULATIF.indexOf(statut) : null;
        };
    }
    const tri = useTri(filtres, colonnesTri, { cle: 'prenom' });

    return (
        <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h1">Étudiants</Typography>
                <Tooltip title="Ajouter des étudiants">
                    <IconButton
                        aria-label="Ajouter des étudiants"
                        aria-haspopup="menu"
                        onClick={(event) => setMenuAjout(event.currentTarget)}
                        sx={{ border: 1, borderColor: 'divider' }}
                    >
                        <AddIcon />
                    </IconButton>
                </Tooltip>
                <Menu
                    anchorEl={menuAjout}
                    open={!!menuAjout}
                    onClose={() => setMenuAjout(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <MenuItem
                        onClick={() => {
                            setMenuAjout(null);
                            setCreation(true);
                        }}
                    >
                        <ListItemIcon>
                            <PersonAddOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        Ajouter un étudiant
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            setMenuAjout(null);
                            setImportOuvert(true);
                        }}
                    >
                        <ListItemIcon>
                            <UploadFileOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        Importer un CSV
                    </MenuItem>
                </Menu>
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
                                    {tri.enTete('nom', 'Nom')}
                                    {tri.enTete('prenom', 'Prénom')}
                                    {!parcoursId && tri.enTete('parcours', 'Parcours')}
                                    {tri.enTete('statut', 'Statut')}
                                    {tri.enTete('cotisation', 'Cotisation')}
                                    {!parcoursId && tri.enTete('presences', 'Récapitulatif')}
                                    {colonnesEvenements.map((evenement) =>
                                        tri.enTete(
                                            `evenement:${evenement.id}`,
                                            <Tooltip title={evenement.nom}>
                                                <span>{evenement.slug}</span>
                                            </Tooltip>,
                                            { sx: { whiteSpace: 'nowrap' } },
                                        ),
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tri.lignes.map((e) => (
                                    <TableRow key={e.id} hover>
                                        <TableCell>
                                            <Link to={`/admin/etudiants/${e.id}`}>{e.nom}</Link>
                                            <Typography variant="body2" color="text.secondary">
                                                {e.email}
                                            </Typography>
                                            {e.bonusBloque && <BadgeBonusBloque />}
                                        </TableCell>
                                        <TableCell>
                                            <Link to={`/admin/etudiants/${e.id}`}>{e.prenom}</Link>
                                        </TableCell>
                                        {!parcoursId && (
                                            <TableCell>
                                                <BadgeParcours nom={e.parcoursNom} couleur={e.parcoursCouleur} />
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            {e.boursier ? 'Boursier' : null}
                                        </TableCell>
                                        <TableCell>
                                            {/* Une cotisation payée ne redevient jamais « non payée ». */}
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ whiteSpace: 'nowrap' }}>
                                                <OuiNon valeur={e.cotisationPayeeLe !== null} label="Cotisation payée" />
                                                <Typography variant="body2">
                                                    {e.cotisationPayeeLe
                                                        ? `Payée le ${formatJour(e.cotisationPayeeLe)}`
                                                        : 'Non payée'}
                                                </Typography>
                                                {e.cotisationPayeeLe === null && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        disabled={basculerCotisation.isPending}
                                                        onClick={() => {
                                                            setDatePaiement(getAujourdhui());
                                                            setCotisationAChanger(e);
                                                        }}
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
                                                    nonInscrit={e.nbNonInscrit}
                                                    abj={e.nbAbsentAvecJustificatif}
                                                    abi={e.nbAbsentSansJustificatif}
                                                />
                                            </TableCell>
                                        )}
                                        {colonnesEvenements.map((evenement) => {
                                            const cellule = recapitulatif.data?.cellules[e.id]?.[evenement.id];
                                            return (
                                                <TableCell key={evenement.id}>
                                                    {cellule && <StatutRecapitulatif cellule={cellule} />}
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
                <FormulaireCreationEtudiant
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
                enCours={basculerCotisation.isPending || !datePaiement}
                onAnnuler={() => setCotisationAChanger(undefined)}
                onConfirmer={() =>
                    cotisationAChanger &&
                    datePaiement &&
                    basculerCotisation.mutate({ id: cotisationAChanger.id, jour: datePaiement })
                }
            >
                <Stack spacing={2}>
                    <Typography>
                        {cotisationAChanger?.prenom} {cotisationAChanger?.nom} pourra s’inscrire aux sorties.
                    </Typography>
                    <TextField
                        label="Date de paiement"
                        type="date"
                        required
                        value={datePaiement}
                        onChange={(event) => setDatePaiement(event.target.value)}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: getAujourdhui() } }}
                    />
                </Stack>
            </Confirmation>
            {basculerCotisation.dialogue}
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
            // « Tous » vaut '' : sans ça, MUI masque la valeur et laisse le libellé dans le champ,
            // où il passe sous la flèche.
            slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
            sx={{ minWidth: 180 }}
        >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="oui">Oui</MenuItem>
            <MenuItem value="non">Non</MenuItem>
        </TextField>
    );
}

const COULEURS_RECAPITULATIF = {
    ok: { bg: '#16A34A', fg: '#fff' },
    ni: { bg: '#DC2626', fg: '#fff' },
    abj: { bg: '#FACC15', fg: '#111' },
    abi: { bg: '#DC2626', fg: '#fff' },
    exempte: { bg: '#9CA3AF', fg: '#111' },
};

// Ordre de tri : du plus problématique au plus satisfaisant.
const ORDRE_STATUTS_RECAPITULATIF: statutRecapitulatifType[] = [
    'ni',
    'abi',
    'pas_inscrit',
    'non_pointe',
    'ni_exempte',
    'abj',
    'ok',
];

const STATUTS_RECAPITULATIF: Record<
    statutRecapitulatifType,
    { label: string; titre: string; couleur?: { bg: string; fg: string } }
> = {
    ni: { label: 'NI', titre: 'Non inscrit, inscriptions closes', couleur: COULEURS_RECAPITULATIF.ni },
    ni_exempte: { label: 'NI', titre: 'Non inscrit, sans faute', couleur: COULEURS_RECAPITULATIF.exempte },
    pas_inscrit: { label: 'Pas inscrit', titre: 'Les inscriptions sont encore ouvertes' },
    non_pointe: { label: 'Non-pointé', titre: 'Inscrit, présence pas encore pointée' },
    abj: { label: 'ABJ', titre: 'Absent avec justificatif', couleur: { bg: '#FACC15', fg: '#111' } },
    abi: { label: 'ABI', titre: 'Absent sans justificatif', couleur: { bg: '#DC2626', fg: '#fff' } },
    ok: { label: 'OK', titre: 'Présent', couleur: { bg: '#16A34A', fg: '#fff' } },
};

function StatutRecapitulatif({ cellule }: { cellule: celluleRecapitulatifType }) {
    const { label, titre, couleur } = STATUTS_RECAPITULATIF[cellule.statut];
    return (
        <Chip
            label={label}
            title={cellule.detail ? `Pas une faute : ${cellule.detail}` : titre}
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

// Récapitulatif d'un étudiant : présences (coche verte), NI, ABJ, ABI. Mêmes codes et couleurs
// que les cases du récapitulatif par parcours ; les compteurs à zéro sont atténués.
function Compteurs(props: { present: number; nonInscrit: number; abj: number; abi: number }) {
    const pastille = (label: string, titre: string, valeur: number, couleur: { bg: string; fg: string }) => (
        <Box
            component="span"
            title={titre}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, opacity: valeur > 0 ? 1 : 0.35 }}
        >
            <Box
                component="span"
                sx={{ bgcolor: couleur.bg, color: couleur.fg, fontWeight: 600, fontSize: 11, px: 0.75, borderRadius: 1 }}
            >
                {label}
            </Box>
            {valeur}
        </Box>
    );
    return (
        <Typography variant="body2" component="span" sx={{ display: 'inline-flex', gap: 1.5, alignItems: 'center' }}>
            <Box
                component="span"
                title="Présences pointées"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, opacity: props.present > 0 ? 1 : 0.35 }}
            >
                <CheckIcon fontSize="small" sx={{ color: COULEURS_RECAPITULATIF.ok.bg }} />
                {props.present}
            </Box>
            {pastille('NI', 'Non inscrit', props.nonInscrit, COULEURS_RECAPITULATIF.ni)}
            {pastille('ABJ', 'Absence justifiée', props.abj, COULEURS_RECAPITULATIF.abj)}
            {pastille('ABI', 'Absence injustifiée', props.abi, COULEURS_RECAPITULATIF.abi)}
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

    const lignesApercu = useMemo(
        () => [
            ...(apercu?.aCreer ?? []).map((l) => ({ ...l, action: 'Création' })),
            ...(apercu?.aMettreAJour ?? []).map((l) => ({ ...l, action: 'Mise à jour' })),
        ],
        [apercu],
    );
    const triApercu = useTri(lignesApercu, {
        action: (l) => l.action,
        etudiant: (l) => `${l.nom} ${l.prenom}`,
        parcours: (l) => l.parcoursNom,
        boursier: (l) => l.boursier,
        cotisation: (l) => l.cotisationPayeeLe,
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
                        Colonnes attendues : <code>nom, prenom, email, parcours, boursier, cotisation_payee_le</code>{' '}
                        (séparateur « ; » ou « , »). Le parcours est désigné par son nom, boursier vaut oui ou
                        non, et cotisation_payee_le est une date (JJ/MM/AAAA) ou reste vide. Pour un e-mail
                        déjà connu, seuls le nom, le prénom et une date de paiement manquante sont mis à jour.
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
                            {apercu.erreurs.length === 0 && apercu.pertes.length > 0 && (
                                <Pertes pertes={apercu.pertes} />
                            )}
                            {apercu.erreurs.length === 0 && (
                                <TableContainer component={Paper} sx={{ maxHeight: 320 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                {triApercu.enTete('action', 'Action')}
                                                {triApercu.enTete('etudiant', 'Étudiant')}
                                                {triApercu.enTete('parcours', 'Parcours')}
                                                {triApercu.enTete('boursier', 'Boursier')}
                                                {triApercu.enTete('cotisation', 'Cotisation')}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {triApercu.lignes.map((l) => (
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
                                                    <TableCell>
                                                        {l.cotisationPayeeLe
                                                            ? `Payée le ${formatJour(l.cotisationPayeeLe)}`
                                                            : 'Non payée'}
                                                    </TableCell>
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
