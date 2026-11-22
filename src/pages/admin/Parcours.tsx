import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useQuery } from "@tanstack/react-query";
import { ChangeEvent, FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeParcours } from "../../components/BadgeParcours";
import { Chargement } from "../../components/Chargement";
import { Erreur } from "../../components/Erreur";
import { api } from "../../lib/api";
import { useAction } from "../../lib/useAction";
import type { parcoursType } from "../../types";

const COULEUR_PAR_DEFAUT = "#6B7280";

type saisieType = { nom: string; couleur: string };

function SelecteurCouleur(props: {
  valeur: string;
  onChange: (couleur: string) => void;
}) {
  return (
    <Tooltip title="Couleur du badge">
      <Box
        component="input"
        type="color"
        value={props.valeur}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          props.onChange(e.target.value.toUpperCase())
        }
        aria-label="Couleur du badge"
        sx={{
          width: 40,
          height: 40,
          p: 0.5,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          bgcolor: "background.paper",
          cursor: "pointer",
          flexShrink: 0,
        }}
      />
    </Tooltip>
  );
}

function Parcours() {
  const parcours = useQuery({
    queryKey: ["admin", "parcours"],
    queryFn: api.getParcours,
  });
  const [nouveau, setNouveau] = useState<saisieType>({
    nom: "",
    couleur: COULEUR_PAR_DEFAUT,
  });
  const [edite, setEdite] = useState<saisieType & { id: string }>();

  const creer = useAction(
    (saisie: saisieType) => api.createParcours(saisie.nom, saisie.couleur),
    {
      succes: "Parcours créé.",
      onSuccess: () => setNouveau({ nom: "", couleur: COULEUR_PAR_DEFAUT }),
    },
  );
  const modifier = useAction(
    ({ id, nom, couleur }: saisieType & { id: string }) =>
      api.updateParcours(id, { nom, couleur }),
    { succes: "Parcours modifié.", onSuccess: () => setEdite(undefined) },
  );
  const supprimer = useAction((id: string) => api.deleteParcours(id), {
    succes: "Parcours supprimé.",
  });

  const ajouter = (event: FormEvent) => {
    event.preventDefault();
    if (nouveau.nom.trim())
      creer.mutate({ ...nouveau, nom: nouveau.nom.trim() });
  };
  const enregistrer = (event: FormEvent) => {
    event.preventDefault();
    if (edite?.nom.trim()) modifier.mutate({ ...edite, nom: edite.nom.trim() });
  };

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
        <Typography variant="h1">Parcours</Typography>
      </Box>
      <Stack
        direction="row"
        spacing={1}
        component="form"
        onSubmit={ajouter}
        alignItems="center"
      >
        <SelecteurCouleur
          valeur={nouveau.couleur}
          onChange={(couleur) => setNouveau({ ...nouveau, couleur })}
        />
        <TextField
          label="Nouveau parcours"
          value={nouveau.nom}
          onChange={(e) => setNouveau({ ...nouveau, nom: e.target.value })}
          sx={{ flexGrow: 1 }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!nouveau.nom.trim() || creer.isPending}
        >
          Ajouter
        </Button>
      </Stack>

      {parcours.isPending && <Chargement />}
      {parcours.isError && <Erreur error={parcours.error} />}
      {parcours.data?.length === 0 && (
        <Typography color="text.secondary">Aucun parcours.</Typography>
      )}
      {!!parcours.data?.length && (
        <Paper>
          <Stack divider={<Divider flexItem />}>
            {parcours.data.map((p: parcoursType) => (
              <Box
                key={p.id}
                sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}
              >
                {edite?.id === p.id ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    component="form"
                    onSubmit={enregistrer}
                    alignItems="center"
                    sx={{ flexGrow: 1 }}
                  >
                    <SelecteurCouleur
                      valeur={edite.couleur}
                      onChange={(couleur) => setEdite({ ...edite, couleur })}
                    />
                    <TextField
                      autoFocus
                      value={edite.nom}
                      onChange={(e) =>
                        setEdite({ ...edite, nom: e.target.value })
                      }
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={modifier.isPending}
                    >
                      Enregistrer
                    </Button>
                    <Button color="inherit" onClick={() => setEdite(undefined)}>
                      Annuler
                    </Button>
                  </Stack>
                ) : (
                  <>
                    <Box sx={{ flexGrow: 1 }}>
                      <BadgeParcours nom={p.nom} couleur={p.couleur} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {p.nbEtudiants} étudiant(s) · {p.nbEvenements}{" "}
                        évènement(s)
                      </Typography>
                    </Box>
                    <Tooltip title="Modifier">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setEdite({ id: p.id, nom: p.nom, couleur: p.couleur })
                        }
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        p.nbEtudiants + p.nbEvenements > 0
                          ? "Impossible : des étudiants ou événements y sont rattachés"
                          : "Supprimer"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          disabled={
                            p.nbEtudiants + p.nbEvenements > 0 ||
                            supprimer.isPending
                          }
                          onClick={() => supprimer.mutate(p.id)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

export { Parcours };
