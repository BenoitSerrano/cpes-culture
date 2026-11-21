import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { api } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { tokenStorage } from '../lib/storage';

function Connexion() {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [etape, setEtape] = useState<'email' | 'code'>('email');

    const demande = useMutation({
        mutationFn: () => api.demanderCode(email.trim()),
        onSuccess: () => setEtape('code'),
    });
    const verification = useMutation({
        mutationFn: () => api.verifierCode(email.trim(), code.trim()),
        onSuccess: ({ token, role }) => {
            tokenStorage.set(token);
            // Rechargement complet : le routeur relit la session.
            window.location.assign(role === 'admin' ? '/admin' : '/');
        },
    });

    const envoyer = (event: FormEvent) => {
        event.preventDefault();
        if (etape === 'email') demande.mutate();
        else verification.mutate();
    };

    const enCours = demande.isPending || verification.isPending;
    const erreur = demande.error ?? verification.error;

    return (
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2 }}>
            <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }} component="form" onSubmit={envoyer}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h1" gutterBottom>
                            Programme culturel
                        </Typography>
                        <Typography color="text.secondary">CPES · Henri IV · PSL</Typography>
                    </Box>

                    {etape === 'email' ? (
                        <TextField
                            label="Adresse e-mail"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            required
                            fullWidth
                            size="medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    ) : (
                        <>
                            <Typography variant="body2" color="text.secondary">
                                Si cette adresse est inscrite au programme, un code à 6 chiffres vient
                                d'être envoyé à <strong>{email.trim()}</strong>. Il est valable 10 minutes.
                            </Typography>
                            <TextField
                                label="Code"
                                autoFocus
                                required
                                fullWidth
                                size="medium"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                slotProps={{
                                    htmlInput: {
                                        inputMode: 'numeric',
                                        autoComplete: 'one-time-code',
                                        style: { letterSpacing: '0.5em', fontSize: '1.25rem' },
                                    },
                                }}
                            />
                        </>
                    )}

                    {erreur && (
                        <Typography color="error" variant="body2">
                            {getErrorMessage(erreur)}
                        </Typography>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={enCours || (etape === 'code' && code.length !== 6)}
                    >
                        {enCours ? 'Un instant…' : etape === 'email' ? 'Recevoir un code' : 'Se connecter'}
                    </Button>

                    {etape === 'code' && (
                        <Button
                            color="inherit"
                            onClick={() => {
                                setEtape('email');
                                setCode('');
                                verification.reset();
                            }}
                        >
                            Changer d'adresse ou renvoyer un code
                        </Button>
                    )}
                    {enCours && etape === 'email' && (
                        <Typography variant="caption" color="text.secondary" textAlign="center">
                            Le premier envoi peut prendre jusqu'à 30 secondes si le serveur dormait.
                        </Typography>
                    )}
                </Stack>
            </Paper>
        </Box>
    );
}

export { Connexion };
