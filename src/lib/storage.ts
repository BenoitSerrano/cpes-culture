const KEY = 'CPES_JWT';

function get() {
    try {
        return localStorage.getItem(KEY) || undefined;
    } catch {
        return undefined;
    }
}

function set(value: string) {
    localStorage.setItem(KEY, value);
}

function remove() {
    try {
        localStorage.removeItem(KEY);
    } catch {
        // Stockage indisponible : rien à supprimer.
    }
}

const tokenStorage = { get, set, remove };

export { tokenStorage };
