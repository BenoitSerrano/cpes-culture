import type { perteType } from '../types';

class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
    ) {
        super(message);
    }
}

// Refus de l'API tant que le prof n'a pas confirmé les bonus que son action ferait perdre.
function getPertes(error: unknown): perteType[] | undefined {
    if (!(error instanceof ApiError) || error.status !== 409) return undefined;
    try {
        const contenu = JSON.parse(error.message);
        return contenu.code === 'PERTES_BONUS' ? contenu.pertes : undefined;
    } catch {
        return undefined;
    }
}

function getErrorMessage(error: unknown) {
    if (error instanceof ApiError) return error.message;
    if (error instanceof TypeError) return 'Impossible de joindre le serveur. Réessayez.';
    return 'Une erreur est survenue.';
}

export { ApiError, getErrorMessage, getPertes };
