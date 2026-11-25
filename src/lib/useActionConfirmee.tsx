import { useState } from 'react';
import { Confirmation } from '../components/Confirmation';
import { Pertes } from '../components/Pertes';
import type { perteType } from '../types';
import { getPertes } from './errors';
import { useAction } from './useAction';

// Action du prof qui peut faire perdre des bonus : l'API la refuse d'abord en donnant la liste, on
// la fait confirmer, puis on la relance. `dialogue` est à afficher dans la page.
function useActionConfirmee<argsT, resultT>(
    action: (args: argsT, confirme: boolean) => Promise<resultT>,
    options: {
        succes?: string | ((result: resultT) => string | undefined);
        onSuccess?: (result: resultT) => void;
    } = {},
) {
    const [aConfirmer, setAConfirmer] = useState<{ args: argsT; pertes: perteType[] }>();
    const mutation = useAction(
        ({ args, confirme }: { args: argsT; confirme: boolean }) => action(args, confirme),
        {
            succes: options.succes,
            onSuccess: (result) => {
                setAConfirmer(undefined);
                options.onSuccess?.(result);
            },
            onError: (error, { args }) => {
                const pertes = getPertes(error);
                setAConfirmer(pertes && { args, pertes });
                return !!pertes;
            },
        },
    );

    const dialogue = (
        <Confirmation
            ouvert={!!aConfirmer}
            titre="Des bonus vont être perdus"
            libelle="Continuer quand même"
            danger
            enCours={mutation.isPending}
            onAnnuler={() => setAConfirmer(undefined)}
            onConfirmer={() => aConfirmer && mutation.mutate({ args: aConfirmer.args, confirme: true })}
        >
            {aConfirmer && <Pertes pertes={aConfirmer.pertes} />}
        </Confirmation>
    );

    return {
        mutate: (args: argsT) => mutation.mutate({ args, confirme: false }),
        isPending: mutation.isPending,
        dialogue,
    };
}

export { useActionConfirmee };
