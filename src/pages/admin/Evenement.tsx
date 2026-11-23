import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BadgeBonus, BadgeParcours } from "../../components/BadgeParcours";
import { Chargement } from "../../components/Chargement";
import { Confirmation } from "../../components/Confirmation";
import { Erreur } from "../../components/Erreur";
import { Infos, Lieu } from "../../components/Lieu";
import { RendezVous } from "../../components/RendezVous";
import { api, evenementDtoType, sortieDtoType } from "../../lib/api";
import { formatDateCourte, formatDateHeure } from "../../lib/format";
import { ETATS } from "../../lib/labels";
import { useTri } from "../../lib/tri";
import { useAction } from "../../lib/useAction";
import type { evenementDetailType } from "../../types";
import { FormulaireEvenement, FormulaireSortie } from "./formulaires";

type sortieDetailType = evenementDetailType["sorties"][number];

function Evenement() {
  const { evenementId = "" } = useParams();
  const navigate = useNavigate();
  const evenement = useQuery({
    queryKey: ["admin", "evenement", evenementId],
    queryFn: () => api.getEvenement(evenementId),
  });

  const [edition, setEdition] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [ouverture, setOuverture] = useState<"parcours" | "autres">();
  const [sortieEditee, setSortieEditee] = useState<
    sortieDetailType | "nouvelle"
  >();
  const [sortieSupprimee, setSortieSupprimee] = useState<sortieDetailType>();

  const modifier = useAction(
    (dto: Partial<evenementDtoType>) => api.updateEvenement(evenementId, dto),
    {
      succes: "Évènement modifié.",
      onSuccess: () => setEdition(false),
    },
  );
  const supprimer = useAction(() => api.deleteEvenement(evenementId), {
    succes: "Évènement supprimé.",
    onSuccess: () => navigate("/admin/evenements"),
  });
  const ouvrir = useAction(
    (cible: "parcours" | "autres") =>
      cible === "parcours"
        ? api.ouvrir(evenementId)
        : api.ouvrirAutresParcours(
            evenementId,
            !!evenement.data?.progressionParcours?.manquants.length,
          ),
    { succes: "Évènement ouvert.", onSuccess: () => setOuverture(undefined) },
  );
  const enregistrerSortie = useAction(
    ({ id, dto }: { id?: string; dto: sortieDtoType }) =>
      id ? api.updateSortie(id, dto) : api.createSortie(evenementId, dto),
    {
      succes: "Sortie enregistrée.",
      onSuccess: () => setSortieEditee(undefined),
    },
  );
  const supprimerSortie = useAction((id: string) => api.deleteSortie(id), {
    succes: "Sortie supprimée.",
    onSuccess: () => setSortieSupprimee(undefined),
  });

  const triSorties = useTri(
    evenement.data?.sorties ?? [],
    {
      date: (s) => new Date(s.debut).getTime(),
      inscrits: (s) => s.nbInscrits,
    },
    { cle: "date" },
  );

  if (evenement.isPending) return <Chargement />;
  if (evenement.isError) return <Erreur error={evenement.error} />;
  const e = evenement.data;
  const progression = e.progressionParcours;
  // Étudiants du parcours pas encore inscrits, rappelés dans la confirmation d'ouverture.
  const manquantsAOuvrir =
    ouverture === "autres" ? (progression?.manquants ?? []) : [];
  // Possible même pour un évènement passé (inscriptions a posteriori par le prof).
  const peutOuvrirAutres =
    !e.bonus && e.dateOuverture !== null && e.ouvertAutresParcoursLe === null;

  return (
    <Stack spacing={3}>
      <Box>
        <Button
          component={Link}
          to="/admin/evenements"
          color="inherit"
          sx={{ color: "text.secondary", mb: 1, ml: -1 }}
        >
          ← Événements
        </Button>
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 1 }}
          flexWrap="wrap"
          useFlexGap
        >
          <Chip
            label={ETATS[e.etat]}
            color={e.etat === "ouvert" ? "success" : "default"}
          />
          {e.bonus ? (
            <BadgeBonus />
          ) : (
            <BadgeParcours
              nom={e.parcoursNom}
              couleur={e.parcoursCouleur}
              prefixe
            />
          )}
          {e.ouvertAutresParcoursLe && (
            <Chip label="Ouvert aux autres parcours" />
          )}
        </Stack>
        <Typography variant="h1">{e.nom}</Typography>
        {(e.institution || e.lieu) && (
          <Typography color="text.secondary">
            <Infos>{[e.institution, e.lieu && <Lieu url={e.lieu} />]}</Infos>
          </Typography>
        )}
        <RendezVous texte={e.lieuRendezVous} />
        {e.description && (
          <Typography sx={{ mt: 1, whiteSpace: "pre-line" }}>
            {e.description}
          </Typography>
        )}
        {e.dateOuverture && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Ouvert le {formatDateCourte(e.dateOuverture)}
            {e.ouvertAutresParcoursLe &&
              ` · ouvert aux autres parcours le ${formatDateCourte(e.ouvertAutresParcoursLe)}`}
          </Typography>
        )}
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="outlined" onClick={() => setEdition(true)}>
          Modifier
        </Button>
        {e.dateOuverture === null && (
          <>
            <Button
              variant="contained"
              onClick={() => setOuverture("parcours")}
              disabled={e.sorties.length === 0}
            >
              Ouvrir les inscriptions
            </Button>
            <Button color="error" onClick={() => setSuppression(true)}>
              Supprimer
            </Button>
          </>
        )}
      </Stack>
      {e.dateOuverture === null && e.sorties.length === 0 && (
        <Alert severity="info">
          Ajoutez au moins une sortie pour pouvoir ouvrir l'évènement.
        </Alert>
      )}

      {progression &&
        e.dateOuverture !== null &&
        e.ouvertAutresParcoursLe === null && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h3">
                Ouverture aux autres parcours
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recommandé une fois que tous les étudiants du parcours{" "}
                {e.parcoursNom} à jour de cotisation sont inscrits à une sortie.
              </Typography>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {progression.nbInscrits} / {progression.nbConcernes} inscrits
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={
                    progression.nbConcernes
                      ? (100 * progression.nbInscrits) / progression.nbConcernes
                      : 100
                  }
                />
              </Box>
              {progression.manquants.length > 0 && (
                <Typography variant="body2">
                  Pas encore inscrits :{" "}
                  {progression.manquants.map((m, i) => (
                    <span key={m.id}>
                      {i > 0 && ", "}
                      <Link to={`/admin/etudiants/${m.id}`}>
                        {m.prenom} {m.nom}
                      </Link>
                    </span>
                  ))}
                </Typography>
              )}
              {peutOuvrirAutres && (
                <Box>
                  <Button
                    variant="contained"
                    onClick={() => setOuverture("autres")}
                  >
                    Ouvrir aux autres parcours
                  </Button>
                </Box>
              )}
            </Stack>
          </Paper>
        )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h2">Sorties</Typography>
        <Button variant="outlined" onClick={() => setSortieEditee("nouvelle")}>
          Ajouter une sortie
        </Button>
      </Box>
      {e.sorties.length === 0 ? (
        <Typography color="text.secondary">Aucune sortie.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {triSorties.enTete("date", "Date")}
                {triSorties.enTete("inscrits", "Inscrits")}
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {triSorties.lignes.map((sortie) => (
                <TableRow key={sortie.id} hover>
                  <TableCell>
                    <Link to={`/admin/sorties/${sortie.id}`}>
                      {formatDateHeure(sortie.debut)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {sortie.nbInscrits} / {sortie.places}
                    {sortie.nbNonPointes > 0 &&
                      new Date(sortie.debut) < new Date() && (
                        <Typography
                          variant="caption"
                          color="warning.main"
                          display="block"
                        >
                          {sortie.nbNonPointes} pas encore pointé(s)
                        </Typography>
                      )}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Modifier">
                      <IconButton
                        size="small"
                        onClick={() => setSortieEditee(sortie)}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        sortie.nbInscrits > 0
                          ? "Impossible : il y a des inscrits"
                          : "Supprimer"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          disabled={sortie.nbInscrits > 0}
                          onClick={() => setSortieSupprimee(sortie)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {edition && (
        <FormulaireEvenement
          titre="Modifier l'évènement"
          initial={{
            nom: e.nom,
            institution: e.institution,
            description: e.description,
            lieu: e.lieu,
            lieuRendezVous: e.lieuRendezVous,
            parcoursId: e.parcoursId,
          }}
          parcoursVerrouille={e.dateOuverture !== null}
          enCours={modifier.isPending}
          onFermer={() => setEdition(false)}
          onValider={(dto) =>
            modifier.mutate(
              e.dateOuverture !== null
                ? { ...dto, parcoursId: undefined }
                : dto,
            )
          }
        />
      )}
      {sortieEditee && (
        <FormulaireSortie
          titre={
            sortieEditee === "nouvelle"
              ? "Nouvelle sortie"
              : "Modifier la sortie"
          }
          initial={sortieEditee === "nouvelle" ? undefined : sortieEditee}
          placesMin={sortieEditee === "nouvelle" ? 1 : sortieEditee.nbInscrits}
          enCours={enregistrerSortie.isPending}
          onFermer={() => setSortieEditee(undefined)}
          onValider={(dto) =>
            enregistrerSortie.mutate({
              id: sortieEditee === "nouvelle" ? undefined : sortieEditee.id,
              dto,
            })
          }
        />
      )}

      <Confirmation
        ouvert={!!ouverture}
        titre={
          ouverture === "autres"
            ? "Ouvrir aux autres parcours ?"
            : "Ouvrir les inscriptions ?"
        }
        libelle={manquantsAOuvrir.length > 0 ? "Ouvrir quand même" : "Ouvrir"}
        danger={manquantsAOuvrir.length > 0}
        enCours={ouvrir.isPending}
        onAnnuler={() => setOuverture(undefined)}
        onConfirmer={() => ouverture && ouvrir.mutate(ouverture)}
      >
        {manquantsAOuvrir.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {manquantsAOuvrir.length === 1
              ? "1 étudiant du parcours à jour de cotisation n'est pas encore inscrit :"
              : `${manquantsAOuvrir.length} étudiants du parcours à jour de cotisation ne sont pas encore inscrits :`}
            <Box component="ul" sx={{ my: 1, pl: 2.5 }}>
              {manquantsAOuvrir.map((m) => (
                <li key={m.id}>
                  {m.prenom} {m.nom}
                </li>
              ))}
            </Box>
            En ouvrant maintenant, ils risquent de ne plus trouver de place.
            Êtes-vous sûr de vouloir ouvrir quand même ?
          </Alert>
        )}
        <Typography>
          {ouverture === "autres"
            ? "Les étudiants des autres parcours pourront s’inscrire aux places restantes."
            : e.bonus
              ? "Tous les étudiants pourront s’inscrire."
              : `Les étudiants du parcours ${e.parcoursNom} pourront s’inscrire.`}{" "}
          Cette action est irréversible.
        </Typography>
      </Confirmation>
      <Confirmation
        ouvert={suppression}
        titre="Supprimer l'évènement ?"
        libelle="Supprimer"
        danger
        enCours={supprimer.isPending}
        onAnnuler={() => setSuppression(false)}
        onConfirmer={() => supprimer.mutate(undefined)}
      >
        <Typography>L'évènement et ses sorties seront supprimés.</Typography>
      </Confirmation>
      <Confirmation
        ouvert={!!sortieSupprimee}
        titre="Supprimer la sortie ?"
        libelle="Supprimer"
        danger
        enCours={supprimerSortie.isPending}
        onAnnuler={() => setSortieSupprimee(undefined)}
        onConfirmer={() =>
          sortieSupprimee && supprimerSortie.mutate(sortieSupprimee.id)
        }
      >
        <Typography>
          {sortieSupprimee && formatDateHeure(sortieSupprimee.debut)}
        </Typography>
      </Confirmation>
    </Stack>
  );
}

export { Evenement };
