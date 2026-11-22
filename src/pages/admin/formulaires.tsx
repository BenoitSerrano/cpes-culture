import {
    Alert,
    Autocomplete,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    MenuItem,
    Stack,
    Switch,
    TextField,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { FormEvent, ReactNode, useState } from 'react';
import { api, evenementDtoType, sortieDtoType } from '../../lib/api';
import { isoVersSaisie, saisieVersIso } from '../../lib/format';
import { estLienGoogleMaps } from '../../lib/lieu';
import type { etudiantDtoType } from '../../types';

function FormulaireDialog(props: {
    ouvert: boolean;
    titre: string;
    enCours: boolean;
    onFermer: () => void;
    onValider: () => void;
    children: ReactNode;
}) {
    const valider = (event: FormEvent) => {
        event.preventDefault();
        props.onValider();
    };
    return (
        <Dialog open={props.ouvert} onClose={props.onFermer} maxWidth="sm" fullWidth>
            <form onSubmit={valider}>
                <DialogTitle>{props.titre}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {props.children}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={props.onFermer} color="inherit">
                        Annuler
                    </Button>
                    <Button type="submit" variant="contained" disabled={props.enCours}>
                        Enregistrer
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

function useParcoursOptions() {
    return useQuery({ queryKey: ['admin', 'parcours'], queryFn: api.getParcours }).data ?? [];
}

function useInstitutions() {
    const evenements = useQuery({ queryKey: ['admin', 'evenements'], queryFn: api.getEvenements });
    const institutions = (evenements.data ?? []).map((e) => e.institution).filter((i): i is string => !!i);
    return Array.from(new Set(institutions)).sort((a, b) =>
        a.localeCompare(b, 'fr'),
    );
}

function FormulaireEvenement(props: {
    titre: string;
    initial?: evenementDtoType;
    parcoursVerrouille?: boolean;
    enCours: boolean;
    onFermer: () => void;
    onValider: (dto: evenementDtoType) => void;
}) {
    const parcours = useParcoursOptions();
    const institutions = useInstitutions();
    const [dto, setDto] = useState<evenementDtoType>(
        props.initial ?? { nom: '', institution: '', description: '', lieu: '', parcoursId: null },
    );
    const lieuInvalide = !!dto.lieu?.trim() && !estLienGoogleMaps(dto.lieu);

    return (
        <FormulaireDialog
            ouvert
            titre={props.titre}
            enCours={props.enCours || lieuInvalide}
            onFermer={props.onFermer}
            onValider={() =>
                props.onValider({
                    ...dto,
                    institution: dto.institution?.trim() || null,
                    description: dto.description || null,
                    lieu: dto.lieu?.trim() || null,
                })
            }
        >
            <TextField
                label="Nom"
                required
                autoFocus
                value={dto.nom}
                onChange={(e) => setDto({ ...dto, nom: e.target.value })}
            />
            <Autocomplete
                freeSolo
                options={institutions}
                inputValue={dto.institution ?? ''}
                onInputChange={(_e, institution) => setDto({ ...dto, institution })}
                renderInput={(params) => <TextField {...params} label="Institution (facultatif)" />}
            />
            <TextField
                label="Lien Google Maps du lieu (facultatif)"
                type="url"
                placeholder="https://maps.app.goo.gl/…"
                value={dto.lieu ?? ''}
                error={lieuInvalide}
                helperText={
                    lieuInvalide
                        ? 'Collez un lien Google Maps (bouton « Partager » dans Google Maps).'
                        : "Commun à toutes les sorties de l'évènement."
                }
                onChange={(e) => setDto({ ...dto, lieu: e.target.value })}
            />
            <TextField
                label="Parcours"
                select
                value={dto.parcoursId ?? ''}
                disabled={props.parcoursVerrouille}
                helperText={
                    props.parcoursVerrouille
                        ? "L'évènement est ouvert : son parcours ne peut plus changer."
                        : 'Sans parcours, l’évènement est un bonus ouvert à tous.'
                }
                onChange={(e) => setDto({ ...dto, parcoursId: e.target.value || null })}
            >
                <MenuItem value="">Aucun (bonus)</MenuItem>
                {parcours.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                        {p.nom}
                    </MenuItem>
                ))}
            </TextField>
            <TextField
                label="Description"
                multiline
                minRows={3}
                value={dto.description ?? ''}
                onChange={(e) => setDto({ ...dto, description: e.target.value })}
            />
        </FormulaireDialog>
    );
}

function FormulaireSortie(props: {
    titre: string;
    initial?: sortieDtoType;
    placesMin?: number;
    enCours: boolean;
    onFermer: () => void;
    onValider: (dto: sortieDtoType) => void;
}) {
    const [debut, setDebut] = useState(props.initial ? isoVersSaisie(props.initial.debut) : '');
    const [places, setPlaces] = useState(String(props.initial?.places ?? ''));
    const placesMin = Math.max(1, props.placesMin ?? 1);

    return (
        <FormulaireDialog
            ouvert
            titre={props.titre}
            enCours={props.enCours}
            onFermer={props.onFermer}
            onValider={() =>
                props.onValider({ debut: saisieVersIso(debut), places: Number(places) })
            }
        >
            <TextField
                label="Date et heure (heure de Paris)"
                type="datetime-local"
                required
                value={debut}
                onChange={(e) => setDebut(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
                label="Nombre de places"
                type="number"
                required
                value={places}
                onChange={(e) => setPlaces(e.target.value)}
                slotProps={{ htmlInput: { min: placesMin, step: 1 } }}
                helperText={placesMin > 1 ? `Au moins ${placesMin} (nombre d'inscrits).` : undefined}
            />
        </FormulaireDialog>
    );
}

function FormulaireEtudiant(props: {
    titre: string;
    initial?: etudiantDtoType;
    enCours: boolean;
    onFermer: () => void;
    onValider: (dto: etudiantDtoType) => void;
}) {
    const parcours = useParcoursOptions();
    const [dto, setDto] = useState<etudiantDtoType>(
        props.initial ?? {
            nom: '',
            prenom: '',
            email: '',
            parcoursId: '',
            boursier: false,
            cotisationPayee: false,
        },
    );

    return (
        <FormulaireDialog
            ouvert
            titre={props.titre}
            enCours={props.enCours}
            onFermer={props.onFermer}
            onValider={() => props.onValider(dto)}
        >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                    label="Prénom"
                    required
                    fullWidth
                    autoFocus
                    value={dto.prenom}
                    onChange={(e) => setDto({ ...dto, prenom: e.target.value })}
                />
                <TextField
                    label="Nom"
                    required
                    fullWidth
                    value={dto.nom}
                    onChange={(e) => setDto({ ...dto, nom: e.target.value })}
                />
            </Stack>
            <TextField
                label="Adresse e-mail"
                type="email"
                required
                value={dto.email}
                onChange={(e) => setDto({ ...dto, email: e.target.value })}
            />
            <TextField
                label="Parcours"
                select
                required
                value={dto.parcoursId}
                onChange={(e) => setDto({ ...dto, parcoursId: e.target.value })}
            >
                {parcours.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                        {p.nom}
                    </MenuItem>
                ))}
            </TextField>
            <FormControlLabel
                control={
                    <Switch checked={dto.boursier} onChange={(e) => setDto({ ...dto, boursier: e.target.checked })} />
                }
                label="Boursier"
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={dto.cotisationPayee}
                        onChange={(e) => setDto({ ...dto, cotisationPayee: e.target.checked })}
                    />
                }
                label="Cotisation payée"
            />
            {props.initial?.cotisationPayee && !dto.cotisationPayee && (
                <Alert severity="warning">
                    La cotisation repassera à « non payée » : l'étudiant ne pourra plus s'inscrire aux
                    sorties et verra une alerte sur son accueil.
                </Alert>
            )}
        </FormulaireDialog>
    );
}

export { FormulaireEvenement, FormulaireSortie, FormulaireEtudiant };
