import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from './errors';
import { useNotify } from './notify';

// Mutation qui rafraîchit toutes les données et affiche le résultat.
function useAction<argsT, resultT>(
    action: (args: argsT) => Promise<resultT>,
    options: {
        succes?: string | ((result: resultT) => string | undefined);
        onSuccess?: (result: resultT) => void;
        // Renvoie true si l'erreur est prise en charge (elle n'est alors pas affichée).
        onError?: (error: unknown, args: argsT) => boolean;
    } = {},
) {
    const queryClient = useQueryClient();
    const notify = useNotify();
    return useMutation({
        mutationFn: action,
        // onSuccess d'abord : après une suppression, on quitte la page avant de rafraîchir.
        onSuccess: (result) => {
            options.onSuccess?.(result);
            if (options.succes) {
                const message = typeof options.succes === 'function' ? options.succes(result) : options.succes;
                if (message) notify(message);
            }
            return queryClient.invalidateQueries();
        },
        onError: (error, args) => {
            if (!options.onError?.(error, args)) notify(getErrorMessage(error), 'error');
        },
    });
}

export { useAction };
