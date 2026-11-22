import { Chip } from '@mui/material';

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

export { BadgeParcours };
