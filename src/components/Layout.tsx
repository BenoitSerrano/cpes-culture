import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { tokenStorage } from '../lib/storage';

function Layout(props: {
    liens: { to: string; label: string }[];
    large?: boolean;
    // Nom de l'étudiant quand le prof voit l'application à sa place.
    impersonation?: string;
    children: ReactNode;
}) {
    // Rechargement complet : vide le cache et relit la session.
    const seDeconnecter = () => {
        tokenStorage.remove();
        window.location.assign('/connexion');
    };

    const revenirAdmin = () => {
        const etudiantId = tokenStorage.arreterImpersonation();
        window.location.assign(etudiantId ? `/admin/etudiants/${etudiantId}` : '/admin');
    };

    return (
        <Box sx={{ minHeight: '100vh' }}>
            {props.impersonation && (
                <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    <Container
                        maxWidth={props.large ? 'lg' : 'md'}
                        sx={{ py: 1, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}
                    >
                        <VisibilityOutlinedIcon fontSize="small" />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            Vous voyez l'application comme <strong>{props.impersonation}</strong> (lecture seule).
                        </Typography>
                        <Button size="small" variant="contained" color="inherit" sx={{ color: 'primary.main' }} onClick={revenirAdmin}>
                            Revenir à la vue admin
                        </Button>
                    </Container>
                </Box>
            )}
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
