"use client";

import { useState } from "react";
import {
  Barcode,
  Search,
  PackageSearch,
  Building2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { EanResolutionResult } from "@/lib/eanResolver";

type Arrivage = {
  id: string;
  commande: string;
  fournisseur: string | null;
  date_arrivee: string | null;
  statut: string;
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

type ResultatScanEAN = {
  arrivage: Arrivage;
  lignes: LigneArrivage[];
};

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
  const [mode, setMode] = useState<
    "ean" | "reference" | "commande" | "rayon"
  >("ean");

  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultats, setResultats] = useState<Arrivage[]>([]);
  const [lignes, setLignes] = useState<LigneArrivage[]>([]);
  const [ean, setEan] = useState("");
  const [rechercheEANEnCours, setRechercheEANEnCours] = useState(false);
  const [erreurEAN, setErreurEAN] = useState("");
  const [resultatsEAN, setResultatsEAN] = useState<ResultatScanEAN[]>([]);

  const lignesRegroupees = regrouperLignes(lignes);

  async function rechercherDepuisEAN() {
    const eanSaisi = ean.trim();
    if (!eanSaisi) {
      setErreurEAN("Saisissez ou scannez un code EAN.");
      return;
    }

    setRechercheEANEnCours(true);
    setErreurEAN("");
    setResultatsEAN([]);

    let resolution: EanResolutionResult;

    try {
      const response = await fetch(`/api/ean/resolve?ean=${encodeURIComponent(eanSaisi)}`);
      resolution = (await response.json()) as EanResolutionResult;
    } catch (error) {
      console.error("Erreur lors de la résolution EAN :", error);
      setErreurEAN(
        "La recherche automatique est temporairement indisponible. Utilisez la recherche par numéro de commande."
      );
      setRechercheEANEnCours(false);
      return;
    }

    if (!resolution.success) {
      setErreurEAN(resolution.message);
      setRechercheEANEnCours(false);
      return;
    }

    const { data: lignesTrouvees, error: erreurLignes } = await supabase
      .from("arrivage_lignes")
      .select("*")
      .eq("reference_lm", resolution.referenceLM);

    if (erreurLignes) {
      console.error("Erreur Supabase lors de la recherche EAN :", erreurLignes);
      setErreurEAN("Impossible de rechercher les arrivages correspondants.");
      setRechercheEANEnCours(false);
      return;
    }

    const lignesEAN = (lignesTrouvees ?? []) as LigneArrivage[];
    const idsArrivages = [...new Set(lignesEAN.map((ligne) => ligne.arrivage_id))];

    if (idsArrivages.length === 0) {
      setErreurEAN("Aucun arrivage en préparation ne contient cette référence.");
      setRechercheEANEnCours(false);
      return;
    }

    const { data: arrivagesTrouves, error: erreurArrivages } = await supabase
      .from("arrivages")
      .select("*")
      .in("id", idsArrivages)
      .in("statut", ["EN_PREPARATION", "PRET_A_RECEVOIR"]);

    if (erreurArrivages) {
      console.error("Erreur Supabase lors du chargement des arrivages :", erreurArrivages);
      setErreurEAN("Impossible de charger les arrivages correspondants.");
      setRechercheEANEnCours(false);
      return;
    }

    const arrivagesActifs = (arrivagesTrouves ?? []) as Arrivage[];
    const resultats = arrivagesActifs.map((arrivage) => ({
      arrivage,
      lignes: lignesEAN.filter((ligne) => ligne.arrivage_id === arrivage.id),
    }));

    console.log(`[EAN] Recherche Supabase terminée : ${resultats.length} commande(s) trouvée(s)`);

    if (resultats.length === 0) {
      setErreurEAN("Aucun arrivage en préparation ne contient cette référence.");
    } else {
      setResultatsEAN(resultats);
    }

    setRechercheEANEnCours(false);
  }

  async function rechercher() {
    console.log("Recherche lancée");

    if (!recherche.trim()) return;

    setLoading(true);
    setLignes([]);

    let query = supabase
      .from("arrivages")
      .select("*");

    switch (mode) {
      case "commande":
        query = query.eq("commande", recherche);
        break;

      case "reference":
        query = query.eq("reference_lm", recherche);
        break;

      case "rayon":
        query = query.eq("rayon_id", Number(recherche));
        break;

      case "ean":
        // Sera branché plus tard
        query = query.eq("ean", recherche);
        break;
    }

    const { data: arrivageTrouve, error: erreurArrivage } = await query;
    let lignesData = null;
    let error = erreurArrivage;

    if (mode === "commande" && arrivageTrouve?.[0]) {
      const { data, error: erreurLignes } = await supabase
        .from("arrivage_lignes")
        .select("*")
        .eq("arrivage_id", arrivageTrouve[0].id);

      lignesData = data as LigneArrivage[] | null;
      error = erreurLignes ?? erreurArrivage;

      if (!erreurLignes) {
        setLignes(lignesData ?? []);
      }
    }

    console.log("arrivageTrouve", arrivageTrouve);
    console.log("lignesData", lignesData);
    console.log("error", error);

    if (erreurArrivage) {
      console.error(erreurArrivage);
      setResultats([]);
    } else {
      setResultats(arrivageTrouve as Arrivage[]);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-100">

      <div className="max-w-xl mx-auto p-6">

        <h1 className="text-4xl font-bold text-[#78BE20] mb-8">
          Mode Cariste
        </h1>

        <section className="mb-8 rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-xl font-bold">Scanner un produit</h2>

          <input
            value={ean}
            onChange={(event) => setEan(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                rechercherDepuisEAN();
              }
            }}
            inputMode="numeric"
            placeholder="Scanner ou saisir un code EAN"
            className="mt-4 w-full rounded-xl border p-4 text-xl"
          />

          <button
            type="button"
            onClick={rechercherDepuisEAN}
            disabled={rechercheEANEnCours}
            className="mt-5 w-full rounded-xl bg-[#78BE20] py-4 text-lg font-bold text-white hover:bg-[#63a71b] disabled:opacity-60"
          >
            Rechercher
          </button>

          {rechercheEANEnCours && (
            <p className="mt-4 text-slate-600">Recherche du produit…</p>
          )}

          {erreurEAN && (
            <p className="mt-4 text-red-700">{erreurEAN}</p>
          )}

          {resultatsEAN.length > 0 && (
            <div className="mt-6 space-y-4 border-t pt-5">
              {resultatsEAN.map(({ arrivage, lignes: lignesArrivage }) => {
                const lignesParReference = regrouperLignes(lignesArrivage);

                return (
                  <div key={arrivage.id} className="rounded-xl border p-5">
                    <p className="text-lg font-bold">Commande {arrivage.commande}</p>
                    <p>Fournisseur : {arrivage.fournisseur ?? "-"}</p>
                    <p>Livraison : {arrivage.date_arrivee ?? "-"}</p>

                    <div className="mt-4 space-y-3">
                      {lignesParReference.map((ligne) => (
                        <div key={ligne.reference_lm} className="rounded-lg border p-4">
                          <p className="font-bold">Référence {ligne.reference_lm}</p>
                          <p>{ligne.designation ?? "-"}</p>
                          <p className="mt-2 font-semibold">
                            {ligne.totalPalettes} palettes au total
                          </p>
                          {ligne.destinations.map((destination) => (
                            <p key={destination.destination ?? "sans-destination"}>
                              {destination.destination ?? "-"} : {destination.nombre_palettes}{" "}
                              {destination.nombre_palettes === 1 ? "palette" : "palettes"}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 gap-4 mb-8">

          <button
            onClick={() => setMode("ean")}
            className={`rounded-2xl p-5 font-bold transition ${
              mode === "ean"
                ? "bg-[#78BE20] text-white"
                : "bg-white"
            }`}
          >
            <Barcode
              className="mx-auto mb-3"
              size={34}
            />
            Scanner EAN
          </button>

          <button
            onClick={() => setMode("reference")}
            className={`rounded-2xl p-5 font-bold transition ${
              mode === "reference"
                ? "bg-[#78BE20] text-white"
                : "bg-white"
            }`}
          >
            <Search
              className="mx-auto mb-3"
              size={34}
            />
            Référence LM
          </button>

          <button
            onClick={() => setMode("commande")}
            className={`rounded-2xl p-5 font-bold transition ${
              mode === "commande"
                ? "bg-[#78BE20] text-white"
                : "bg-white"
            }`}
          >
            <PackageSearch
              className="mx-auto mb-3"
              size={34}
            />
            Commande
          </button>

          <button
            onClick={() => setMode("rayon")}
            className={`rounded-2xl p-5 font-bold transition ${
              mode === "rayon"
                ? "bg-[#78BE20] text-white"
                : "bg-white"
            }`}
          >
            <Building2
              className="mx-auto mb-3"
              size={34}
            />
            Rayon
          </button>

        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">

          <input
            value={recherche}
            onChange={(e) =>
              setRecherche(e.target.value)
            }
            placeholder={
              mode === "ean"
                ? "Scanner un code EAN..."
                : mode === "reference"
                ? "Référence Leroy Merlin..."
                : mode === "commande"
                ? "Numéro de commande..."
                : "Code rayon..."
            }
            className="w-full rounded-xl border p-4 text-xl"
          />

          <button
            onClick={rechercher}
            className="w-full mt-5 rounded-xl bg-[#78BE20] text-white py-4 font-bold text-lg hover:bg-[#63a71b]"
          >
            Rechercher
          </button>

        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-xl">

          <h2 className="font-bold text-xl mb-4">
            Résultat
          </h2>

          {loading ? (

            <div className="text-center py-10">
              Recherche...
            </div>

          ) : resultats.length === 0 ? (

            <div className="text-slate-400 text-center py-12">
              Aucun résultat
            </div>

          ) : (

            <div className="space-y-4">

              {resultats.map((r) => (

                <div
                  key={r.id}
                  className="rounded-xl border p-5"
                >

                  <p className="font-bold text-lg">
                    Commande {r.commande}
                  </p>

                  <p>
                    Fournisseur :
                    {" "}
                    {r.fournisseur ?? "-"}
                  </p>

                  <p>
                    Livraison :
                    {" "}
                    {r.date_arrivee ?? "-"}
                  </p>

                  <span className="inline-block mt-3 rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                    {r.statut}
                  </span>

                  {mode === "commande" && (
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
                  )}

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </main>
  );
}
