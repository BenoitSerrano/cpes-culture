import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { Box, Typography } from '@mui/material';

// Lieu de rendez-vous de l'évènement (texte libre, plusieurs lignes possibles).
function RendezVous({ texte }: { texte: string | null }) {
    if (!texte) return null;
    return (
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start', mt: 0.5 }}>
            <FlagOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', mt: '2px' }} />
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                <Box component="span" sx={{ fontWeight: 600 }}>
                    Rendez-vous :
                </Box>{' '}
                {texte}
            </Typography>
        </Box>
    );
}

export { RendezVous };
