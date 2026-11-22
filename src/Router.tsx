import { useQuery } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import { Chargement } from "./components/Chargement";
import { Erreur } from "./components/Erreur";
import { Layout } from "./components/Layout";
import { api } from "./lib/api";
import { tokenStorage } from "./lib/storage";
import { Connexion } from "./pages/Connexion";
import { AccueilEtudiant } from "./pages/etudiant/AccueilEtudiant";
import { MesInscriptions } from "./pages/etudiant/MesInscriptions";
import { AccueilAdmin } from "./pages/admin/AccueilAdmin";
import { Evenements } from "./pages/admin/Evenements";
import { Evenement } from "./pages/admin/Evenement";
import { Sortie } from "./pages/admin/Sortie";
import { Etudiants } from "./pages/admin/Etudiants";
import { Etudiant } from "./pages/admin/Etudiant";
import { Parcours } from "./pages/admin/Parcours";

const LIENS_ETUDIANT = [
  { to: "/", label: "Événements" },
  { to: "/inscriptions", label: "Mes inscriptions" },
];

const LIENS_ADMIN = [
  { to: "/admin", label: "Accueil" },
  { to: "/admin/evenements", label: "Événements" },
  { to: "/admin/etudiants", label: "Étudiants" },
];

function Router() {
  const connecte = !!tokenStorage.get();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: api.getMe,
    enabled: connecte,
  });

  if (!connecte) {
    return (
      <Routes>
        <Route path="/connexion" element={<Connexion />} />
        <Route path="*" element={<Navigate to="/connexion" replace />} />
      </Routes>
    );
  }
  if (me.isPending) return <Chargement />;
  if (me.isError) return <Erreur error={me.error} />;

  if (me.data.role === "admin") {
    return (
      <Layout liens={LIENS_ADMIN} large>
        <Routes>
          <Route path="/admin" element={<AccueilAdmin />} />
          <Route path="/admin/evenements" element={<Evenements />} />
          <Route
            path="/admin/evenements/:evenementId"
            element={<Evenement />}
          />
          <Route path="/admin/sorties/:sortieId" element={<Sortie />} />
          <Route path="/admin/etudiants" element={<Etudiants />} />
          <Route path="/admin/etudiants/:etudiantId" element={<Etudiant />} />
          <Route path="/admin/parcours" element={<Parcours />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Layout>
    );
  }

  return (
    <Layout
      liens={LIENS_ETUDIANT}
      impersonation={
        tokenStorage.estEnImpersonation()
          ? `${me.data.etudiant.prenom} ${me.data.etudiant.nom}`
          : undefined
      }
    >
      <Routes>
        <Route path="/" element={<AccueilEtudiant me={me.data} />} />
        <Route path="/inscriptions" element={<MesInscriptions />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export { Router };
