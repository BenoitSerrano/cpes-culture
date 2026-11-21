import { Box, Button, Divider, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useQuery } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chargement } from '../../components/Chargement';
import { Erreur } from '../../components/Erreur';
import { api } from '../../lib/api';
import { useAction } from '../../lib/useAction';
import type { parcoursType } from '../../types';

function Parcours() {
    const parcours = useQuery({ queryKey: ['admin', 'parcours'], queryFn: api.getParcours });
    const [nom, setNom] = useState('');
    const [edite, setEdite] = useState<{ id: string; nom: string }>();

    const creer = useAction((valeur: string) => api.createParcours(valeur), {
        succes: 'Parcours créé.',
        onSuccess: () => setNom(''),
    });
    const renommer = useAction(({ id, nom }: { id: string; nom: string }) => api.renameParcours(id, nom), {
        succes: 'Parcours renommé.',
        onSuccess: () => setEdite(undefined),
    });
    const supprimer = useAction((id: string) => api.deleteParcours(id), { succes: 'Parcours supprimé.' });

    const ajouter = (event: FormEvent) => {
        event.preventDefault();
        if (nom.trim()) creer.mutate(nom.trim());
    };
    const enregistrer = (event: FormEvent) => {
        event.preventDefault();
        if (edite?.nom.trim()) renommer.mutate({ id: edite.id, nom: edite.nom.trim() });
    };

    return (
        <Stack spacing={3}>
            <Box>
                <Button component={Link} to="/admin/evenements" color="inherit" sx={{ color: 'text.secondary', mb: 1, ml: -1 }}>
                    ← Évènements
                </Button>
                <Typography variant="h1">Parcours</Typography>
            </Box>
            <Stack direction="row" spacing={1} component="form" onSubmit={ajouter}>
                <TextField label="Nouveau parcours" value={nom} onChange={(e) => setNom(e.target.value)} sx={{ flexGrow: 1 }} />
                <Button type="submit" variant="contained" disabled={!nom.trim() || creer.isPending}>
                    Ajouter
                </Button>
            </Stack>

            {parcours.isPending && <Chargement />}
            {parcours.isError && <Erreur error={parcours.error} />}
            {parcours.data?.length === 0 && <Typography color="text.secondary">Aucun parcours.</Typography>}
            {!!parcours.data?.length && (
                <Paper>
                    <Stack divider={<Divider flexItem />}>
                        {parcours.data.map((p: parcoursType) => (
                            <Box key={p.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                {edite?.id === p.id ? (
                                    <Stack direction="row" spacing={1} component="form" onSubmit={enregistrer} sx={{ flexGrow: 1 }}>
                                        <TextField
                                            autoFocus
                                            value={edite.nom}
                                            onChange={(e) => setEdite({ id: p.id, nom: e.target.value })}
                                            sx={{ flexGrow: 1 }}
                                        />
                                        <Button type="submit" variant="contained" disabled={renommer.isPending}>
                                            Enregistrer
                                        </Button>
                                        <Button color="inherit" onClick={() => setEdite(undefined)}>
                                            Annuler
                                        </Button>
                                    </Stack>
                                ) : (
                                    <>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography fontWeight={500}>{p.nom}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {p.nbEtudiants} étudiant(s) · {p.nbEvenements} évènement(s)
                                            </Typography>
                                        </Box>
                                        <Tooltip title="Renommer">
                                            <IconButton size="small" onClick={() => setEdite({ id: p.id, nom: p.nom })}>
                                                <EditOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip
                                            title={
                                                p.nbEtudiants + p.nbEvenements > 0
                                                    ? 'Impossible : des étudiants ou évènements y sont rattachés'
                                                    : 'Supprimer'
                                            }
                                        >
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    disabled={p.nbEtudiants + p.nbEvenements > 0 || supprimer.isPending}
                                                    onClick={() => supprimer.mutate(p.id)}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </>
                                )}
                            </Box>
                        ))}
                    </Stack>
                </Paper>
            )}
        </Stack>
    );
}

export { Parcours };
