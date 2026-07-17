"use client";

import { useState } from "react";
import {
  Barcode,
  Search,
  PackageSearch,
  Building2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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

export default function CaristePage() {
  const [mode, setMode] = useState<
    "ean" | "reference" | "commande" | "rayon"
  >("ean");

  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultats, setResultats] = useState<Arrivage[]>([]);
  const [lignes, setLignes] = useState<LigneArrivage[]>([]);

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
                      {(() => {
                        console.log("state lignes", lignes);

                        return lignes.map((ligne) => (
                          <div key={ligne.id} className="rounded-lg border p-4">
                            <p className="font-bold">{ligne.reference_lm}</p>
                            <p>{ligne.designation ?? "-"}</p>
                            <p>Destination : {ligne.destination ?? "-"}</p>
                            <p>Palettes : {ligne.nombre_palettes}</p>
                          </div>
                        ));
                      })()}
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
