// PreparationArrivagePage_v0.3
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import PreparationLine from "@/components/arrivages/PreparationLine";
import { destinationValue, getDestinations, resolveDestinationValue, type Destination } from "@/lib/destinations";
import { toast } from "sonner";
import {
  getArrivageById,
  getLignesArrivage,
} from "@/lib/arrivages";
import {
  creerArrivagePreparation,
  type StatutArrivage,
  updateArrivage,
  updateStatutArrivage,
} from "@/lib/arrivages";
import { ProfileService } from "@/services/profile";
import RRPageLayout from "@/components/dashboard/RRPageLayout";

type Repartition = {
  palettes: number;
  destination: string;
};

type Ligne = {
  id: string;
  referenceLM: string;
  designation: string;
  quantite: number;
  repartitions?: Repartition[];
  ean?: string | null;
  commentaireCariste?: string | null;
};

type LigneArrivageEnregistree = {
  reference_lm: string;
  designation: string;
  quantite: number;
  nombre_palettes: number | null;
  destination: string | null;
  ean: string | null;
  commentaire_cariste: string | null;
};

type RayonProfil = {
  id: number;
  code: string;
  nom: string;
};

type CommandeBacko = {
  commande: string;
  fournisseur: string;
  dateLivraison: string;
  lignes: Ligne[];
  rayonId?: string | number;
  rayonCode?: string;
  commentaire?: string | null;
};

type Props = {
  mode?: "create" | "edit";
  arrivageId?: string;
};

function creerIdentifiantLigne(referenceLM: string) {
  return `${referenceLM}-${crypto.randomUUID()}`;
}

export default function PreparationArrivagePage({
  mode = "create",
  arrivageId,
}: Props) {
  const router = useRouter();

  const [commande, setCommande] = useState<CommandeBacko | null>(null);
  const [globalCommande, setGlobalCommande] = useState(true);
  const [destinationGlobale, setDestinationGlobale] = useState("");
  const [commentaireCariste, setCommentaireCariste] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [chargementDestinations, setChargementDestinations] = useState(true);
  const [erreurDestinations, setErreurDestinations] = useState<string | null>(null);
  const [rayonsDuProfil, setRayonsDuProfil] = useState<RayonProfil[]>([]);
  const [rayonId, setRayonId] = useState("");
  const [chargementRayon, setChargementRayon] = useState(mode === "create");
  const [erreurRayon, setErreurRayon] = useState<string | null>(null);

  function supprimerLigne(id: string) {
    if (!commande) return;

    const ligne = commande.lignes.find((item) => item.id === id);
    if (!ligne) return;

    if (!window.confirm(`Supprimer la référence ${ligne.referenceLM} – ${ligne.designation} de cet arrivage ?`)) {
      return;
    }

    setCommande((precedente) =>
      precedente
        ? { ...precedente, lignes: precedente.lignes.filter((item) => item.id !== id) }
        : precedente
    );
  }

  function changerModeGlobal(actif: boolean) {
    setGlobalCommande(actif);
  }

  useEffect(() => {
  async function initialiser() {
    if (mode === "create") {
      const json = localStorage.getItem("commandeBacko");

      if (!json) {
        router.replace("/import");
        return;
      }

      const commandeImportee = JSON.parse(json) as Omit<CommandeBacko, "lignes"> & {
        lignes: Omit<Ligne, "id">[];
      };

      const lignesImportees = commandeImportee.lignes.map((ligne) => ({
        ...ligne,
        id: creerIdentifiantLigne(ligne.referenceLM),
      }));
      setCommande({
        ...commandeImportee,
        lignes: lignesImportees,
      });
      setCommentaireCariste(commandeImportee.commentaire ?? "");
    } else {
      if (!arrivageId) return;

try {
const arrivage = await getArrivageById(arrivageId);
const profil = await ProfileService.getCurrentProfile();
if (profil.role === "RR") await ProfileService.assertCurrentUserCanUseRayon(arrivage.rayon_id);
const lignes = await getLignesArrivage(arrivageId);

const lignesRegroupees = new Map<string, Ligne>();

lignes.forEach((l: LigneArrivageEnregistree) => {
  const ligneExistante = lignesRegroupees.get(l.reference_lm);
  const repartition = {
    palettes: l.nombre_palettes ?? 1,
    destination: l.destination ?? "",
  };

  if (ligneExistante) {
    ligneExistante.repartitions?.push(repartition);
    if (!ligneExistante.commentaireCariste && l.commentaire_cariste) {
      ligneExistante.commentaireCariste = l.commentaire_cariste;
    }
    return;
  }

  lignesRegroupees.set(l.reference_lm, {
    id: l.reference_lm,
    referenceLM: l.reference_lm,
    designation: l.designation,
    quantite: l.quantite,
    repartitions: [repartition],
    ean: l.ean,
    commentaireCariste: l.commentaire_cariste,
  });
});

setCommande({
  commande: arrivage.commande,
  fournisseur: arrivage.fournisseur ?? "",
  dateLivraison: arrivage.date_arrivee ?? "",
  lignes: Array.from(lignesRegroupees.values()),
});
setCommentaireCariste(arrivage.commentaire ?? "");
const valeursDestinations = [...new Set(lignes.map((ligne: LigneArrivageEnregistree) => ligne.destination).filter(Boolean))];
const estGlobal = valeursDestinations.length === 1;
setGlobalCommande(estGlobal);
setDestinationGlobale(estGlobal ? valeursDestinations[0] ?? "" : "");
} catch (error) {
  const message = error instanceof Error ? error.message : "Accès à cet arrivage refusé.";
  toast.error(message);
  router.replace("/dashboard/arrivages");
  return;
}
    }

    if (mode === "create") {
      try {
        const rayons = await ProfileService.getCurrentUserRayons() as RayonProfil[];

        setRayonsDuProfil(rayons);

        if (rayons.length === 1) {
          setRayonId(String(rayons[0].id));
        } else if (rayons.length === 0) {
          console.error("[ARRIVAGE] Création bloquée : aucun rayon disponible");
          setErreurRayon("Aucun rayon n’est associé à votre profil. Contactez un administrateur.");
        }
      } catch (error) {
        console.error("[ARRIVAGE] Création bloquée : aucun rayon disponible", error);
        setErreurRayon(
          "Impossible de créer l'arrivage : aucun rayon n'est associé à votre profil."
        );
      } finally {
        setChargementRayon(false);
      }
    }

    try {
      const destinationsChargees = await getDestinations(mode === "edit" && arrivageId ? { arrivageId } : undefined);
      setDestinations(destinationsChargees);
      setDestinationGlobale((precedente) => resolveDestinationValue(precedente, destinationsChargees));
      setCommande((precedente) => precedente ? {
        ...precedente,
        lignes: precedente.lignes.map((ligne) => ({
          ...ligne,
          repartitions: ligne.repartitions?.map((repartition) => ({
            ...repartition,
            destination: resolveDestinationValue(repartition.destination, destinationsChargees),
          })),
        })),
      } : precedente);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger les destinations.";
      setErreurDestinations(message);
      toast.error(message);
    } finally {
      setChargementDestinations(false);
    }
  }

  initialiser();
}, [router, mode, arrivageId]);

  async function enregistrer(statutApresEnregistrement?: StatutArrivage) {
    if (!commande) return;

    if (commande.lignes.length === 0) {
      toast.error("Ajoutez au moins une référence avant d'enregistrer l'arrivage.");
      return;
    }
    if (globalCommande && !destinationGlobale) {
      toast.error("Choisissez la destination de la commande.");
      return;
    }
    const totalPalettesCalcule = commande.lignes.reduce(
      (total, ligne) => total + (ligne.repartitions ?? []).reduce(
        (somme, repartition) => somme + Number(repartition.palettes || 0),
        0
      ),
      0
    );
    if (globalCommande && totalPalettesCalcule <= 0) {
      toast.error("Aucune palette valide n’est disponible dans les répartitions de la commande.");
      return;
    }

    if (mode === "create" && !rayonId) {
      const message =
        erreurRayon ??
        "Veuillez sélectionner un rayon avant d'enregistrer l'arrivage.";

      console.error("[ARRIVAGE] Création bloquée : aucun rayon disponible");
      toast.error(message);
      return;
    }

    const currentCommande = commande;
    const lignesEnregistrees = currentCommande.lignes.map((ligne) => {
      const totalLigne = (ligne.repartitions ?? []).reduce(
        (somme, repartition) => somme + Number(repartition.palettes || 0),
        0
      );

      return {
        ...ligne,
        repartitions: globalCommande
          ? [{ palettes: totalLigne, destination: destinationGlobale }]
          : ligne.repartitions,
      };
    });

    let dateISO: string | null = null;

    if (commande.dateLivraison) {
      if (commande.dateLivraison) {

  if (commande.dateLivraison.includes("/")) {

    const [j, m, a] = commande.dateLivraison.split("/");
    dateISO = `${a}-${m}-${j}`;

  } else {

    dateISO = commande.dateLivraison;

  }

}
    }

    try {
  if (mode === "edit" && arrivageId) {

    await updateArrivage(arrivageId, {
      commande: currentCommande.commande,
      fournisseur: currentCommande.fournisseur,
      dateLivraison: dateISO,
      commentaire: commentaireCariste.trim() || null,
      lignes: lignesEnregistrees,
    }, statutApresEnregistrement);

    toast.success("Arrivage modifié avec succès");

  } else {

    const arrivage = await creerArrivagePreparation({
      commande: currentCommande.commande,
      fournisseur: currentCommande.fournisseur,
      dateLivraison: dateISO,
      rayonId,
      commentaire: commentaireCariste.trim() || null,
      lignes: lignesEnregistrees,
    });

    if (statutApresEnregistrement) {
      await updateStatutArrivage(arrivage.id, statutApresEnregistrement);
    }

    toast.success("Arrivage enregistré avec succès");

  }

  router.push("/dashboard/arrivages");

} catch (error: unknown) {
  const erreur = error instanceof Error ? error : new Error("Erreur lors de l'enregistrement");
  console.error("Erreur complète :", error);
  console.error("Message :", erreur.message);

  toast.error(erreur.message);
}

}

if (!commande) {
  return (
    <RRPageLayout>
      <p className="py-10 text-center text-xl text-[#66727A]">
        Chargement de l&apos;arrivage...
      </p>
    </RRPageLayout>
  );
}

  return (
    <RRPageLayout>
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard/arrivages" className="mb-5 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-[#4F8F12] transition hover:bg-[#EEF7E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78BE20]"><ArrowLeft size={18} aria-hidden="true" />Retour aux arrivages</Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#101820] sm:text-4xl">
            Préparation de l&apos;arrivage
          </h1>

          <p className="mt-3 text-[#66727A]">Commande {commande.commande}</p>
          <p className="text-[#66727A]">{commande.fournisseur}</p>
          <p className="text-[#66727A]">Livraison : {commande.dateLivraison}</p>
        </div>

        <section className="mb-8 rounded-3xl border border-[#E3E8EC] bg-white p-5 shadow-sm sm:p-6">

          {mode === "create" && (
            <div className="mb-5">
              {chargementRayon ? (
                <p className="text-slate-500">Chargement du rayon associé...</p>
              ) : erreurRayon ? (
                <p className="text-red-600">{erreurRayon}</p>
              ) : rayonsDuProfil.length === 1 ? (
                <div>
                  <p className="mb-2 font-semibold">Rayon de l&apos;arrivage</p>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-800">
                    {rayonsDuProfil[0].code} - {rayonsDuProfil[0].nom}
                  </p>
                </div>
              ) : (
                <>
                  <label className="mb-2 block font-semibold" htmlFor="rayon-arrivage">
                    Rayon de l&apos;arrivage
                  </label>
                  <select
                    id="rayon-arrivage"
                    value={rayonId}
                    onChange={(event) => setRayonId(event.target.value)}
                    className="w-full rounded-xl border p-3"
                  >
                    <option value="">Choisir un rayon...</option>
                    {rayonsDuProfil.map((rayon) => (
                      <option key={rayon.id} value={rayon.id}>
                        {rayon.code} - {rayon.nom}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}

          <label className="flex items-center gap-3 mb-5">
            <input
              type="checkbox"
              checked={globalCommande}
              onChange={(e)=>changerModeGlobal(e.target.checked)}
            />

            <span className="font-semibold">
              Toute la commande va à la même destination
            </span>
          </label>

          {globalCommande && (
            <div className="grid gap-5"><select
              value={destinationGlobale}
              onChange={(e)=>setDestinationGlobale(e.target.value)}
              disabled={chargementDestinations}
              className="w-full rounded-xl border p-3"
            >
              <option value="">{chargementDestinations ? "Chargement des destinations..." : destinations.some((destination) => destination.actif) ? "Choisir une destination..." : "Aucune destination disponible"}</option>

              {destinations.filter((destination) => destination.actif).map((d)=>(
                <option key={d.id} value={destinationValue(d)}>
                  {d.nom}
                </option>
              ))}
            </select><label htmlFor="commentaire-cariste-preparation" className="font-semibold text-[#101820]">Commentaire pour le cariste<textarea id="commentaire-cariste-preparation" rows={4} maxLength={500} value={commentaireCariste} onChange={(event) => setCommentaireCariste(event.target.value)} className="mt-2 w-full rounded-xl border border-[#E3E8EC] bg-white px-4 py-3 font-normal" placeholder="Ex : Toute la commande à déposer en BMV, prévenir le rayon à la réception…" /><span className="mt-1 block text-right text-xs font-normal text-[#66727A]">{commentaireCariste.length}/500</span></label></div>
          )}
          {erreurDestinations && <p className="mt-3 text-sm font-semibold text-red-600">{erreurDestinations}</p>}

          {!globalCommande && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 mt-4">
              Le mode &quot;Répartition de la commande&quot; s&apos;affiche ci-dessous.
            </div>
          )}

        </section>

        {!globalCommande && <div className="space-y-6">

          {commande.lignes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#C8D1D8] bg-white p-8 text-center text-[#66727A]">
              Aucune référence dans cet arrivage. Vous pouvez revenir en arrière pour refaire l&apos;import.
            </div>
          ) : (
            commande.lignes.map((ligne) => (
              <div key={ligne.id} className="relative">
                <button
                  type="button"
                  onClick={() => supprimerLigne(ligne.id)}
                  className="absolute right-3 top-3 z-10 inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label={`Supprimer la référence ${ligne.referenceLM}`}
                >
                  <Trash2 size={18} aria-hidden="true" />
                  Supprimer
                </button>
                <PreparationLine
                  reference={ligne.referenceLM}
                  designation={ligne.designation}
                  quantite={ligne.quantite}
                  modeGlobal={globalCommande}
                  destinationGlobale={destinationGlobale}
                  destinations={destinations}
                  repartitionsInitiales={ligne.repartitions}
                  commentaireCariste={ligne.commentaireCariste ?? ""}
                  onCommentaireChange={(commentaireCariste) => {
                    setCommande((prev) => prev ? {
                      ...prev,
                      lignes: prev.lignes.map((item) =>
                        item.id === ligne.id ? { ...item, commentaireCariste } : item
                      ),
                    } : prev);
                  }}
                  onChange={({ repartitions }) => {
                    setCommande((prev) => {
                      if (!prev) return prev;

                      return {
                        ...prev,
                        lignes: prev.lignes.map((item) =>
                          item.id === ligne.id ? { ...item, repartitions } : item
                        ),
                      };
                    });
                  }}
                />
              </div>
            ))
          )}

        </div>}

        <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={() => enregistrer("PRET_A_RECEVOIR")}
            disabled={commande.lignes.length === 0 || (mode === "create" && (chargementRayon || !!erreurRayon || !rayonId))}
            className="min-h-12 w-full rounded-xl border border-[#D4E9BA] bg-[#EEF7E5] px-6 py-3 font-bold text-[#4F8F12] transition hover:bg-[#DDEFCB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Valider la préparation
          </button>

          <button
            onClick={() => enregistrer()}
            disabled={commande.lignes.length === 0 || (mode === "create" && (chargementRayon || !!erreurRayon || !rayonId))}
            className="min-h-12 w-full rounded-xl bg-[#78BE20] px-6 py-3 font-bold text-white transition hover:bg-[#4F8F12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Enregistrer l&apos;arrivage
          </button>
        </div>

      </div>
    </RRPageLayout>
  );
}
