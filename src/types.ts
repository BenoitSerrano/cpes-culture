type statutPresenceType = 'present' | 'absent_sans_justificatif' | 'absent_avec_justificatif';
type raisonRefusType =
    | 'cotisation'
    | 'non_ouvert'
    | 'reserve_parcours'
    | 'absence'
    | 'complet'
    | 'deja_inscrit'
    | 'closes';

type etudiantType = {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    parcoursId: string;
    boursier: boolean;
    cotisationPayee: boolean;
};

type etudiantDtoType = Omit<etudiantType, 'id'>;

type meType =
    | { role: 'admin'; email: string }
    | {
          role: 'etudiant';
          email: string;
          etudiant: etudiantType & { parcoursNom: string; aAbsenceSansJustificatif: boolean };
      };

type sortieEtudiantType = {
    id: string;
    debut: string;
    lieu: string | null;
    places: number;
    placesRestantes: number;
    inscrit: boolean;
    raison: raisonRefusType | null;
    raisonMessage: string | null;
};

type evenementEtudiantType = {
    id: string;
    nom: string;
    institution: string;
    description: string | null;
    bonus: boolean;
    parcoursNom: string | null;
    horsParcours: boolean;
    sorties: sortieEtudiantType[];
};

type inscriptionEtudiantType = {
    sortieId: string;
    debut: string;
    lieu: string | null;
    evenementNom: string;
    institution: string;
    bonus: boolean;
    statut: statutPresenceType | null;
};

type parcoursType = { id: string; nom: string; nbEtudiants: number; nbEvenements: number };

type compteursType = {
    nbInscriptions: number;
    nbPresent: number;
    nbAbsentSansJustificatif: number;
    nbAbsentAvecJustificatif: number;
};

type etudiantAdminType = etudiantType & compteursType & { parcoursNom: string };

type ficheEtudiantType = etudiantAdminType & {
    inscriptions: (inscriptionEtudiantType & { evenementId: string })[];
};

type evenementType = {
    id: string;
    nom: string;
    institution: string;
    description: string | null;
    parcoursId: string | null;
    dateOuverture: string | null;
    ouvertAutresParcoursLe: string | null;
};

type etatEvenementType = 'brouillon' | 'ouvert' | 'passe';

type evenementAdminType = evenementType & {
    slug: string;
    bonus: boolean;
    parcoursNom: string | null;
    etat: etatEvenementType;
    nbSorties: number;
    premierDebut: string | null;
    dernierDebut: string | null;
};

type sortieType = {
    id: string;
    evenementId: string;
    debut: string;
    places: number;
    lieu: string | null;
};

type evenementDetailType = evenementType & {
    slug: string;
    bonus: boolean;
    parcoursNom: string | null;
    etat: etatEvenementType;
    sorties: (sortieType & { nbInscrits: number; nbNonPointes: number })[];
    progressionParcours: {
        nbConcernes: number;
        nbInscrits: number;
        manquants: { id: string; nom: string; prenom: string; email: string }[];
    } | null;
};

type sortieDetailType = sortieType & {
    evenement: evenementType & { bonus: boolean; parcoursNom: string | null };
    pointable: boolean;
    inscrits: (etudiantType & { parcoursNom: string; statut: statutPresenceType | null })[];
    candidats: {
        id: string;
        nom: string;
        prenom: string;
        email: string;
        parcoursNom: string;
        raison: raisonRefusType | null;
        raisonMessage: string | null;
    }[];
};

type sortieAPointerType = {
    id: string;
    debut: string;
    lieu: string | null;
    evenementId: string;
    evenementNom: string;
    institution: string;
    nbNonPointes: number;
};

type ligneImportType = etudiantDtoType & { ligne: number; parcoursNom: string };

type statutRecapitulatifType = 'non_inscrit' | 'non_pointe' | 'abj' | 'abi' | 'ok';

type recapitulatifParcoursType = {
    evenements: { id: string; nom: string; slug: string; premierDebut: string | null }[];
    cellules: Record<string, Record<string, statutRecapitulatifType>>;
};

type apercuImportType = {
    aCreer: ligneImportType[];
    aMettreAJour: ligneImportType[];
    erreurs: { ligne: number; message: string }[];
};

export type {
    statutPresenceType,
    raisonRefusType,
    etudiantType,
    etudiantDtoType,
    meType,
    sortieEtudiantType,
    evenementEtudiantType,
    inscriptionEtudiantType,
    parcoursType,
    etudiantAdminType,
    ficheEtudiantType,
    evenementType,
    etatEvenementType,
    evenementAdminType,
    sortieType,
    evenementDetailType,
    sortieDetailType,
    sortieAPointerType,
    apercuImportType,
    statutRecapitulatifType,
    recapitulatifParcoursType,
};
