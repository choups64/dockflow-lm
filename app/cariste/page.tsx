"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2, PackageSearch, Search } from "lucide-react";
import { RayonsService } from "@/services/rayons";
import MobileDebug from "@/components/cariste/MobileDebug";
import {
  CaristeSearchType,
  normaliserValeurRecherche,
  Rayon,
} from "@/lib/caristeSearch";

export default function CaristePage() {
  const router = useRouter();
  const [mode, setMode] = useState<CaristeSearchType>("commande");
  const [recherche, setRecherche] = useState("");
  const [rayonSelectionne, setRayonSelectionne] = useState("");
  const [rayons, setRayons] = useState<Rayon[]>([]);
  const [loadingRayons, setLoadingRayons] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function changerMode(nouveauMode: CaristeSearchType) {
    setMode(nouveauMode);
    setRecherche("");
    setRayonSelectionne("");
    setErreur(null);

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

  function lancerRecherche() {
    const valeur = normaliserValeurRecherche(
      mode,
      mode === "rayon" ? rayonSelectionne : recherche
    );

    if (!valeur) {
      setErreur(
        mode === "reference"
          ? "La référence LM doit contenir exactement 8 chiffres."
          : mode === "rayon"
            ? "Veuillez sélectionner un rayon."
            : "Veuillez saisir un numéro de commande."
      );
      return;
    }

    setErreur(null);
    router.push(`/cariste/resultat?type=${mode}&valeur=${encodeURIComponent(valeur)}`);
  }

  function soumettreRecherche(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    lancerRecherche();
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090D0F] pb-8 text-white sm:pb-10">
      <header className="border-b border-[#78BE20] bg-[#11181C] shadow-lg shadow-black/20">
        <div className="flex w-full items-center gap-4 px-3 py-4 sm:mx-auto sm:max-w-lg sm:gap-5 sm:px-5 sm:py-5">
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

      <div className="w-full px-3 py-4 sm:mx-auto sm:max-w-lg sm:px-5 sm:py-6">
        <h1 className="sr-only">Mode Cariste</h1>

        <div className="mb-5 space-y-3 sm:mb-6">
          <button
            onClick={() => void changerMode("reference")}
            aria-pressed={mode === "reference"}
            className={`flex min-h-[104px] w-full items-center rounded-2xl border px-4 text-left text-[1.35rem] font-black tracking-wide transition after:ml-auto after:text-3xl after:font-normal after:content-['›'] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/50 sm:min-h-[112px] sm:rounded-3xl sm:px-5 ${
              mode === "reference" ? "border-[#9bd754] bg-[#78BE20] text-white shadow-inner shadow-[#4D8F12]" : "border-white/[0.08] bg-[#1A2226] text-white hover:bg-[#222C31]"
            }`}
          >
            <Search className={`mr-4 shrink-0 ${mode === "reference" ? "text-white" : "text-[#AAB2B7]"}`} size={42} aria-hidden="true" />
            <span className="mr-4 h-12 w-px shrink-0 bg-current opacity-25" />
            Référence LM
          </button>

          <button
            onClick={() => void changerMode("commande")}
            aria-pressed={mode === "commande"}
            className={`flex min-h-[104px] w-full items-center rounded-2xl border px-4 text-left text-[1.35rem] font-black tracking-wide transition after:ml-auto after:text-3xl after:font-normal after:content-['›'] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/50 sm:min-h-[112px] sm:rounded-3xl sm:px-5 ${
              mode === "commande" ? "border-[#9bd754] bg-[#78BE20] text-white shadow-inner shadow-[#4D8F12]" : "border-white/[0.08] bg-[#1A2226] text-white hover:bg-[#222C31]"
            }`}
          >
            <PackageSearch className={`mr-4 shrink-0 ${mode === "commande" ? "text-white" : "text-[#AAB2B7]"}`} size={42} aria-hidden="true" />
            <span className="mr-4 h-12 w-px shrink-0 bg-current opacity-25" />
            Commande
          </button>

          <button
            onClick={() => void changerMode("rayon")}
            aria-pressed={mode === "rayon"}
            className={`flex min-h-[104px] w-full items-center rounded-2xl border px-4 text-left text-[1.35rem] font-black tracking-wide transition after:ml-auto after:text-3xl after:font-normal after:content-['›'] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/50 sm:min-h-[112px] sm:rounded-3xl sm:px-5 ${
              mode === "rayon" ? "border-[#9bd754] bg-[#78BE20] text-white shadow-inner shadow-[#4D8F12]" : "border-white/[0.08] bg-[#1A2226] text-white hover:bg-[#222C31]"
            }`}
          >
            <Building2 className={`mr-4 shrink-0 ${mode === "rayon" ? "text-white" : "text-[#AAB2B7]"}`} size={42} aria-hidden="true" />
            <span className="mr-4 h-12 w-px shrink-0 bg-current opacity-25" />
            Rayon
          </button>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#11181C] p-4 shadow-xl shadow-black/20 sm:rounded-3xl sm:p-5">
          {mode === "rayon" ? (
            <form onSubmit={soumettreRecherche}>
              <label htmlFor="rayon" className="mb-3 block text-sm font-bold uppercase tracking-[0.14em] text-[#AAB2B7]">Rayon</label>
              <select
                id="rayon"
                value={rayonSelectionne}
                onChange={(event) => setRayonSelectionne(event.target.value)}
                disabled={loadingRayons}
                className="min-h-14 w-full rounded-2xl border border-white/[0.12] bg-[#1A2226] p-4 text-lg text-white outline-none transition focus:border-[#78BE20] focus:ring-2 focus:ring-[#78BE20]/40 disabled:opacity-60"
              >
                <option value="">{loadingRayons ? "Chargement des rayons..." : "Sélectionner un rayon..."}</option>
                {rayons.map((rayon) => (
                  <option key={rayon.id} value={rayon.code}>{rayon.code} - {rayon.nom}</option>
                ))}
              </select>
              <button type="submit" className="mt-4 min-h-14 w-full rounded-2xl bg-[#78BE20] py-4 text-lg font-black tracking-wide text-white shadow-lg shadow-[#4D8F12]/20 transition hover:bg-[#4D8F12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/50">
                Rechercher
              </button>
            </form>
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
                placeholder={mode === "reference" ? "Référence Leroy Merlin..." : "Numéro de commande..."}
                className="min-h-14 w-full rounded-2xl border border-white/[0.12] bg-[#1A2226] p-4 text-lg text-white placeholder:text-[#AAB2B7] outline-none transition focus:border-[#78BE20] focus:ring-2 focus:ring-[#78BE20]/40"
              />
              <button type="submit" className="mt-4 min-h-14 w-full rounded-2xl bg-[#78BE20] py-4 text-lg font-black tracking-wide text-white shadow-lg shadow-[#4D8F12]/20 transition hover:bg-[#4D8F12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/50">
                Rechercher
              </button>
            </form>
          )}

          {erreur && <p className="mt-4 rounded-2xl border border-[#78BE20]/30 bg-[#1A2226] p-4 text-center text-[#AAB2B7]" role="alert">{erreur}</p>}
        </div>
      </div>
      <MobileDebug />
    </main>
  );
}
