"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CaristeSearchType,
  estTypeRechercheCariste,
  normaliserValeurRecherche,
  rechercherCariste,
  regrouperResultatsCariste,
  ResultatRecherche,
} from "@/lib/caristeSearch";

const libelles: Record<CaristeSearchType, string> = {
  commande: "Résultat par commande",
  reference: "Résultat par référence LM",
  rayon: "Résultat par rayon",
};

function messageAucunResultat(type: CaristeSearchType) {
  if (type === "reference") return "Aucun arrivage actif ne contient cette référence LM.";
  if (type === "rayon") return "Aucun arrivage actif pour ce rayon.";
  return "Aucune commande active trouvée.";
}

export default function ResultatCaristePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParametre = searchParams.get("type");
  const valeurParametre = searchParams.get("valeur") ?? "";
  const [resultats, setResultats] = useState<ResultatRecherche[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const type = estTypeRechercheCariste(typeParametre) ? typeParametre : null;
  const valeur = type ? normaliserValeurRecherche(type, valeurParametre) : null;
  const rechercheInvalide = !type || !valeur;

  useEffect(() => {
    if (!type || !valeur) return;

    let actif = true;

    rechercherCariste(type, valeur)
      .then((nouveauxResultats) => {
        if (!actif) return;
        setResultats(nouveauxResultats);
        if (nouveauxResultats.length === 0) setErreur(messageAucunResultat(type));
      })
      .catch((error: unknown) => {
        console.error(error);
        if (!actif) return;
        setErreur(error instanceof Error && error.message === "RAYON_INVALIDE"
          ? "Recherche invalide."
          : "Une erreur est survenue pendant la recherche.");
      })
      .finally(() => {
        if (actif) setChargement(false);
      });

    return () => {
      actif = false;
    };
  }, [type, valeur]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090D0F] pb-8 text-white sm:pb-10">
      <header className="border-b border-[#78BE20] bg-[#11181C] shadow-lg shadow-black/20">
        <div className="mx-auto flex w-full max-w-lg items-center gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-5">
          <Image src="/leroy-merlin-logo.svg" alt="Leroy Merlin" width={110} height={70} priority className="h-14 w-auto shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="text-xl font-black tracking-[0.16em]">DOCK<span className="text-[#78BE20]">FLOW</span></p>
            <p className="mt-1 text-xs font-bold tracking-[0.18em] text-[#AAB2B7]">MODE CARISTE</p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg px-3 py-4 sm:px-5 sm:py-6">
        <button onClick={() => router.push("/cariste")} className="mb-5 inline-flex min-h-14 items-center gap-2 rounded-2xl border border-white/[0.12] bg-[#11181C] px-5 text-base font-bold transition hover:bg-[#1A2226] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/50 sm:mb-6">
          <ArrowLeft size={20} aria-hidden="true" /> Retour
        </button>

        <section className="mb-5 rounded-2xl border border-white/[0.08] bg-[#11181C] p-4 shadow-xl shadow-black/20 sm:mb-6 sm:rounded-3xl sm:p-5">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#AAB2B7]">{type ? libelles[type] : "Résultat"}</p>
          <h1 className="mt-2 break-words text-3xl font-black tracking-wide sm:text-[2.1rem]">{valeur ?? valeurParametre ?? "Paramètres invalides"}</h1>
        </section>

        {rechercheInvalide ? (
          <div className="rounded-3xl border border-white/[0.08] bg-[#11181C] px-4 py-10 text-center text-[#AAB2B7]" role="alert">
            <p>Recherche invalide.</p>
            <button onClick={() => router.push("/cariste")} className="mt-5 min-h-12 rounded-2xl bg-[#78BE20] px-5 font-black text-white">Retour à la recherche</button>
          </div>
        ) : chargement ? (
          <div className="rounded-3xl border border-white/[0.08] bg-[#11181C] px-4 py-10 text-center text-[#AAB2B7]">Recherche en cours…</div>
        ) : erreur ? (
          <div className="rounded-3xl border border-white/[0.08] bg-[#11181C] px-4 py-10 text-center text-[#AAB2B7]" role="alert">
            <p>{erreur}</p>
            <button onClick={() => router.push("/cariste")} className="mt-5 min-h-12 rounded-2xl bg-[#78BE20] px-5 font-black text-white">Retour à la recherche</button>
          </div>
        ) : (
          <div className="space-y-4">
            {resultats.map(({ arrivage, lignes }) => {
              const lignesRegroupees = regrouperResultatsCariste(lignes);
              const rayon = arrivage.rayon ? `${arrivage.rayon.code} - ${arrivage.rayon.nom}` : null;

              return (
                <article key={arrivage.id} className="w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1A2226] sm:rounded-3xl">
                  <div className="border-b border-white/[0.08] p-4 sm:p-5">
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-[#AAB2B7]">Commande</p>
                    <p className="mt-1 break-words text-3xl font-black tracking-wide sm:text-[2.1rem]">{arrivage.commande}</p>
                    <p className="mt-4 text-[15px] text-[#AAB2B7]">Livraison : <span className="font-semibold text-white">{arrivage.date_arrivee ?? "-"}</span></p>
                    {rayon && <p className="mt-2 text-[15px] text-[#AAB2B7]">Rayon : <span className="font-semibold text-white">{rayon}</span></p>}
                    {arrivage.fournisseur && <p className="mt-2 break-words text-[15px] text-[#AAB2B7]">{arrivage.fournisseur}</p>}
                    <span className="mt-5 inline-block rounded-full bg-[#78BE20]/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#9bd754]">{arrivage.statut}</span>
                  </div>

                  <div className="space-y-3 p-3 sm:p-4">
                    {lignesRegroupees.map((ligne) => (
                      <div key={ligne.reference_lm} className="w-full rounded-2xl border border-white/[0.08] bg-[#222C31] p-4">
                        <p className="break-words text-2xl font-black tracking-wide">{ligne.reference_lm}</p>
                        <p className="mt-1 break-words text-[15px] text-[#AAB2B7] sm:text-base">{ligne.designation ?? "-"}</p>
                        <p className="mt-4 border-y border-white/[0.08] py-3 text-xl font-black text-[#9bd754]">Total palettes : {ligne.totalPalettes}</p>
                        <div className="mt-4 space-y-2">
                          {ligne.destinations.map((destination) => (
                            <div key={destination.destination ?? "sans-destination"} className="flex min-h-14 items-center justify-between gap-4 rounded-xl border-l-4 border-[#78BE20] bg-[#11181C] px-4">
                              <p className="min-w-0 break-words text-lg font-bold uppercase tracking-wide">{destination.destination ?? "-"}</p>
                              <p className="shrink-0 text-3xl font-black text-[#9bd754]">{destination.nombre_palettes}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <button onClick={() => router.push("/cariste")} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#78BE20] bg-[#11181C] px-5 text-lg font-black text-[#9bd754] transition hover:bg-[#1A2226] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/50 sm:mt-6">
          <Search size={20} aria-hidden="true" /> Nouvelle recherche
        </button>
      </div>
    </main>
  );
}
