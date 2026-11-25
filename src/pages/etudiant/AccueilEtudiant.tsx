import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeBonus, BadgeParcours } from "../../components/BadgeParcours";
import { Chargement } from "../../components/Chargement";
import { Confirmation } from "../../components/Confirmation";
import { Erreur } from "../../components/Erreur";
import { Infos, Lieu } from "../../components/Lieu";
import { AlerteBonusBloque } from "../../components/SituationBonus";
import { RendezVous } from "../../components/RendezVous";
import { api } from "../../lib/api";
import { tokenStorage } from "../../lib/storage";
import { formatDateHeure } from "../../lib/format";
import { useAction } from "../../lib/useAction";
import type {
  evenementEtudiantType,
  meType,
  sortieEtudiantType,
} from "../../types";

type etudiantMeType = Extract<meType, { role: "etudiant" }>;
type cibleType = {
  evenement: evenementEtudiantType;
  sortie: sortieEtudiantType;
  mode: "inscription" | "attente";
};

// Places restantes rafraîchies en continu.
const RAFRAICHISSEMENT_MS = 10_000;

// Le prof qui voit l'application comme un étudiant ne peut pas agir à sa place.
const LECTURE_SEULE = tokenStorage.estEnImpersonation();

function ordinal(n: number) {
  return n === 1 ? "1ʳᵉ" : `${n}ᵉ`;
}

function AccueilEtudiant({ me }: { me: etudiantMeType }) {
  const evenements = useQuery({
    queryKey: ["moi", "evenements"],
    queryFn: api.getMesEvenements,
    refetchInterval: RAFRAICHISSEMENT_MS,
  });
  const [cible, setCible] = useState<cibleType>();
  const [aQuitter, setAQuitter] = useState<cibleType>();
  const quitter = useAction(
    (sortieId: string) => api.quitterListeAttente(sortieId),
    {
      succes: "Vous avez quitté la liste d'attente.",
      onSuccess: () => setAQuitter(undefined),
    },
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1">Bonjour {me.etudiant.prenom}</Typography>
        <Box sx={{ mt: 0.5 }}>
          <BadgeParcours
            nom={me.etudiant.parcoursNom}
            couleur={me.etudiant.parcoursCouleur}
            prefixe
          />
        </Box>
      </Box>

      {me.etudiant.cotisationPayeeLe === null && (
        <Alert severity="warning">
          Votre cotisation n'est pas enregistrée comme payée : vous ne pouvez
          pas encore vous inscrire aux sorties. Le message disparaîtra dès que
          le professeur aura mis à jour votre statut.
        </Alert>
      )}
      <AlerteBonusBloque bonus={me.etudiant.bonus} />

      <Typography variant="h2">Événements ouverts</Typography>
      {evenements.isPending && <Chargement />}
      {evenements.isError && <Erreur error={evenements.error} />}
      {evenements.data?.length === 0 && (
        <Typography color="text.secondary">
          Aucun évènement ouvert pour le moment.
        </Typography>
      )}
      {evenements.data?.map((evenement) => (
        <CarteEvenement
          key={evenement.id}
          evenement={evenement}
          compense={evenement.horsParcours && me.etudiant.bonus.bloque}
          onAction={(sortie, mode) => setCible({ evenement, sortie, mode })}
          onQuitter={(sortie) =>
            setAQuitter({ evenement, sortie, mode: "attente" })
          }
        />
      ))}

      {cible && (
        <DialogInscription
          cible={cible}
          onFermer={() => setCible(undefined)}
        />
      )}
      <Confirmation
        ouvert={!!aQuitter}
        titre="Quitter la liste d'attente ?"
        libelle="Quitter"
        danger
        enCours={quitter.isPending}
        onAnnuler={() => setAQuitter(undefined)}
        onConfirmer={() => aQuitter && quitter.mutate(aQuitter.sortie.id)}
      >
        <Typography>
          Vous perdrez votre place dans la file pour{" "}
          <strong>{aQuitter?.evenement.nom}</strong>.
        </Typography>
      </Confirmation>
    </Stack>
  );
}

// Confirmation puis écran de succès, pour une inscription ou une entrée en liste d'attente.
function DialogInscription(props: { cible: cibleType; onFermer: () => void }) {
  const { evenement, sortie, mode } = props.cible;
  const [position, setPosition] = useState<number>();
  const [reussi, setReussi] = useState(false);
  const action = useAction(
    () =>
      mode === "inscription"
        ? api.sInscrire(sortie.id).then(() => undefined)
        : api.rejoindreListeAttente(sortie.id).then((r) => r.position),
    {
      onSuccess: (resultat) => {
        setPosition(resultat);
        setReussi(true);
      },
    },
  );
  const positionPrevue = (sortie.listeAttente?.nbEnAttente ?? 0) + 1;

  const details = (
    <Box>
      <Typography>
        <strong>{evenement.nom}</strong>
        <br />
        {formatDateHeure(sortie.debut)}
        {evenement.lieu && (
          <>
            {" · "}
            <Lieu url={evenement.lieu} />
          </>
        )}
      </Typography>
      <RendezVous texte={evenement.lieuRendezVous} />
    </Box>
  );

  if (reussi) {
    return (
      <Dialog open onClose={props.onFermer} maxWidth="xs" fullWidth>
        <DialogContent>
          <Stack spacing={2} alignItems="center" textAlign="center" sx={{ pt: 2 }}>
            {mode === "inscription" ? (
              <CheckCircleIcon sx={{ fontSize: 64, color: "#16A34A" }} />
            ) : (
              <HourglassTopIcon sx={{ fontSize: 64, color: "#CA8A04" }} />
            )}
            <Typography variant="h2">
              {mode === "inscription"
                ? "Vous êtes inscrit !"
                : `Vous êtes ${ordinal(position ?? positionPrevue)} sur la liste d'attente`}
            </Typography>
            {details}
            {mode === "attente" && (
              <Typography variant="body2" color="text.secondary">
                Si une place se libère, vous serez inscrit automatiquement. Suivez
                votre position dans « Mes inscriptions ».
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button variant="contained" onClick={props.onFermer}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open onClose={props.onFermer} maxWidth="xs" fullWidth>
      <DialogTitle>
        {mode === "inscription"
          ? "Confirmer l'inscription ?"
          : "Rejoindre la liste d'attente ?"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {details}
          {mode === "inscription" ? (
            <Alert severity="warning">
              Êtes-vous sûr ? Vous ne pourrez pas vous désinscrire vous-même. Une
              absence sans justificatif vous fermera les événements bonus, et
              ceux que vous avez déjà réservés seront perdus.
            </Alert>
          ) : (
            <Alert severity="info">
              La sortie est complète. Vous serez {ordinal(positionPrevue)} sur la
              liste d'attente et inscrit automatiquement si une place se libère :
              vous ne pourrez alors plus vous désinscrire vous-même.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onFermer} color="inherit">
          Annuler
        </Button>
        <Button
          variant="contained"
          disabled={action.isPending}
          onClick={() => action.mutate(undefined)}
        >
          {mode === "inscription" ? "Je m'inscris" : "Rejoindre la liste"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CarteEvenement(props: {
  evenement: evenementEtudiantType;
  // Une présence à cette sortie hors parcours débloquerait (en partie) les bonus.
  compense: boolean;
  onAction: (sortie: sortieEtudiantType, mode: cibleType["mode"]) => void;
  onQuitter: (sortie: sortieEtudiantType) => void;
}) {
  const { evenement } = props;
  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 1 }}
            flexWrap="wrap"
            useFlexGap
          >
            {evenement.bonus ? (
              <BadgeBonus />
            ) : (
              <BadgeParcours
                nom={evenement.parcoursNom}
                couleur={evenement.parcoursCouleur}
                prefixe
              />
            )}
            {evenement.horsParcours && (
              <Chip label="Ouvert aux autres parcours" />
            )}
            {props.compense && (
              <Chip label="Compte comme compensation" color="success" />
            )}
          </Stack>
          <Typography variant="h2">{evenement.nom}</Typography>
          {(evenement.institution || evenement.lieu) && (
            <Typography color="text.secondary">
              <Infos>
                {[
                  evenement.institution,
                  evenement.lieu && <Lieu url={evenement.lieu} />,
                ]}
              </Infos>
            </Typography>
          )}
          <RendezVous texte={evenement.lieuRendezVous} />
          {evenement.description && (
            <Typography sx={{ mt: 1, whiteSpace: "pre-line" }}>
              {evenement.description}
            </Typography>
          )}
        </Box>
        <Divider />
        <Stack divider={<Divider flexItem />} spacing={1.5}>
          {evenement.sorties.map((sortie) => (
            <LigneSortie
              key={sortie.id}
              sortie={sortie}
              onAction={(mode) => props.onAction(sortie, mode)}
              onQuitter={() => props.onQuitter(sortie)}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function Precision({ children }: { children: string }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      display="block"
      sx={{ mt: 0.5 }}
    >
      {children}
    </Typography>
  );
}

function LigneSortie(props: {
  sortie: sortieEtudiantType;
  onAction: (mode: cibleType["mode"]) => void;
  onQuitter: () => void;
}) {
  const { sortie } = props;
  const attente = sortie.listeAttente;
  // Sortie complète d'un évènement bonus : on propose la liste d'attente.
  const proposerAttente =
    !sortie.inscrit && sortie.raison === "complet" && attente !== null;

  let action;
  if (sortie.inscrit) {
    action = <Chip label="Inscrit" color="success" />;
  } else if (attente?.position) {
    action = (
      <Box sx={{ textAlign: { sm: "right" } }}>
        <Chip
          icon={<HourglassTopIcon />}
          label={`Liste d'attente : ${ordinal(attente.position)} sur ${attente.nbEnAttente}`}
          sx={{ bgcolor: "#FEF3C7" }}
        />
        <Box>
          <Button
            size="small"
            color="inherit"
            sx={{ color: "text.secondary", mt: 0.5 }}
            disabled={LECTURE_SEULE}
            onClick={props.onQuitter}
          >
            Quitter la liste
          </Button>
        </Box>
      </Box>
    );
  } else if (proposerAttente) {
    action = (
      <Box sx={{ textAlign: { sm: "right" }, maxWidth: { sm: 280 } }}>
        <Button
          variant="outlined"
          startIcon={<HourglassTopIcon />}
          disabled={!attente.peutRejoindre || LECTURE_SEULE}
          onClick={() => props.onAction("attente")}
        >
          Rejoindre la liste d'attente
        </Button>
        <Precision>
          {attente.raisonMessage ??
            (attente.nbEnAttente > 0
              ? `Complet · ${attente.nbEnAttente} personne(s) en attente`
              : "Complet · personne en attente")}
        </Precision>
      </Box>
    );
  } else {
    action = (
      <Box sx={{ textAlign: { sm: "right" }, maxWidth: { sm: 260 } }}>
        <Button
          variant="contained"
          disabled={!!sortie.raison || LECTURE_SEULE}
          onClick={() => props.onAction("inscription")}
        >
          S'inscrire
        </Button>
        {LECTURE_SEULE && !sortie.raison && (
          <Precision>Inscription possible pour l'étudiant (lecture seule).</Precision>
        )}
        {sortie.raisonMessage && <Precision>{sortie.raisonMessage}</Precision>}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Typography sx={{ "&::first-letter": { textTransform: "uppercase" } }}>
          {formatDateHeure(sortie.debut)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {`${sortie.placesRestantes} place(s) restante(s) sur ${sortie.places}`}
        </Typography>
      </Box>
      {action}
    </Box>
  );
}

export { AccueilEtudiant };
