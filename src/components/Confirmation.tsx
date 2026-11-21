import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { ReactNode } from 'react';

function Confirmation(props: {
    ouvert: boolean;
    titre: string;
    children: ReactNode;
    libelle: string;
    danger?: boolean;
    enCours?: boolean;
    onConfirmer: () => void;
    onAnnuler: () => void;
}) {
    return (
        <Dialog open={props.ouvert} onClose={props.onAnnuler} maxWidth="xs" fullWidth>
            <DialogTitle>{props.titre}</DialogTitle>
            <DialogContent>{props.children}</DialogContent>
            <DialogActions>
                <Button onClick={props.onAnnuler} color="inherit">
                    Annuler
                </Button>
                <Button
                    variant="contained"
                    color={props.danger ? 'error' : 'primary'}
                    onClick={props.onConfirmer}
                    disabled={props.enCours}
                >
                    {props.libelle}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export { Confirmation };
