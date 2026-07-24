"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import MobileDebug from "@/components/cariste/MobileDebug";
import { supabase } from "@/lib/supabase";
import {
  CaristeSearchType,
  estTypeRechercheCariste,
  normaliserValeurRecherche,
  rechercherCariste,
  regrouperResultatsCariste,
  ResultatRecherche,
} from "@/lib/caristeSearch";

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
  const [arrivageAReceptionner, setArrivageAReceptionner] = useState<ResultatRecherche["arrivage"] | null>(null);
  const [receptionEnCours, setReceptionEnCours] = useState(false);
  const [erreurReception, setErreurReception] = useState<string | null>(null);

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

  async function confirmerReception() {
    if (!arrivageAReceptionner) return;

    setReceptionEnCours(true);
    setErreurReception(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const response = await fetch(`/api/cariste/arrivages/${arrivageAReceptionner.id}/reception`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionData.session?.access_token ?? ""}` },
    });
    const result = await response.json() as { error?: string };

    if (!response.ok) {
      const message = result.error ?? "Une erreur est survenue pendant la réception.";
      setErreurReception(message);
      toast.error(`Impossible de réceptionner cette commande : ${message}`);
      setReceptionEnCours(false);
      return;
    }

    setResultats((precedents) =>
      precedents.map((resultat) =>
        resultat.arrivage.id === arrivageAReceptionner.id
          ? { ...resultat, arrivage: { ...resultat.arrivage, statut: "RECEPTIONNEE" } }
          : resultat
      )
    );
    setArrivageAReceptionner(null);
    setReceptionEnCours(false);
    toast.success("Commande réceptionnée avec succès.");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090D0F] pb-8 text-white sm:pb-10">
      <header className="border-b border-[#78BE20] bg-[#11181C] shadow-lg shadow-black/20">
        <div className="flex w-full items-center gap-4 px-3 py-4 sm:mx-auto sm:max-w-lg sm:gap-5 sm:px-5 sm:py-5">
          <Image src="/leroy-merlin-logo.svg" alt="Leroy Merlin" width={110} height={70} priority className="h-14 w-auto shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="text-xl font-black tracking-[0.16em]">DOCK<span className="text-[#78BE20]">FLOW</span></p>
            <p className="mt-1 text-xs font-bold tracking-[0.18em] text-[#AAB2B7]">MODE CARISTE</p>
          </div>
        </div>
      </header>

      <div className="w-full px-3 py-4 sm:mx-auto sm:max-w-lg sm:px-5 sm:py-6">
        <button onClick={() => router.push("/cariste")} className="mb-5 inline-flex min-h-14 items-center gap-2 rounded-2xl border border-white/[0.12] bg-[#11181C] px-5 text-base font-bold transition hover:bg-[#1A2226] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/50 sm:mb-6">
          <ArrowLeft size={20} aria-hidden="true" /> Retour
        </button>

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
              const valeursDestinations = [...new Set(lignes.map((ligne) => ligne.destination).filter(Boolean))];
              const modeGlobal = valeursDestinations.length === 1;
              const totalPalettesGlobal = lignes.reduce((total, ligne) => total + Number(ligne.nombre_palettes || 0), 0);
              const destinationGlobale = lignes[0]?.destination_libelle ?? "Destination inconnue";

              return (
                <article key={arrivage.id} className="w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1A2226] sm:rounded-3xl">
                  <div className="border-b border-white/[0.08] p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-lg font-black tracking-wide sm:text-xl">Commande BACKO <span className="text-[#9bd754]">{arrivage.commande}</span></p>
                      <span className="rounded-full bg-[#78BE20]/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#9bd754]">{arrivage.statut}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-[#AAB2B7] sm:text-sm">
                      <span>Livraison : <span className="font-semibold text-white">{arrivage.date_arrivee ?? "-"}</span></span>
                      {rayon && <span>Rayon : <span className="font-semibold text-white">{rayon}</span></span>}
                      {arrivage.fournisseur && <span className="break-words">{arrivage.fournisseur}</span>}
                    </div>
                  </div>

                  <div className="space-y-3 p-3 sm:p-4">
                    {modeGlobal ? <div className="rounded-2xl border border-white/[0.08] bg-[#222C31] p-4"><div className="flex min-h-14 items-center justify-between gap-4 rounded-xl border-l-4 border-[#78BE20] bg-[#11181C] px-4"><p className="min-w-0 break-words text-lg font-bold uppercase tracking-wide">{destinationGlobale}</p><p className="shrink-0 text-3xl font-black text-[#9bd754]">{totalPalettesGlobal}</p></div>{arrivage.nombre_total_palettes && arrivage.nombre_total_palettes > 0 ? <p className="mt-3 text-sm font-semibold text-[#D7DDE0]">Palettes estimées : {arrivage.nombre_total_palettes}</p> : null}{arrivage.commentaire && <p className="mt-4 rounded-xl bg-[#11181C] p-4 text-sm text-[#D7DDE0]"><span className="font-black text-white">Commentaire :</span> {arrivage.commentaire}</p>}</div> : lignesRegroupees.map((ligne) => (
                      <div key={ligne.reference_lm} className="w-full rounded-2xl border border-white/[0.08] bg-[#222C31] p-4">
                        <p className="break-words text-2xl font-black tracking-wide">{ligne.reference_lm}</p>
                        <p className="mt-1 break-words text-[15px] text-[#AAB2B7] sm:text-base">{ligne.designation ?? "-"}</p>
                        <p className="mt-4 border-y border-white/[0.08] py-3 text-xl font-black text-[#9bd754]">Total palettes : {ligne.totalPalettes}</p>
                        <div className="mt-4 space-y-2">
                          {ligne.destinations.map((destination) => (
                            <div key={destination.destinationValeur ?? "sans-destination"} className="flex min-h-14 items-center justify-between gap-4 rounded-xl border-l-4 border-[#78BE20] bg-[#11181C] px-4">
                              <p className="min-w-0 break-words text-lg font-bold uppercase tracking-wide">{destination.destination}</p>
                              <p className="shrink-0 text-3xl font-black text-[#9bd754]">{destination.nombre_palettes}</p>
                            </div>
                          ))}
                        </div>
                        {ligne.commentaire_cariste && <div className="mt-4 rounded-xl bg-[#11181C] p-4 text-sm text-[#D7DDE0]"><p className="font-black text-white">Commentaire :</p><p className="mt-1 whitespace-pre-wrap break-words">{ligne.commentaire_cariste}</p></div>}
                      </div>
                    ))}
                    {arrivage.statut === "PRET_A_RECEVOIR" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setErreurReception(null);
                          setArrivageAReceptionner(arrivage);
                        }}
                        className="mt-4 flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#78BE20] px-5 text-lg font-black text-white shadow-lg shadow-[#4D8F12]/20 transition hover:bg-[#4D8F12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/50"
                      >
                        📦 Réceptionner la commande
                      </button>
                    ) : arrivage.statut === "RECEPTIONNEE" ? (
                      <p className="mt-4 flex min-h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 text-lg font-black text-white opacity-80">✅ Commande réceptionnée</p>
                    ) : (
                      <p className="mt-4 rounded-2xl border border-white/[0.08] bg-[#11181C] px-5 py-4 text-center text-sm font-bold text-[#AAB2B7]">Commande en préparation</p>
                    )}
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
      <MobileDebug />

      {arrivageAReceptionner && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 sm:items-center sm:justify-center">
          <div className="w-full rounded-3xl border border-white/[0.12] bg-[#11181C] p-5 shadow-2xl sm:max-w-md">
            <h2 className="text-xl font-black">Confirmer la réception complète de cette commande ?</h2>
            <p className="mt-2 text-[#AAB2B7]">Commande {arrivageAReceptionner.commande}</p>
            {erreurReception && <p className="mt-4 text-sm text-red-300" role="alert">{erreurReception}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={receptionEnCours}
                onClick={() => setArrivageAReceptionner(null)}
                className="min-h-14 rounded-2xl border border-white/[0.12] bg-[#1A2226] px-4 text-base font-bold transition hover:bg-[#222C31] disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={receptionEnCours}
                onClick={() => void confirmerReception()}
                className="min-h-14 rounded-2xl bg-[#78BE20] px-4 text-base font-black text-white transition hover:bg-[#4D8F12] disabled:opacity-50"
              >
                {receptionEnCours ? "Réception…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
