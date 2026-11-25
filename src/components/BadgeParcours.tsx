import { Chip, Stack, SxProps, Theme } from '@mui/material';

// Texte noir ou blanc selon la luminance de la couleur, pour rester lisible.
function couleurTexte(hex: string) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return luminance > 0.4 ? '#111111' : '#ffffff';
}

function BadgeParcours(props: { nom: string | null; couleur: string | null; prefixe?: boolean }) {
    if (!props.nom) return null;
    const label = props.prefixe ? `Parcours ${props.nom}` : props.nom;
    if (!props.couleur || !/^#[0-9A-Fa-f]{6}$/.test(props.couleur)) {
        return <Chip label={label} variant="outlined" />;
    }
    return (
        <Chip
            label={label}
            sx={{ bgcolor: props.couleur, color: couleurTexte(props.couleur), fontWeight: 500 }}
        />
    );
}

const COULEUR_BONUS = '#C9DAF8';

// Évènement sans parcours : badge « Bonus », même rendu qu'un badge de parcours.
function BadgeBonus({ sx }: { sx?: SxProps<Theme> }) {
    return (
        <Chip
            label="Bonus"
            sx={[
                { bgcolor: COULEUR_BONUS, color: couleurTexte(COULEUR_BONUS), fontWeight: 500 },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        />
    );
}

// Type d'un évènement vu par un étudiant : Bonus, ou Parcours (avec « Hors parcours » si besoin).
function BadgeEvenement({
    evenement,
}: {
    evenement: {
        bonus: boolean;
        horsParcours: boolean;
        parcoursNom: string | null;
        parcoursCouleur: string | null;
    };
}) {
    if (evenement.bonus) return <BadgeBonus />;
    return (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <BadgeParcours nom={evenement.parcoursNom} couleur={evenement.parcoursCouleur} prefixe />
            {evenement.horsParcours && <Chip label="Hors parcours" variant="outlined" />}
        </Stack>
    );
}

export { BadgeParcours, BadgeBonus, BadgeEvenement };
