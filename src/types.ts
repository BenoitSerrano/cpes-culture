type statutPresenceType = 'present' | 'absent_sans_justificatif' | 'absent_avec_justificatif';
type raisonRefusType =
    | 'cotisation'
    | 'non_ouvert'
    | 'reserve_parcours'
    | 'bonus_bloque'
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
    // Jour du paiement (AAAA-MM-JJ), null = non payée.
    cotisationPayeeLe: string | null;
    createdAt: string;
};

type etudiantDtoType = Omit<etudiantType, 'id' | 'createdAt'>;
// Parcours et statut boursier sont figés à la création ; une date de paiement ne s'efface pas.
type etudiantUpdateDtoType = Partial<Pick<etudiantType, 'nom' | 'prenom' | 'email'>> & {
    cotisationPayeeLe?: string;
};

// Faute qui bloque les bonus : absence injustifiée (abi) ou non-inscription (ni).
type fauteType = {
    type: 'abi' | 'ni';
    date: string;
    evenementId: string;
    evenementNom: string;
    sortieId: string | null;
    compenseePar: { sortieId: string; evenementNom: string; debut: string } | null;
};
type situationType = { bloque: boolean; nbRestantes: number; fautes: fauteType[] };

// Bonus qu'une action du prof ferait perdre.
type perteType = {
    etudiantId: string;
    etudiantNom: string;
    sortieId: string;
    evenementNom: string;
    debut: string;
    type: 'inscription' | 'attente';
};

// Bonus déjà perdu à cause du blocage.
type annulationType = {
    sortieId: string;
    debut: string;
    evenementNom: string;
    institution: string | null;
    type: 'inscription' | 'attente';
    annuleeLe: string;
};

type meType =
    | { role: 'admin'; email: string }
    | {
          role: 'etudiant';
          email: string;
          etudiant: etudiantType & {
              parcoursNom: string;
              parcoursCouleur: string | null;
              // Seulement les fautes non compensées.
              bonus: situationType;
          };
      };

type sortieEtudiantType = {
    id: string;
    debut: string;
    places: number;
    placesRestantes: number;
    inscrit: boolean;
    raison: raisonRefusType | null;
    raisonMessage: string | null;
    // null hors évènements bonus.
    listeAttente: {
        nbEnAttente: number;
        position: number | null;
        peutRejoindre: boolean;
        raisonMessage: string | null;
    } | null;
};

type evenementEtudiantType = {
    id: string;
    nom: string;
    institution: string | null;
    description: string | null;
    lieu: string | null;
    lieuRendezVous: string | null;
    bonus: boolean;
    parcoursNom: string | null;
    parcoursCouleur: string | null;
    horsParcours: boolean;
    sorties: sortieEtudiantType[];
};

type inscriptionEtudiantType = {
    sortieId: string;
    debut: string;
    lieu: string | null;
    lieuRendezVous: string | null;
    evenementNom: string;
    institution: string | null;
    bonus: boolean;
    statut: statutPresenceType | null;
};

type parcoursType = { id: string; nom: string; couleur: string; nbEtudiants: number; nbEvenements: number };

type compteursType = {
    nbInscriptions: number;
    nbPresent: number;
    nbAbsentSansJustificatif: number;
    nbAbsentAvecJustificatif: number;
    nbNonInscrit: number;
};

type etudiantAdminType = etudiantType &
    compteursType & { parcoursNom: string; parcoursCouleur: string | null; bonusBloque: boolean };

type ficheEtudiantType = etudiantAdminType & {
    situation: situationType;
    annulations: annulationType[];
    inscriptions: (inscriptionEtudiantType & { evenementId: string })[];
};

type evenementType = {
    id: string;
    nom: string;
    institution: string | null;
    description: string | null;
    lieu: string | null;
    lieuRendezVous: string | null;
    parcoursId: string | null;
    dateOuverture: string | null;
    ouvertAutresParcoursLe: string | null;
};

type etatEvenementType = 'brouillon' | 'ouvert' | 'passe';

type evenementAdminType = evenementType & {
    slug: string;
    bonus: boolean;
    parcoursNom: string | null;
    parcoursCouleur: string | null;
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
};

type evenementDetailType = evenementType & {
    slug: string;
    bonus: boolean;
    parcoursNom: string | null;
    parcoursCouleur: string | null;
    etat: etatEvenementType;
    sorties: (sortieType & { nbInscrits: number; nbNonPointes: number; nbEnAttente: number })[];
    progressionParcours: {
        nbConcernes: number;
        nbInscrits: number;
        manquants: { id: string; nom: string; prenom: string; email: string }[];
    } | null;
};

type sortieDetailType = sortieType & {
    evenement: evenementType & { bonus: boolean; parcoursNom: string | null; parcoursCouleur: string | null };
    pointable: boolean;
    inscrits: (etudiantType & {
        parcoursNom: string;
        parcoursCouleur: string | null;
        statut: statutPresenceType | null;
    })[];
    candidats: {
        id: string;
        nom: string;
        prenom: string;
        email: string;
        parcoursNom: string;
        raison: raisonRefusType | null;
        raisonMessage: string | null;
    }[];
    listeAttente: {
        id: string;
        nom: string;
        prenom: string;
        email: string;
        parcoursNom: string;
        parcoursCouleur: string | null;
        position: number;
        depuis: string;
        // Pourquoi il serait sauté à la prochaine promotion (null = éligible).
        raisonMessage: string | null;
    }[];
};

type attenteEtudiantType = {
    sortieId: string;
    debut: string;
    lieu: string | null;
    lieuRendezVous: string | null;
    evenementNom: string;
    institution: string | null;
    bonus: boolean;
    position: number;
    nbEnAttente: number;
};

type sortieAPointerType = {
    id: string;
    debut: string;
    lieu: string | null;
    evenementId: string;
    evenementNom: string;
    institution: string | null;
    nbNonPointes: number;
};

type ligneImportType = etudiantDtoType & { ligne: number; parcoursNom: string };

// pas_inscrit : encore temps ; ni : faute ; ni_exempte : pas une faute (detail = raison).
type statutRecapitulatifType =
    | 'pas_inscrit'
    | 'ni'
    | 'ni_exempte'
    | 'non_pointe'
    | 'abj'
    | 'abi'
    | 'ok';
type celluleRecapitulatifType = { statut: statutRecapitulatifType; detail: string | null };

type recapitulatifParcoursType = {
    evenements: { id: string; nom: string; slug: string; premierDebut: string | null }[];
    cellules: Record<string, Record<string, celluleRecapitulatifType>>;
};

type apercuImportType = {
    pertes: perteType[];
    aCreer: ligneImportType[];
    aMettreAJour: ligneImportType[];
    erreurs: { ligne: number; message: string }[];
};

export type {
    statutPresenceType,
    raisonRefusType,
    etudiantType,
    etudiantDtoType,
    etudiantUpdateDtoType,
    fauteType,
    situationType,
    perteType,
    annulationType,
    celluleRecapitulatifType,
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
    attenteEtudiantType,
    sortieAPointerType,
    apercuImportType,
    statutRecapitulatifType,
    recapitulatifParcoursType,
};
