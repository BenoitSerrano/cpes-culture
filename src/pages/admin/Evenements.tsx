import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeBonus, BadgeParcours } from "../../components/BadgeParcours";
import { Chargement } from "../../components/Chargement";
import { Erreur } from "../../components/Erreur";
import { Lieu } from "../../components/Lieu";
import { api, evenementDtoType } from "../../lib/api";
import { formatDateCourte } from "../../lib/format";
import { ETATS } from "../../lib/labels";
import { useTri } from "../../lib/tri";
import { useAction } from "../../lib/useAction";
import type { etatEvenementType, evenementAdminType } from "../../types";
import { FormulaireEvenement } from "./formulaires";

const ORDRE_ETATS: etatEvenementType[] = ["ouvert", "brouillon", "passe"];

const CLE_VOIR_PASSES = "CPES_VOIR_EVENEMENTS_PASSES";

// Stockage indisponible (navigation privée…) : on reste sur la valeur par défaut.
function lireVoirPasses() {
  try {
    return localStorage.getItem(CLE_VOIR_PASSES) === "1";
  } catch {
    return false;
  }
}

function ecrireVoirPasses(valeur: boolean) {
  try {
    if (valeur) localStorage.setItem(CLE_VOIR_PASSES, "1");
    else localStorage.removeItem(CLE_VOIR_PASSES);
  } catch {
    // Préférence non mémorisée : sans conséquence.
  }
}

function Evenements() {
  const navigate = useNavigate();
  const evenements = useQuery({
    queryKey: ["admin", "evenements"],
    queryFn: api.getEvenements,
  });
  const [creation, setCreation] = useState(false);
  // Évènements passés masqués par défaut ; le choix est gardé dans le navigateur.
  const [voirPasses, setVoirPasses] = useState(lireVoirPasses);
  const basculerPasses = () => {
    setVoirPasses(!voirPasses);
    ecrireVoirPasses(!voirPasses);
  };
  const nbPasses = (evenements.data ?? []).filter((e) => e.etat === "passe").length;
  const creer = useAction((dto: evenementDtoType) => api.createEvenement(dto), {
    succes: "Évènement créé. Ajoutez ses sorties avant de l’ouvrir.",
    onSuccess: (evenement) => navigate(`/admin/evenements/${evenement.id}`),
  });

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h1">Événements</Typography>
          <Button
            component={Link}
            to="/admin/parcours"
            size="small"
            color="inherit"
            sx={{ color: "text.secondary", ml: -0.75 }}
          >
            Gérer les parcours
          </Button>
        </Box>
        <Button variant="contained" onClick={() => setCreation(true)}>
          Nouvel évènement
        </Button>
      </Box>

      {evenements.isPending && <Chargement />}
      {evenements.isError && <Erreur error={evenements.error} />}
      {evenements.data?.length === 0 && (
        <Typography color="text.secondary">
          Aucun évènement pour le moment.
        </Typography>
      )}
      {ORDRE_ETATS.filter((etat) => etat !== "passe" || voirPasses).map((etat) => {
        const liste = (evenements.data ?? []).filter((e) => e.etat === etat);
        if (liste.length === 0) return null;
        return (
          <Stack spacing={1} key={etat}>
            <Typography variant="h2">{ETATS[etat]}</Typography>
            <TableauEvenements liste={liste} />
          </Stack>
        );
      })}

      {nbPasses > 0 && (
        <Box>
          <Button
            color="inherit"
            sx={{ color: "text.secondary" }}
            onClick={basculerPasses}
          >
            {voirPasses
              ? "Masquer les évènements passés"
              : `Voir les évènements passés (${nbPasses})`}
          </Button>
        </Box>
      )}

      {creation && (
        <FormulaireEvenement
          titre="Nouvel évènement"
          enCours={creer.isPending}
          onFermer={() => setCreation(false)}
          onValider={(dto) => creer.mutate(dto)}
        />
      )}
    </Stack>
  );
}

// Un tableau par état ; chacun garde son propre tri.
function TableauEvenements({ liste }: { liste: evenementAdminType[] }) {
  const tri = useTri(liste, {
    evenement: (e) => e.nom,
    parcours: (e) => (e.bonus ? "Bonus" : e.parcoursNom),
    sorties: (e) => e.nbSorties,
    dates: (e) => (e.premierDebut ? new Date(e.premierDebut).getTime() : null),
  });

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {tri.enTete("evenement", "Évènement")}
            {tri.enTete("parcours", "Parcours")}
            {tri.enTete("sorties", "Sorties")}
            {tri.enTete("dates", "Dates")}
          </TableRow>
        </TableHead>
        <TableBody>
          {tri.lignes.map((evenement) => (
            <TableRow
              key={evenement.id}
              hover
              component={Link}
              to={`/admin/evenements/${evenement.id}`}
              sx={{ textDecoration: "none" }}
            >
              <TableCell>
                <Typography fontWeight={500}>{evenement.nom}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {evenement.institution} <Lieu url={evenement.lieu} compact />
                </Typography>
              </TableCell>
              <TableCell>
                {evenement.bonus ? (
                  <BadgeBonus />
                ) : (
                  <Stack
                    direction="row"
                    spacing={0.5}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <BadgeParcours
                      nom={evenement.parcoursNom}
                      couleur={evenement.parcoursCouleur}
                    />
                    {evenement.ouvertAutresParcoursLe && (
                      <Chip label="Ouvert à tous" />
                    )}
                  </Stack>
                )}
              </TableCell>
              <TableCell>{evenement.nbSorties}</TableCell>
              <TableCell>
                {evenement.premierDebut
                  ? formatDateCourte(evenement.premierDebut)
                  : "—"}
                {evenement.dernierDebut &&
                  evenement.dernierDebut !== evenement.premierDebut &&
                  ` → ${formatDateCourte(evenement.dernierDebut)}`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export { Evenements };
