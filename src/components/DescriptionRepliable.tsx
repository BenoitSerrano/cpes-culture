import { Box, Button, Typography } from '@mui/material';
import { useLayoutEffect, useRef, useState } from 'react';

// Description limitée à `lignes` lignes (0 : repliée) ; « Voir plus » seulement s'il reste du texte.
function DescriptionRepliable({ texte, lignes }: { texte: string | null; lignes: number }) {
    const ref = useRef<HTMLElement>(null);
    const [ouvert, setOuvert] = useState(false);
    const [coupe, setCoupe] = useState(lignes === 0);
    useLayoutEffect(() => {
        if (lignes === 0 || ouvert) return;
        const mesurer = () => {
            if (ref.current) setCoupe(ref.current.scrollHeight > ref.current.clientHeight + 1);
        };
        mesurer();
        window.addEventListener('resize', mesurer);
        return () => window.removeEventListener('resize', mesurer);
    }, [texte, lignes, ouvert]);

    if (!texte) return null;
    return (
        <Box sx={{ mt: 1 }}>
            {(ouvert || lignes > 0) && (
                <Typography
                    ref={ref}
                    sx={{
                        whiteSpace: 'pre-line',
                        ...(!ouvert && {
                            display: '-webkit-box',
                            WebkitLineClamp: lignes,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }),
                    }}
                >
                    {texte}
                </Typography>
            )}
            {coupe && (
                <Button
                    size="small"
                    color="inherit"
                    aria-expanded={ouvert}
                    sx={{ color: 'text.secondary', ml: -0.75 }}
                    onClick={() => setOuvert(!ouvert)}
                >
                    {ouvert ? 'Voir moins' : 'Voir plus'}
                </Button>
            )}
        </Box>
    );
}

export { DescriptionRepliable };
