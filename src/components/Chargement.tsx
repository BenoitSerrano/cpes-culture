import { Box, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

// Le serveur (Render) peut mettre ~30 s à se réveiller : on le dit après quelques secondes.
function Chargement() {
    const [lent, setLent] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setLent(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }}>
            <CircularProgress size={28} />
            {lent && (
                <Typography color="text.secondary" variant="body2" textAlign="center">
                    Le serveur se réveille, cela peut prendre jusqu'à 30 secondes…
                </Typography>
            )}
        </Box>
    );
}

export { Chargement };
