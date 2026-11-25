import { Autocomplete, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import type { candidatType } from '../types';

// Recherche d'un étudiant et bouton d'action. Entrée valide directement l'étudiant surligné ; un
// clic dans la liste le sélectionne seulement (le bouton confirme).
function ChampEtudiant(props: {
    candidats: candidatType[];
    libelle: string;
    bouton: string;
    discret?: boolean;
    enCours: boolean;
    onValider: (etudiantId: string, onSuccess: () => void) => void;
}) {
    const [candidat, setCandidat] = useState<candidatType | null>(null);
    const [listeOuverte, setListeOuverte] = useState(false);
    const tries = [...props.candidats].sort(
        (a, b) =>
            Number(!!a.raisonMessage) - Number(!!b.raisonMessage) || a.nom.localeCompare(b.nom, 'fr'),
    );
    const valider = (choisi: candidatType | null) => {
        if (choisi && !choisi.raisonMessage && !props.enCours) {
            props.onValider(choisi.id, () => setCandidat(null));
        }
    };

    return (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Autocomplete
                sx={{ flexGrow: 1 }}
                options={tries}
                value={candidat}
                autoHighlight
                open={listeOuverte}
                onOpen={() => setListeOuverte(true)}
                onClose={() => setListeOuverte(false)}
                onChange={(event, valeur) => {
                    setCandidat(valeur);
                    if (event.type === 'keydown') valider(valeur);
                }}
                onKeyDown={(event) => {
                    // Liste fermée et étudiant déjà sélectionné : Entrée valide aussi.
                    if (event.key === 'Enter' && !listeOuverte && candidat) {
                        event.preventDefault();
                        valider(candidat);
                    }
                }}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                getOptionLabel={(c) => `${c.prenom} ${c.nom} (${c.parcoursNom})`}
                getOptionDisabled={(c) => !!c.raisonMessage}
                renderOption={(optionProps, c) => (
                    <li {...optionProps} key={c.id}>
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
                renderInput={(params) => <TextField {...params} label={props.libelle} />}
            />
            <Button
                variant={props.discret ? 'outlined' : 'contained'}
                disabled={!candidat || props.enCours}
                onClick={() => valider(candidat)}
            >
                {props.bouton}
            </Button>
        </Stack>
    );
}

export { ChampEtudiant };
