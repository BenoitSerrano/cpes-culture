import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { tokenStorage } from '../lib/storage';

function Layout(props: { liens: { to: string; label: string }[]; large?: boolean; children: ReactNode }) {
    // Rechargement complet : vide le cache et relit la session.
    const seDeconnecter = () => {
        tokenStorage.remove();
        window.location.assign('/connexion');
    };

    return (
        <Box sx={{ minHeight: '100vh' }}>
            <AppBar position="sticky" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Container maxWidth={props.large ? 'lg' : 'md'}>
                    <Toolbar disableGutters sx={{ gap: 1, flexWrap: 'wrap', py: 1 }}>
                        <Typography sx={{ fontWeight: 600, mr: 2 }}>CPES · Programme culturel</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flexGrow: 1 }}>
                            {props.liens.map((lien) => (
                                <Button
                                    key={lien.to}
                                    component={NavLink}
                                    to={lien.to}
                                    end={lien.to === '/' || lien.to === '/admin'}
                                    color="inherit"
                                    sx={{
                                        color: 'text.secondary',
                                        '&.active': { color: 'text.primary', fontWeight: 600 },
                                    }}
                                >
                                    {lien.label}
                                </Button>
                            ))}
                        </Box>
                        <Button color="inherit" onClick={seDeconnecter} sx={{ color: 'text.secondary' }}>
                            Se déconnecter
                        </Button>
                    </Toolbar>
                </Container>
            </AppBar>
            <Container maxWidth={props.large ? 'lg' : 'md'} sx={{ py: 4 }}>
                {props.children}
            </Container>
        </Box>
    );
}

export { Layout };
