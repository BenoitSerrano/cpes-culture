import { Box, Button, Divider, Paper, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Chargement } from '../../components/Chargement';
import { Erreur } from '../../components/Erreur';
import { Infos, Lieu } from '../../components/Lieu';
import { api } from '../../lib/api';
import { formatDateHeure } from '../../lib/format';

function AccueilAdmin() {
    const aPointer = useQuery({ queryKey: ['admin', 'sorties-a-pointer'], queryFn: api.getSortiesAPointer });

    return (
        <Stack spacing={3}>
            <Typography variant="h1">Accueil</Typography>
            <Typography variant="h2">Sorties à pointer</Typography>
            {aPointer.isPending && <Chargement />}
            {aPointer.isError && <Erreur error={aPointer.error} />}
            {aPointer.data?.length === 0 && (
                <Typography color="text.secondary">Toutes les sorties passées sont pointées.</Typography>
            )}
            {!!aPointer.data?.length && (
                <Paper>
                    <Stack divider={<Divider flexItem />}>
                        {aPointer.data.map((sortie) => (
                            <Box
                                key={sortie.id}
                                sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}
                            >
                                <Box>
                                    <Typography fontWeight={500}>{sortie.evenementNom}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <Infos>
                                            {[
                                                sortie.institution,
                                                sortie.lieu && <Lieu url={sortie.lieu} />,
                                                formatDateHeure(sortie.debut),
                                            ]}
                                        </Infos>
                                    </Typography>
                                    <Typography variant="body2" color="warning.main">
                                        {sortie.nbNonPointes} inscrit(s) pas encore pointé(s)
                                    </Typography>
                                </Box>
                                <Button variant="outlined" component={Link} to={`/admin/sorties/${sortie.id}`}>
                                    Pointer
                                </Button>
                            </Box>
                        ))}
                    </Stack>
                </Paper>
            )}
        </Stack>
    );
}

export { AccueilAdmin };
