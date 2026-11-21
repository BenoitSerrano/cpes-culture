import { Alert } from '@mui/material';
import { getErrorMessage } from '../lib/errors';

function Erreur({ error }: { error: unknown }) {
    return <Alert severity="error">{getErrorMessage(error)}</Alert>;
}

export { Erreur };
