"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2, PackageSearch, Search } from "lucide-react";
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

  async function rechercherParRayon(codeRayon: string) {
    if (!codeRayon) return;

    console.log(`[RAYON] Rayon sélectionné : ${codeRayon}`);

    const rayon = rayons.find((item) => item.code === codeRayon);
    console.log("[RAYON] Identifiant rayon résolu :", rayon?.id);

    if (!rayon) {
      return [];
    }

    const { data, error } = await supabase
      .from("arrivages")
      .select("*, rayon:rayons(id, code, nom)")
      .eq("rayon_id", rayon.id);

    if (error) throw error;

    const arrivagesBruts = (data ?? []) as Arrivage[];
    console.log("[RAYON] Arrivages bruts trouvés :", arrivagesBruts);

    const arrivagesActifs = arrivagesBruts.filter((arrivage) =>
      STATUTS_ACTIFS.includes(arrivage.statut as (typeof STATUTS_ACTIFS)[number])
    );
    console.log("[RAYON] Arrivages après filtre statut :", arrivagesActifs);

    return chargerLignes(arrivagesActifs);
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
    <main className="min-h-screen bg-[#090D0F] pb-10 text-white">
      <header className="border-b border-[#78BE20] bg-[#11181C] shadow-lg shadow-black/20">
        <div className="mx-auto flex max-w-lg items-center gap-5 px-5 py-5 sm:px-6">
          <Image
            src="/leroy-merlin-logo.svg"
            alt="Leroy Merlin"
            width={110}
            height={70}
            priority
            className="h-14 w-auto shrink-0 object-contain"
          />
          <div className="min-w-0">
            <p className="text-xl font-black tracking-[0.16em]">DOCK<span className="text-[#78BE20]">FLOW</span></p>
            <p className="mt-1 text-xs font-bold tracking-[0.18em] text-[#AAB2B7]">MODE CARISTE</p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        <h1 className="sr-only">
          Mode Cariste
        </h1>

        <div className="mb-6 space-y-3">
          <button
            onClick={() => void changerMode("reference")}
            aria-pressed={mode === "reference"}
            className={`flex min-h-[112px] w-full items-center rounded-3xl border px-5 text-left text-xl font-black tracking-wide transition after:ml-auto after:text-3xl after:font-normal after:content-['›'] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/50 ${
              mode === "reference" ? "border-[#9bd754] bg-[#78BE20] text-white shadow-inner shadow-[#4D8F12]" : "border-white/[0.08] bg-[#1A2226] text-white hover:bg-[#222C31]"
            }`}
          >
            <Search className={`mr-5 shrink-0 ${mode === "reference" ? "text-white" : "text-[#AAB2B7]"}`} size={42} aria-hidden="true" />
            <span className="mr-5 h-12 w-px shrink-0 bg-current opacity-25" />
            Référence LM
          </button>

          <button
            onClick={() => void changerMode("commande")}
            aria-pressed={mode === "commande"}
            className={`flex min-h-[112px] w-full items-center rounded-3xl border px-5 text-left text-xl font-black tracking-wide transition after:ml-auto after:text-3xl after:font-normal after:content-['›'] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/50 ${
              mode === "commande" ? "border-[#9bd754] bg-[#78BE20] text-white shadow-inner shadow-[#4D8F12]" : "border-white/[0.08] bg-[#1A2226] text-white hover:bg-[#222C31]"
            }`}
          >
            <PackageSearch className={`mr-5 shrink-0 ${mode === "commande" ? "text-white" : "text-[#AAB2B7]"}`} size={42} aria-hidden="true" />
            <span className="mr-5 h-12 w-px shrink-0 bg-current opacity-25" />
            Commande
          </button>

          <button
            onClick={() => void changerMode("rayon")}
            aria-pressed={mode === "rayon"}
            className={`flex min-h-[112px] w-full items-center rounded-3xl border px-5 text-left text-xl font-black tracking-wide transition after:ml-auto after:text-3xl after:font-normal after:content-['›'] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/50 ${
              mode === "rayon" ? "border-[#9bd754] bg-[#78BE20] text-white shadow-inner shadow-[#4D8F12]" : "border-white/[0.08] bg-[#1A2226] text-white hover:bg-[#222C31]"
            }`}
          >
            <Building2 className={`mr-5 shrink-0 ${mode === "rayon" ? "text-white" : "text-[#AAB2B7]"}`} size={42} aria-hidden="true" />
            <span className="mr-5 h-12 w-px shrink-0 bg-current opacity-25" />
            Rayon
          </button>
        </div>

        <div className="rounded-3xl border border-white/[0.08] bg-[#11181C] p-5 shadow-xl shadow-black/20">
          {mode === "rayon" ? (
            <div>
            <label htmlFor="rayon" className="mb-3 block text-sm font-bold uppercase tracking-[0.14em] text-[#AAB2B7]">Rayon</label>
            <select
              id="rayon"
              value={rayonSelectionne}
              onChange={(event) => {
                const codeRayon = event.target.value;
                setRayonSelectionne(codeRayon);
                if (codeRayon) void lancerRecherche(codeRayon);
              }}
              disabled={loadingRayons}
              className="w-full rounded-2xl border border-white/[0.12] bg-[#1A2226] p-4 text-lg text-white outline-none transition focus:border-[#78BE20] focus:ring-2 focus:ring-[#78BE20]/40 disabled:opacity-60"
            >
              <option value="">
                {loadingRayons ? "Chargement des rayons..." : "Sélectionner un rayon..."}
              </option>
              {rayons.map((rayon) => (
                <option key={rayon.id} value={rayon.code}>
                  {rayon.code} - {rayon.nom}
                </option>
              ))}
            </select>
            </div>
          ) : (
            <form onSubmit={soumettreRecherche}>
              <label htmlFor="recherche" className="mb-3 block text-sm font-bold uppercase tracking-[0.14em] text-[#AAB2B7]">
                {mode === "reference" ? "Référence LM" : "Numéro de commande"}
              </label>
              <input
                id="recherche"
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
                inputMode={mode === "reference" ? "numeric" : undefined}
                placeholder={
                  mode === "reference"
                    ? "Référence Leroy Merlin..."
                    : "Numéro de commande..."
                }
                className="w-full rounded-2xl border border-white/[0.12] bg-[#1A2226] p-4 text-lg text-white placeholder:text-[#AAB2B7] outline-none transition focus:border-[#78BE20] focus:ring-2 focus:ring-[#78BE20]/40"
              />

              <button
                type="submit"
                className="mt-5 min-h-14 w-full rounded-2xl bg-[#78BE20] py-4 text-lg font-black tracking-wide text-white shadow-lg shadow-[#4D8F12]/20 transition hover:bg-[#4D8F12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/50"
              >
                Rechercher
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-white/[0.08] bg-[#11181C] p-5 shadow-xl shadow-black/20" aria-live="polite">
          <h2 className="mb-4 text-xl font-bold">Résultat</h2>

          {loading ? (
            <div className="py-10 text-center text-[#AAB2B7]">Recherche...</div>
          ) : erreur ? (
            <div className="rounded-2xl border border-[#78BE20]/30 bg-[#1A2226] px-4 py-10 text-center text-[#AAB2B7]">{erreur}</div>
          ) : !rechercheEffectuee ? (
            <div className="rounded-2xl border border-dashed border-white/[0.12] px-4 py-10 text-center text-[#AAB2B7]">
              Choisissez un mode de recherche.
            </div>
          ) : (
            <div className="space-y-4">
              {resultats.map(({ arrivage, lignes }) => {
                const lignesRegroupees = regrouperLignes(lignes);
                const rayon = afficherRayon(arrivage);

                return (
                  <div key={arrivage.id} className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#1A2226]">
                    <div className="border-b border-white/[0.08] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#AAB2B7]">Commande</p>
                    <p className="mt-1 text-3xl font-black tracking-wide text-white">{arrivage.commande}</p>
                    <p className="mt-4 text-sm text-[#AAB2B7]">Livraison : <span className="font-semibold text-white">{arrivage.date_arrivee ?? "-"}</span></p>
                    {rayon && <p className="mt-2 text-sm text-[#AAB2B7]">Rayon : <span className="font-semibold text-white">{rayon}</span></p>}
                    {arrivage.fournisseur && <p className="mt-2 text-sm text-[#AAB2B7]">{arrivage.fournisseur}</p>}

                    <span className="mt-5 inline-block rounded-full bg-[#78BE20]/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#9bd754]">
                      {arrivage.statut}
                    </span>
                    </div>

                    <div className="space-y-3 p-4">
                      {lignesRegroupees.map((ligne) => (
                        <div key={ligne.reference_lm} className="rounded-2xl border border-white/[0.08] bg-[#222C31] p-4">
                          <p className="text-xl font-black tracking-wide text-white">{ligne.reference_lm}</p>
                          <p className="mt-1 text-sm text-[#AAB2B7]">{ligne.designation ?? "-"}</p>
                          <p className="mt-4 border-y border-white/[0.08] py-3 text-lg font-black text-[#9bd754]">
                            Total palettes : {ligne.totalPalettes}
                          </p>

                          <div className="mt-4 space-y-2">
                            {ligne.destinations.map((destination) => (
                              <div key={destination.destination ?? "sans-destination"} className="flex min-h-14 items-center justify-between rounded-xl border-l-4 border-[#78BE20] bg-[#11181C] px-4">
                                <p className="font-bold uppercase tracking-wide text-white">{destination.destination ?? "-"}</p>
                                <p className="text-2xl font-black text-[#9bd754]">{destination.nombre_palettes}</p>
                              </div>
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
