"use client";

import { useState } from "react";
import { Search, PackageSearch, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RayonsService } from "@/services/rayons";

type ModeRecherche = "reference" | "commande" | "rayon";

type Arrivage = {
  id: string;
  commande: string;
  fournisseur: string | null;
  date_arrivee: string | null;
  statut: string;
  rayon_id: number | null;
  rayon: Rayon | null;
};

type LigneArrivage = {
  id: string;
  arrivage_id: string;
  reference_lm: string;
  designation: string | null;
  quantite: number;
  destination: string | null;
  ean: string | null;
  created_at: string;
  nombre_palettes: number;
};

type Rayon = {
  id: number;
  code: string;
  nom: string;
};

type DestinationRegroupee = {
  destination: string | null;
  nombre_palettes: number;
};

type LigneRegroupee = {
  reference_lm: string;
  designation: string | null;
  totalPalettes: number;
  destinations: DestinationRegroupee[];
};

type ResultatRecherche = {
  arrivage: Arrivage;
  lignes: LigneArrivage[];
};

const STATUTS_ACTIFS = [
  "EN_PREPARATION",
  "PREPARATION",
  "PRET_A_RECEVOIR",
] as const;

function regrouperLignes(lignes: LigneArrivage[]): LigneRegroupee[] {
  return Array.from(
    lignes.reduce((groupes, ligne) => {
      const palettes = Number(ligne.nombre_palettes);
      const nombrePalettes = Number.isFinite(palettes) ? palettes : 0;
      let groupe = groupes.get(ligne.reference_lm);

      if (!groupe) {
        groupe = {
          reference_lm: ligne.reference_lm,
          designation: ligne.designation,
          totalPalettes: 0,
          destinations: [],
        };
        groupes.set(ligne.reference_lm, groupe);
      }

      const destinationExistante = groupe.destinations.find(
        (destination) => destination.destination === ligne.destination
      );

      if (destinationExistante) {
        destinationExistante.nombre_palettes += nombrePalettes;
      } else {
        groupe.destinations.push({
          destination: ligne.destination,
          nombre_palettes: nombrePalettes,
        });
      }

      groupe.totalPalettes += nombrePalettes;
      return groupes;
    }, new Map<string, LigneRegroupee>()).values()
  );
}

export default function CaristePage() {
  const [mode, setMode] = useState<ModeRecherche>("commande");
  const [recherche, setRecherche] = useState("");
  const [rayonSelectionne, setRayonSelectionne] = useState("");
  const [rayons, setRayons] = useState<Rayon[]>([]);
  const [loadingRayons, setLoadingRayons] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultats, setResultats] = useState<ResultatRecherche[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [rechercheEffectuee, setRechercheEffectuee] = useState(false);

  function reinitialiserResultats() {
    setRecherche("");
    setRayonSelectionne("");
    setResultats([]);
    setErreur(null);
    setRechercheEffectuee(false);
  }

  async function changerMode(nouveauMode: ModeRecherche) {
    setMode(nouveauMode);
    reinitialiserResultats();

    if (nouveauMode === "rayon" && rayons.length === 0) {
      setLoadingRayons(true);
      const { data, error } = await RayonsService.getAll();
      setLoadingRayons(false);

      if (error) {
        console.error(error);
        setErreur("Une erreur est survenue pendant le chargement des rayons.");
        return;
      }

      setRayons((data ?? []) as Rayon[]);
    }
  }

  async function chargerLignes(arrivages: Arrivage[], referenceLM?: string) {
    if (arrivages.length === 0) {
      return [];
    }

    let query = supabase
      .from("arrivage_lignes")
      .select("*")
      .in(
        "arrivage_id",
        arrivages.map((arrivage) => arrivage.id)
      );

    if (referenceLM) {
      query = query.eq("reference_lm", referenceLM);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const lignes = (data ?? []) as LigneArrivage[];
    return arrivages.map((arrivage) => ({
      arrivage,
      lignes: lignes.filter((ligne) => ligne.arrivage_id === arrivage.id),
    }));
  }

  async function rechercherParCommande() {
    const numeroCommande = recherche.trim();
    if (!numeroCommande) return;

    const { data, error } = await supabase
      .from("arrivages")
      .select("*, rayon:rayons(id, code, nom)")
      .eq("commande", numeroCommande);

    if (error) throw error;
    return chargerLignes((data ?? []) as Arrivage[]);
  }

  async function rechercherParReference() {
    const referenceLM = recherche.replace(/\s+/g, "");

    if (!/^\d{8}$/.test(referenceLM)) {
      setErreur("La référence LM doit contenir exactement 8 chiffres.");
      return null;
    }

    const { data: lignesReference, error: erreurLignes } = await supabase
      .from("arrivage_lignes")
      .select("arrivage_id")
      .eq("reference_lm", referenceLM);

    if (erreurLignes) throw erreurLignes;

    const arrivageIds = [
      ...new Set((lignesReference ?? []).map((ligne) => ligne.arrivage_id)),
    ];

    if (arrivageIds.length === 0) return [];

    const { data, error } = await supabase
      .from("arrivages")
      .select("*, rayon:rayons(id, code, nom)")
      .in("id", arrivageIds)
      .in("statut", STATUTS_ACTIFS);

    if (error) throw error;
    return chargerLignes((data ?? []) as Arrivage[], referenceLM);
  }

  async function rechercherParRayon(rayonId: string) {
    if (!rayonId) return;

    const { data, error } = await supabase
      .from("arrivages")
      .select("*, rayon:rayons(id, code, nom)")
      .eq("rayon_id", Number(rayonId))
      .in("statut", STATUTS_ACTIFS);

    if (error) throw error;
    return chargerLignes((data ?? []) as Arrivage[]);
  }

  async function lancerRecherche(rayonId?: string) {
    setErreur(null);
    setResultats([]);
    setRechercheEffectuee(false);
    setLoading(true);

    try {
      const nouveauxResultats =
        mode === "reference"
          ? await rechercherParReference()
          : mode === "commande"
            ? await rechercherParCommande()
            : await rechercherParRayon(rayonId ?? rayonSelectionne);

      if (nouveauxResultats === null || nouveauxResultats === undefined) {
        return;
      }

      setResultats(nouveauxResultats);
      setRechercheEffectuee(true);

      if (nouveauxResultats.length === 0) {
        setErreur(
          mode === "reference"
            ? "Aucun arrivage actif ne contient cette référence LM."
            : mode === "rayon"
              ? "Aucun arrivage actif pour ce rayon."
              : "Aucun résultat"
        );
      }
    } catch (error) {
      console.error(error);
      setErreur("Une erreur est survenue pendant la recherche. Réessayez.");
      setRechercheEffectuee(true);
    } finally {
      setLoading(false);
    }
  }

  function soumettreRecherche(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void lancerRecherche();
  }

  function afficherRayon(arrivage: Arrivage) {
    const rayon = arrivage.rayon ?? rayons.find((item) => item.id === arrivage.rayon_id);
    return rayon ? `${rayon.code} - ${rayon.nom}` : null;
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-xl p-6">
        <h1 className="mb-8 text-4xl font-bold text-[#78BE20]">
          Mode Cariste
        </h1>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={() => void changerMode("reference")}
            className={`rounded-2xl p-5 font-bold transition ${
              mode === "reference" ? "bg-[#78BE20] text-white" : "bg-white"
            }`}
          >
            <Search className="mx-auto mb-3" size={34} />
            Référence LM
          </button>

          <button
            onClick={() => void changerMode("commande")}
            className={`rounded-2xl p-5 font-bold transition ${
              mode === "commande" ? "bg-[#78BE20] text-white" : "bg-white"
            }`}
          >
            <PackageSearch className="mx-auto mb-3" size={34} />
            Commande
          </button>

          <button
            onClick={() => void changerMode("rayon")}
            className={`rounded-2xl p-5 font-bold transition ${
              mode === "rayon" ? "bg-[#78BE20] text-white" : "bg-white"
            }`}
          >
            <Building2 className="mx-auto mb-3" size={34} />
            Rayon
          </button>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl">
          {mode === "rayon" ? (
            <select
              value={rayonSelectionne}
              onChange={(event) => {
                const rayonId = event.target.value;
                setRayonSelectionne(rayonId);
                if (rayonId) void lancerRecherche(rayonId);
              }}
              disabled={loadingRayons}
              className="w-full rounded-xl border p-4 text-xl"
            >
              <option value="">
                {loadingRayons ? "Chargement des rayons..." : "Sélectionner un rayon..."}
              </option>
              {rayons.map((rayon) => (
                <option key={rayon.id} value={rayon.id}>
                  {rayon.code} - {rayon.nom}
                </option>
              ))}
            </select>
          ) : (
            <form onSubmit={soumettreRecherche}>
              <input
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
                inputMode={mode === "reference" ? "numeric" : undefined}
                placeholder={
                  mode === "reference"
                    ? "Référence Leroy Merlin..."
                    : "Numéro de commande..."
                }
                className="w-full rounded-xl border p-4 text-xl"
              />

              <button
                type="submit"
                className="mt-5 w-full rounded-xl bg-[#78BE20] py-4 text-lg font-bold text-white hover:bg-[#63a71b]"
              >
                Rechercher
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-bold">Résultat</h2>

          {loading ? (
            <div className="py-10 text-center">Recherche...</div>
          ) : erreur ? (
            <div className="py-12 text-center text-slate-500">{erreur}</div>
          ) : !rechercheEffectuee ? (
            <div className="py-12 text-center text-slate-400">
              Choisissez un mode de recherche.
            </div>
          ) : (
            <div className="space-y-4">
              {resultats.map(({ arrivage, lignes }) => {
                const lignesRegroupees = regrouperLignes(lignes);
                const rayon = afficherRayon(arrivage);

                return (
                  <div key={arrivage.id} className="rounded-xl border p-5">
                    <p className="text-lg font-bold">Commande {arrivage.commande}</p>
                    <p>Fournisseur : {arrivage.fournisseur ?? "-"}</p>
                    <p>Livraison : {arrivage.date_arrivee ?? "-"}</p>
                    {rayon && <p>Rayon : {rayon}</p>}

                    <span className="mt-3 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                      {arrivage.statut}
                    </span>

                    <div className="mt-5 space-y-3 border-t pt-4">
                      {lignesRegroupees.map((ligne) => (
                        <div key={ligne.reference_lm} className="rounded-lg border p-4">
                          <p className="font-bold">{ligne.reference_lm}</p>
                          <p>{ligne.designation ?? "-"}</p>
                          <p className="mt-3 font-semibold">
                            Total palettes : {ligne.totalPalettes}
                          </p>

                          <div className="mt-3 space-y-1">
                            {ligne.destinations.map((destination) => (
                              <p key={destination.destination ?? "sans-destination"}>
                                {destination.destination ?? "-"} : {destination.nombre_palettes}{" "}
                                {destination.nombre_palettes === 1 ? "palette" : "palettes"}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
