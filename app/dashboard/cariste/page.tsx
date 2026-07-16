"use client";

import { Barcode, Hash, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type ModeRecherche = "commande" | "reference" | "rayon" | null;

type Arrivage = {
  id: string;
  commande: string;
  fournisseur: string | null;
  date_arrivee: string | null;
};

type ArrivageDestination = {
  id: string;
  reference_lm: string;
  designation: string | null;
  nombre_palettes: number;
  destination: string | null;
};

const modesRecherche = [
  {
    id: "commande",
    titre: "Numéro de commande",
    description: "Retrouvez les palettes d'une commande.",
    placeholder: "Saisir un numéro de commande",
    icon: Hash,
  },
  {
    id: "reference",
    titre: "Référence LM",
    description: "Recherchez une référence produit.",
    placeholder: "Saisir une référence LM",
    icon: Barcode,
  },
  {
    id: "rayon",
    titre: "Rayon",
    description: "Consultez les palettes d'un rayon.",
    placeholder: "Saisir un numéro de rayon",
    icon: MapPin,
  },
] as const;

export default function CaristePage() {
  const [modeRecherche, setModeRecherche] = useState<ModeRecherche>(null);
  const [recherche, setRecherche] = useState("");
  const [arrivage, setArrivage] = useState<Arrivage | null>(null);
  const [destinations, setDestinations] = useState<ArrivageDestination[]>([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [erreurRecherche, setErreurRecherche] = useState("");

  const modeActif = modesRecherche.find((mode) => mode.id === modeRecherche);

  async function rechercherCommande() {
    const numeroCommande = recherche.trim();
    if (!numeroCommande) return;

    setRechercheEnCours(true);
    setErreurRecherche("");
    setArrivage(null);
    setDestinations([]);

    const { data: arrivageTrouve, error: erreurArrivage } = await supabase
      .from("arrivages")
      .select("id, commande, fournisseur, date_arrivee")
      .eq("commande", numeroCommande)
      .maybeSingle();

    if (erreurArrivage || !arrivageTrouve) {
      setErreurRecherche("Aucune commande trouvée.");
      setRechercheEnCours(false);
      return;
    }

    const { data: destinationsTrouvees, error: erreurDestinations } = await supabase
      .from("arrivage_destinations")
      .select("id, reference_lm, designation, nombre_palettes, destination")
      .eq("arrivage_id", arrivageTrouve.id);

    if (erreurDestinations) {
      setErreurRecherche("Impossible de charger les lignes de la commande.");
      setRechercheEnCours(false);
      return;
    }

    setArrivage(arrivageTrouve as Arrivage);
    setDestinations((destinationsTrouvees ?? []) as ArrivageDestination[]);
    setRechercheEnCours(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Module Cariste
          </p>
          <h1 className="text-3xl font-bold text-[#78BE20]">
            Rechercher une palette
          </h1>
          <p className="mt-2 text-slate-600">
            Choisissez un mode de recherche pour commencer.
          </p>
        </header>

        <button
          type="button"
          onClick={() => setModeRecherche(null)}
          className="flex w-full items-center justify-center gap-4 rounded-3xl bg-[#78BE20] px-8 py-8 text-xl font-bold text-white shadow-sm transition hover:bg-[#63a71b]"
        >
          <Barcode size={32} />
          Scanner un EAN
        </button>

        <section className="mt-10">
          <h2 className="mb-5 text-lg font-semibold text-slate-700">
            Ou rechercher par :
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            {modesRecherche.map(({ id, titre, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setModeRecherche(id)}
                className={`rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:border-[#78BE20] hover:shadow-md ${
                  modeRecherche === id
                    ? "border-[#78BE20] ring-2 ring-[#78BE20]/20"
                    : "border-slate-200"
                }`}
              >
                <span className="mb-5 inline-flex rounded-xl bg-[#78BE20]/10 p-3 text-[#78BE20]">
                  <Icon size={24} />
                </span>
                <h3 className="text-lg font-bold text-slate-800">{titre}</h3>
                <p className="mt-2 text-sm text-slate-500">{description}</p>
              </button>
            ))}
          </div>

          {modeActif && (
            <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
              <label className="mb-3 block font-semibold text-slate-700">
                {modeActif.titre}
              </label>
              <div className="flex gap-3">
                <input
                  type="search"
                  placeholder={modeActif.placeholder}
                  value={recherche}
                  onChange={(event) => setRecherche(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && modeRecherche === "commande") {
                      rechercherCommande();
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#78BE20] focus:ring-2 focus:ring-[#78BE20]/20"
                />
                <button
                  type="button"
                  onClick={modeRecherche === "commande" ? rechercherCommande : undefined}
                  disabled={modeRecherche !== "commande" || rechercheEnCours}
                  className="rounded-xl bg-slate-100 px-4 text-slate-500"
                  aria-label={`Rechercher par ${modeActif.titre}`}
                >
                  <Search size={20} />
                </button>
              </div>
            </div>
          )}

          {rechercheEnCours && (
            <p className="mt-6 text-sm font-medium text-slate-500">
              Recherche de la commande...
            </p>
          )}

          {erreurRecherche && (
            <p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
              {erreurRecherche}
            </p>
          )}

          {arrivage && (
            <section className="mt-8">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-[#78BE20]">
                  Commande {arrivage.commande}
                </h2>
                <p className="mt-3 text-slate-700">
                  Fournisseur : {arrivage.fournisseur ?? "-"}
                </p>
                <p className="text-slate-700">
                  Livraison : {arrivage.date_arrivee ?? "-"}
                </p>
              </div>

              <div className="my-6 border-t border-slate-300" />

              <div className="space-y-4">
                {destinations.map((ligne) => (
                  <button
                    key={ligne.id}
                    type="button"
                    className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-[#78BE20] hover:shadow-md"
                  >
                    <h3 className="text-xl font-bold text-slate-800">
                      {ligne.reference_lm}
                    </h3>
                    <p className="mt-1 text-slate-600">
                      {ligne.designation ?? "-"}
                    </p>
                    <p className="mt-4 font-semibold text-slate-700">
                      {ligne.nombre_palettes} palettes
                    </p>
                    <p className="text-[#78BE20]">{ligne.destination ?? "-"}</p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
