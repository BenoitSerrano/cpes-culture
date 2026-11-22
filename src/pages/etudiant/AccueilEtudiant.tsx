import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeParcours } from "../../components/BadgeParcours";
import { Chargement } from "../../components/Chargement";
import { Confirmation } from "../../components/Confirmation";
import { Erreur } from "../../components/Erreur";
import { Infos, Lieu } from "../../components/Lieu";
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

function AccueilEtudiant({ me }: { me: etudiantMeType }) {
  const evenements = useQuery({
    queryKey: ["moi", "evenements"],
    queryFn: api.getMesEvenements,
  });
  const [aConfirmer, setAConfirmer] = useState<{
    evenement: evenementEtudiantType;
    sortie: sortieEtudiantType;
  }>();
  const inscription = useAction((sortieId: string) => api.sInscrire(sortieId), {
    succes: "Inscription enregistrée.",
    onSuccess: () => setAConfirmer(undefined),
  });

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

      {!me.etudiant.cotisationPayee && (
        <Alert severity="warning">
          Votre cotisation n'est pas enregistrée comme payée : vous ne pouvez
          pas encore vous inscrire aux sorties. Le message disparaîtra dès que
          le professeur aura mis à jour votre statut.
        </Alert>
      )}
      {me.etudiant.aAbsenceSansJustificatif && (
        <Alert severity="info">
          Vous avez une absence sans justificatif : les événements bonus et ceux
          des autres parcours vous sont fermés. Les événements de votre parcours
          restent accessibles.
        </Alert>
      )}

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
          onInscrire={(sortie) => setAConfirmer({ evenement, sortie })}
        />
      ))}

      <Confirmation
        ouvert={!!aConfirmer}
        titre="Confirmer l'inscription ?"
        libelle="Je m'inscris"
        enCours={inscription.isPending}
        onAnnuler={() => setAConfirmer(undefined)}
        onConfirmer={() =>
          aConfirmer && inscription.mutate(aConfirmer.sortie.id)
        }
      >
        {aConfirmer && (
          <Stack spacing={2}>
            <Typography>
              <strong>{aConfirmer.evenement.nom}</strong>
              <br />
              {formatDateHeure(aConfirmer.sortie.debut)}
              {aConfirmer.evenement.lieu && (
                <>
                  {" · "}
                  <Lieu url={aConfirmer.evenement.lieu} />
                </>
              )}
            </Typography>
            <Alert severity="warning">
              Êtes-vous sûr ? Vous ne pourrez pas vous désinscrire vous-même, et
              une absence sans justificatif vous fermera les événements bonus et
              hors parcours.
            </Alert>
          </Stack>
        )}
      </Confirmation>
    </Stack>
  );
}

// Le prof qui voit l'application comme un étudiant ne peut pas agir à sa place.
const LECTURE_SEULE = tokenStorage.estEnImpersonation();

function CarteEvenement(props: {
  evenement: evenementEtudiantType;
  onInscrire: (sortie: sortieEtudiantType) => void;
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
              <Chip label="Bonus" variant="outlined" />
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
              onInscrire={() => props.onInscrire(sortie)}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function LigneSortie(props: {
  sortie: sortieEtudiantType;
  onInscrire: () => void;
}) {
  const { sortie } = props;
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
      {sortie.inscrit ? (
        <Chip label="Inscrit" color="success" />
      ) : (
        <Box sx={{ textAlign: { sm: "right" }, maxWidth: { sm: 260 } }}>
          <Button
            variant="contained"
            disabled={!!sortie.raison || LECTURE_SEULE}
            onClick={props.onInscrire}
          >
            S'inscrire
          </Button>
          {LECTURE_SEULE && !sortie.raison && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 0.5 }}
            >
              Inscription possible pour l'étudiant (lecture seule).
            </Typography>
          )}
          {sortie.raisonMessage && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 0.5 }}
            >
              {sortie.raisonMessage}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

export { AccueilEtudiant };
