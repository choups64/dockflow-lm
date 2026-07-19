"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PreparationLine from "@/components/arrivages/PreparationLine";
import { creerArrivagePreparation, type LignePreparation } from "@/lib/arrivages";
import { getDestinations, type Destination } from "@/lib/destinations";
import { ProfileService } from "@/services/profile";

type Rayon = { id: number; code: string; nom: string };
type Repartition = { palettes: number; destination: string };
type LigneManuelle = LignePreparation & { id: string; repartitions: Repartition[] };

const nouvelleLigne = (): LigneManuelle => ({
  id: crypto.randomUUID(),
  referenceLM: "",
  designation: "",
  quantite: 0,
  repartitions: [{ palettes: 1, destination: "" }],
});

export default function ArrivalForm() {
  const router = useRouter();
  const [rayons, setRayons] = useState<Rayon[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [rayonId, setRayonId] = useState("");
  const [commande, setCommande] = useState("");
  const [dateLivraison, setDateLivraison] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [lignes, setLignes] = useState<LigneManuelle[]>([nouvelleLigne()]);
  const [globalCommande, setGlobalCommande] = useState(true);
  const [destinationGlobale, setDestinationGlobale] = useState("");
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurRayon, setErreurRayon] = useState<string | null>(null);
  const [preparationValidee, setPreparationValidee] = useState(false);

  useEffect(() => {
    async function chargerDonnees() {
      try {
        const profil = await ProfileService.getCurrentProfile();
        const rayonsDuProfil = await ProfileService.getCurrentUserRayons() as Rayon[];
        const destinationsDuMagasin = await getDestinations(profil.magasinId ?? undefined);

        setRayons(rayonsDuProfil);
        setDestinations(destinationsDuMagasin);
        if (rayonsDuProfil.length === 1) setRayonId(String(rayonsDuProfil[0].id));
        if (rayonsDuProfil.length === 0) {
          setErreurRayon("Aucun rayon n’est associé à votre profil. Contactez un administrateur.");
        }
      } catch (error) {
        setErreurRayon(error instanceof Error ? error.message : "Aucun rayon n’est associé à votre profil. Contactez un administrateur.");
      } finally {
        setChargement(false);
      }
    }

    chargerDonnees();
  }, []);

  function invaliderPreparation() {
    if (preparationValidee) setPreparationValidee(false);
  }

  function mettreAJourLigne(id: string, modification: Partial<LigneManuelle>) {
    invaliderPreparation();
    setLignes((precedentes) => precedentes.map((ligne) => ligne.id === id ? { ...ligne, ...modification } : ligne));
  }

  function lignesNormalisees(): LignePreparation[] {
    return lignes.map((ligne) => {
      const total = ligne.repartitions.reduce((somme, repartition) => somme + Number(repartition.palettes || 0), 0);
      return {
        referenceLM: ligne.referenceLM.trim(),
        designation: ligne.designation.trim(),
        quantite: Number(ligne.quantite || 0),
        repartitions: globalCommande
          ? [{ palettes: total, destination: destinationGlobale }]
          : ligne.repartitions.map((repartition) => ({ ...repartition, palettes: Number(repartition.palettes || 0) })),
      };
    });
  }

  function verifierPreparation() {
    if (!commande.trim()) return "Saisissez un numéro de commande BACKO.";
    if (!rayonId) return erreurRayon ?? "Sélectionnez un rayon.";
    if (lignes.length === 0) return "Ajoutez au moins une référence.";
    if (globalCommande && !destinationGlobale) return "Choisissez la destination de la commande.";

    for (const ligne of lignesNormalisees()) {
      if (!ligne.referenceLM) return "Chaque ligne doit contenir une référence LM.";
      if (!ligne.designation) return `Ajoutez la désignation de la référence ${ligne.referenceLM}.`;
      if (!ligne.repartitions?.length) return `Ajoutez une destination pour ${ligne.referenceLM}.`;
      if (ligne.repartitions.some((repartition) => !repartition.destination || repartition.palettes <= 0)) {
        return `Complétez les destinations et le nombre de palettes pour ${ligne.referenceLM}.`;
      }
    }

    return null;
  }

  function validerPreparation() {
    const erreur = verifierPreparation();
    if (erreur) {
      toast.error(erreur);
      return;
    }

    setPreparationValidee(true);
    toast.success("Préparation validée. Vous pouvez enregistrer l’arrivage.");
  }

  async function enregistrerArrivage() {
    const erreur = verifierPreparation();
    if (erreur) {
      setPreparationValidee(false);
      toast.error(erreur);
      return;
    }

    try {
      setEnregistrement(true);
      await creerArrivagePreparation({
        commande: commande.trim(),
        fournisseur: "",
        dateLivraison: dateLivraison || null,
        rayonId,
        commentaire: commentaire.trim() || null,
        lignes: lignesNormalisees(),
      });
      toast.success("Arrivage enregistré avec succès.");
      router.push("/dashboard/arrivages");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d’enregistrer l’arrivage.");
    } finally {
      setEnregistrement(false);
    }
  }

  const formulaireBloque = chargement || Boolean(erreurRayon);

  return (
    <div className="space-y-8">
      {erreurRayon && <p className="rounded-xl bg-red-50 p-4 text-red-700">{erreurRayon}</p>}
      <fieldset disabled={formulaireBloque} className="space-y-8 disabled:opacity-60">
        <section className="rounded-3xl border border-[#E3E8EC] bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-6 text-2xl font-black text-[#101820]">Informations de l&apos;arrivage</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="font-semibold text-[#101820]">Commande BACKO
              <input value={commande} onChange={(event) => { setCommande(event.target.value); invaliderPreparation(); }} className="mt-2 min-h-12 w-full rounded-xl border border-[#E3E8EC] px-4 py-3 text-[#101820] outline-none transition placeholder:text-[#66727A] focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15" placeholder="72539619" />
            </label>
            <label className="font-semibold text-[#101820]">Date de réception prévisionnelle
              <input type="date" value={dateLivraison} onChange={(event) => { setDateLivraison(event.target.value); invaliderPreparation(); }} className="mt-2 min-h-12 w-full rounded-xl border border-[#E3E8EC] px-4 py-3 text-[#101820] outline-none transition focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15" />
            </label>
            <label className="font-semibold text-[#101820]">Rayon
              <select value={rayonId} onChange={(event) => { setRayonId(event.target.value); invaliderPreparation(); }} disabled={chargement || rayons.length <= 1} className="mt-2 min-h-12 w-full rounded-xl border border-[#E3E8EC] px-4 py-3 text-[#101820] outline-none transition focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15">
                {rayons.length !== 1 && <option value="">Choisir un rayon...</option>}
                {rayons.map((rayon) => <option key={rayon.id} value={rayon.id}>{rayon.code} - {rayon.nom}</option>)}
              </select>
            </label>
            <label className="font-semibold text-[#101820]">Commentaire produit
              <input value={commentaire} onChange={(event) => { setCommentaire(event.target.value); invaliderPreparation(); }} className="mt-2 min-h-12 w-full rounded-xl border border-[#E3E8EC] px-4 py-3 text-[#101820] outline-none transition placeholder:text-[#66727A] focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15" placeholder="Ex : Salon de jardin" />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-[#E3E8EC] bg-white p-5 shadow-sm sm:p-6">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={globalCommande} onChange={(event) => { setGlobalCommande(event.target.checked); invaliderPreparation(); }} />
            <span className="font-semibold text-[#101820]">Toute la commande va à la même destination</span>
          </label>
          {globalCommande && <select value={destinationGlobale} onChange={(event) => { setDestinationGlobale(event.target.value); invaliderPreparation(); }} className="mt-5 min-h-12 w-full rounded-xl border border-[#E3E8EC] bg-white px-4 py-3 text-[#101820] outline-none transition focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15">
            <option value="">Choisir une destination...</option>
            {destinations.map((destination) => <option key={destination.id} value={destination.code}>{destination.nom}</option>)}
          </select>}
        </section>

        <div className="space-y-6">
          {lignes.map((ligne) => <div key={ligne.id}>
            <PreparationLine reference={ligne.referenceLM} designation={ligne.designation} quantite={ligne.quantite} destinations={destinations} editable headerAction={<button type="button" onClick={() => { setLignes((precedentes) => precedentes.filter((item) => item.id !== ligne.id)); invaliderPreparation(); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50" aria-label="Supprimer cette référence"><Trash2 size={18} />Supprimer</button>} modeGlobal={globalCommande} destinationGlobale={destinationGlobale} repartitionsInitiales={ligne.repartitions} onDetailsChange={(details) => mettreAJourLigne(ligne.id, { referenceLM: details.reference, designation: details.designation, quantite: details.quantite })} onChange={({ repartitions }) => mettreAJourLigne(ligne.id, { repartitions })} />
          </div>)}
        </div>
        <button type="button" onClick={() => { setLignes((precedentes) => [...precedentes, nouvelleLigne()]); invaliderPreparation(); }} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#D4E9BA] bg-[#EEF7E5] px-5 py-3 font-bold text-[#4F8F12] transition hover:bg-[#DDEFCB]"><Plus size={18} />Ajouter une référence</button>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={validerPreparation} disabled={formulaireBloque || enregistrement} className="min-h-12 w-full rounded-xl border border-[#D4E9BA] bg-[#EEF7E5] px-6 py-3 font-bold text-[#4F8F12] transition hover:bg-[#DDEFCB] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">Valider la préparation</button>
        <button type="button" onClick={enregistrerArrivage} disabled={!preparationValidee || formulaireBloque || enregistrement} className="min-h-12 w-full rounded-xl bg-[#78BE20] px-6 py-3 font-bold text-white transition hover:bg-[#4F8F12] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{enregistrement ? "Enregistrement..." : "Enregistrer l’arrivage"}</button>
      </div>
    </div>
  );
}
