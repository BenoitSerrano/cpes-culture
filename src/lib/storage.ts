const KEY = 'CPES_JWT';
// Pendant que le prof voit l'application comme un étudiant : son jeton admin mis de côté
// et l'étudiant consulté (pour y revenir).
const ADMIN_KEY = 'CPES_ADMIN_JWT';
const IMPERSONATED_KEY = 'CPES_IMPERSONATED_ID';

function lire(key: string) {
    try {
        return localStorage.getItem(key) || undefined;
    } catch {
        return undefined;
    }
}

function supprimer(key: string) {
    try {
        localStorage.removeItem(key);
    } catch {
        // Stockage indisponible : rien à supprimer.
    }
}

function get() {
    return lire(KEY);
}

function set(value: string) {
    localStorage.setItem(KEY, value);
}

function remove() {
    supprimer(KEY);
    supprimer(ADMIN_KEY);
    supprimer(IMPERSONATED_KEY);
}

function demarrerImpersonation(tokenEtudiant: string, etudiantId: string) {
    const tokenAdmin = get();
    if (!tokenAdmin) return;
    localStorage.setItem(ADMIN_KEY, tokenAdmin);
    localStorage.setItem(IMPERSONATED_KEY, etudiantId);
    set(tokenEtudiant);
}

function estEnImpersonation() {
    return !!lire(ADMIN_KEY);
}

// Restaure le jeton admin ; renvoie l'étudiant qui était consulté.
function arreterImpersonation() {
    const tokenAdmin = lire(ADMIN_KEY);
    const etudiantId = lire(IMPERSONATED_KEY);
    if (tokenAdmin) set(tokenAdmin);
    supprimer(ADMIN_KEY);
    supprimer(IMPERSONATED_KEY);
    return etudiantId;
}

const tokenStorage = { get, set, remove, demarrerImpersonation, estEnImpersonation, arreterImpersonation };

export { tokenStorage };
