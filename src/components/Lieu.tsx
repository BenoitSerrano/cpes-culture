import { IconButton, Link, Tooltip } from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { Fragment, MouseEvent, ReactNode } from 'react';
import { estLienGoogleMaps } from '../lib/lieu';

// Lien Google Maps du lieu, ouvert dans un nouvel onglet.
// compact : icône seule, utilisable à l'intérieur d'une ligne déjà cliquable.
function Lieu({ url, compact }: { url: string | null; compact?: boolean }) {
    if (!url) return null;
    // Ancienne valeur saisie en texte libre : affichée telle quelle.
    if (!estLienGoogleMaps(url)) return <>{url}</>;

    if (compact) {
        const ouvrir = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            window.open(url, '_blank', 'noopener,noreferrer');
        };
        return (
            <Tooltip title="Voir le lieu sur Google Maps">
                <IconButton size="small" onClick={ouvrir} aria-label="Voir le lieu sur Google Maps" sx={{ p: 0.25 }}>
                    <PlaceOutlinedIcon fontSize="inherit" />
                </IconButton>
            </Tooltip>
        );
    }
    return (
        <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="inherit"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, verticalAlign: 'bottom' }}
        >
            <PlaceOutlinedIcon fontSize="inherit" />
            Voir le lieu
        </Link>
    );
}

// Éléments séparés par « · », en ignorant les vides.
function Infos({ children }: { children: ReactNode[] }) {
    const elements = children.filter((element) => element !== null && element !== undefined && element !== '' && element !== false);
    return (
        <>
            {elements.map((element, i) => (
                <Fragment key={i}>
                    {i > 0 && ' · '}
                    {element}
                </Fragment>
            ))}
        </>
    );
}

export { Lieu, Infos };
