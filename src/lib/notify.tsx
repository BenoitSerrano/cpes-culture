import { Alert, Snackbar } from '@mui/material';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

type niveauType = 'success' | 'error' | 'info';
type notifyType = (message: string, niveau?: niveauType) => void;

const NotifyContext = createContext<notifyType>(() => {});

function NotifyProvider({ children }: { children: ReactNode }) {
    const [etat, setEtat] = useState<{ message: string; niveau: niveauType; cle: number }>();
    const notify = useCallback<notifyType>((message, niveau = 'success') => {
        setEtat({ message, niveau, cle: Date.now() });
    }, []);

    return (
        <NotifyContext.Provider value={notify}>
            {children}
            <Snackbar
                key={etat?.cle}
                open={!!etat}
                autoHideDuration={etat?.niveau === 'error' ? 8000 : 4000}
                onClose={() => setEtat(undefined)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={etat?.niveau} variant="filled" onClose={() => setEtat(undefined)}>
                    {etat?.message}
                </Alert>
            </Snackbar>
        </NotifyContext.Provider>
    );
}

function useNotify() {
    return useContext(NotifyContext);
}

export { NotifyProvider, useNotify };
