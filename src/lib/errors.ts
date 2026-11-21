class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
    ) {
        super(message);
    }
}

function getErrorMessage(error: unknown) {
    if (error instanceof ApiError) return error.message;
    if (error instanceof TypeError) return 'Impossible de joindre le serveur. Réessayez.';
    return 'Une erreur est survenue.';
}

export { ApiError, getErrorMessage };
