"use client";

import { Barcode, Hash, MapPin, Search } from "lucide-react";
import { useState } from "react";

type ModeRecherche = "commande" | "reference" | "rayon" | null;

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

  const modeActif = modesRecherche.find((mode) => mode.id === modeRecherche);

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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#78BE20] focus:ring-2 focus:ring-[#78BE20]/20"
                />
                <button
                  type="button"
                  className="rounded-xl bg-slate-100 px-4 text-slate-500"
                  aria-label={`Rechercher par ${modeActif.titre}`}
                >
                  <Search size={20} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
