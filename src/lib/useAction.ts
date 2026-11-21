import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from './errors';
import { useNotify } from './notify';

// Mutation qui rafraîchit toutes les données et affiche le résultat.
function useAction<argsT, resultT>(
    action: (args: argsT) => Promise<resultT>,
    options: { succes?: string | ((result: resultT) => string); onSuccess?: (result: resultT) => void } = {},
) {
    const queryClient = useQueryClient();
    const notify = useNotify();
    return useMutation({
        mutationFn: action,
        // onSuccess d'abord : après une suppression, on quitte la page avant de rafraîchir.
        onSuccess: (result) => {
            options.onSuccess?.(result);
            if (options.succes) {
                notify(typeof options.succes === 'function' ? options.succes(result) : options.succes);
            }
            return queryClient.invalidateQueries();
        },
        onError: (error) => notify(getErrorMessage(error), 'error'),
    });
}

export { useAction };
