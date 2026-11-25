import { ApiError } from "./errors";
import { tokenStorage } from "./storage";
import type {
  apercuImportType,
  etudiantAdminType,
  etudiantDtoType,
  etudiantUpdateDtoType,
  etudiantType,
  evenementAdminType,
  evenementDetailType,
  evenementType,
  ficheEtudiantType,
  meType,
  pageSortiesType,
  parcoursType,
  recapitulatifParcoursType,
  sortieAPointerType,
  sortieDetailType,
  sortieType,
  statutPresenceType,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://multi-usage-api.onrender.com/api";
const BASE_URL = `${API_BASE_URL}/cpes`;

type methodType = "GET" | "POST" | "PATCH" | "DELETE";

async function call<dataT>(
  uri: string,
  method: methodType = "GET",
  body?: object,
): Promise<dataT> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = tokenStorage.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const response = await fetch(`${BASE_URL}/${uri}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && token) {
    if (tokenStorage.estEnImpersonation()) {
      // Vue étudiant expirée (ou étudiant supprimé) : retour à la vue admin.
      tokenStorage.arreterImpersonation();
      window.location.assign("/admin/etudiants");
    } else {
      // Session expirée ou compte supprimé : retour à la connexion.
      tokenStorage.remove();
      window.location.assign("/connexion");
    }
  }
  if (!response.ok) {
    const message =
      (await response.text().catch(() => "")) || response.statusText;
    throw new ApiError(message, response.status);
  }
  return response.json();
}

type evenementDtoType = {
  nom: string;
  institution: string | null;
  description: string | null;
  lieu: string | null;
  lieuRendezVous: string | null;
  parcoursId: string | null;
};
type sortieDtoType = { debut: string; places: number };

// Conséquences d'une action du prof : étudiants promus depuis la liste d'attente, et bonus retirés
// à des étudiants bloqués.
type effetsType = { promus: string[]; nbAnnulations: number };

// Le prof a accepté les pertes de bonus que son action entraîne (sinon l'API répond 409 avec la
// liste : cf. useActionConfirmee).
const q = (confirme: boolean) => (confirme ? "?confirme=1" : "");

const api = {
  // Authentification
  demanderCode: (email: string) =>
    call<{ ok: true }>("auth/code", "POST", { email }),
  verifierCode: (email: string, code: string) =>
    call<{ token: string; role: "admin" | "etudiant" }>("auth/verify", "POST", {
      email,
      code,
    }),
  getMe: () => call<meType>("me"),

  // Espace étudiant
  getMesSorties: () => call<pageSortiesType>("moi/sorties"),
  sInscrire: (sortieId: string) =>
    call<{ ok: true }>(`moi/sorties/${sortieId}/inscription`, "POST"),
  rejoindreListeAttente: (sortieId: string) =>
    call<{ position: number }>(`moi/sorties/${sortieId}/liste-attente`, "POST"),
  quitterListeAttente: (sortieId: string) =>
    call<{ ok: true }>(`moi/sorties/${sortieId}/liste-attente/quitter`, "POST"),

  // Admin : parcours
  getParcours: () => call<parcoursType[]>("admin/parcours"),
  createParcours: (nom: string, couleur: string) =>
    call<parcoursType>("admin/parcours", "POST", { nom, couleur }),
  updateParcours: (id: string, dto: { nom?: string; couleur?: string }) =>
    call(`admin/parcours/${id}`, "PATCH", dto),
  deleteParcours: (id: string) => call(`admin/parcours/${id}`, "DELETE"),
  getRecapitulatifParcours: (id: string) =>
    call<recapitulatifParcoursType>(`admin/parcours/${id}/recapitulatif`),

  // Admin : étudiants
  getEtudiants: () => call<etudiantAdminType[]>("admin/etudiants"),
  getEtudiant: (id: string) => call<ficheEtudiantType>(`admin/etudiants/${id}`),
  createEtudiant: (dto: etudiantDtoType) =>
    call<etudiantType>("admin/etudiants", "POST", dto),
  updateEtudiant: (id: string, dto: etudiantUpdateDtoType, confirme = false) =>
    call<etudiantType>(`admin/etudiants/${id}${q(confirme)}`, "PATCH", dto),
  deleteEtudiant: (id: string) => call(`admin/etudiants/${id}`, "DELETE"),
  impersonifier: (id: string) =>
    call<{ token: string }>(`admin/etudiants/${id}/impersonation`, "POST"),
  apercuImport: (csv: string) =>
    call<apercuImportType>("admin/etudiants/import/apercu", "POST", { csv }),
  importer: (csv: string) =>
    call<{ nbCrees: number; nbMisAJour: number }>(
      "admin/etudiants/import",
      "POST",
      { csv },
    ),

  // Admin : événements
  getEvenements: () => call<evenementAdminType[]>("admin/evenements"),
  getEvenement: (id: string) =>
    call<evenementDetailType>(`admin/evenements/${id}`),
  createEvenement: (dto: evenementDtoType) =>
    call<evenementType>("admin/evenements", "POST", dto),
  updateEvenement: (id: string, dto: Partial<evenementDtoType>) =>
    call<evenementType>(`admin/evenements/${id}`, "PATCH", dto),
  deleteEvenement: (id: string) => call(`admin/evenements/${id}`, "DELETE"),
  ouvrir: (id: string) =>
    call<evenementType>(`admin/evenements/${id}/ouverture`, "POST"),
  // forcer : ouvrir même si des étudiants du parcours ne sont pas encore inscrits.
  ouvrirAutresParcours: (id: string, forcer = false) =>
    call<evenementType>(
      `admin/evenements/${id}/ouverture-autres-parcours`,
      "POST",
      { forcer },
    ),

  // Admin : sorties
  createSortie: (evenementId: string, dto: sortieDtoType, confirme = false) =>
    call<sortieType & effetsType>(
      `admin/evenements/${evenementId}/sorties${q(confirme)}`,
      "POST",
      dto,
    ),
  getSortie: (id: string) => call<sortieDetailType>(`admin/sorties/${id}`),
  // promus : étudiants inscrits automatiquement depuis la liste d'attente.
  updateSortie: (id: string, dto: Partial<sortieDtoType>, confirme = false) =>
    call<sortieType & effetsType>(
      `admin/sorties/${id}${q(confirme)}`,
      "PATCH",
      dto,
    ),
  deleteSortie: (id: string, confirme = false) =>
    call<{ nbAnnulations: number }>(
      `admin/sorties/${id}${q(confirme)}`,
      "DELETE",
    ),
  exporterSortie: (id: string) =>
    call<{ filename: string; csv: string }>(`admin/sorties/${id}/export`),
  inscrire: (sortieId: string, etudiantId: string) =>
    call(`admin/sorties/${sortieId}/inscriptions/${etudiantId}`, "POST"),
  desinscrire: (sortieId: string, etudiantId: string, confirme = false) =>
    call<effetsType>(
      `admin/sorties/${sortieId}/inscriptions/${etudiantId}${q(confirme)}`,
      "DELETE",
    ),
  ajouterEnListeAttente: (sortieId: string, etudiantId: string) =>
    call<{ position: number }>(
      `admin/sorties/${sortieId}/liste-attente/${etudiantId}`,
      "POST",
    ),
  retirerDeListeAttente: (sortieId: string, etudiantId: string) =>
    call(`admin/sorties/${sortieId}/liste-attente/${etudiantId}`, "DELETE"),
  pointer: (
    sortieId: string,
    etudiantId: string,
    statut: statutPresenceType | null,
    confirme = false,
  ) =>
    call<{ nbAnnulations: number }>(
      `admin/sorties/${sortieId}/inscriptions/${etudiantId}${q(confirme)}`,
      "PATCH",
      { statut },
    ),
  getSortiesAPointer: () =>
    call<sortieAPointerType[]>("admin/sorties-a-pointer"),
};

export { api };
export type { evenementDtoType, sortieDtoType };
