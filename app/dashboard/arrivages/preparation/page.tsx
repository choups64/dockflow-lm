// PreparationArrivagePage_v0.3
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PreparationLine from "@/components/arrivages/PreparationLine";
import { creerArrivagePreparation } from "@/lib/arrivages";
import { getDestinations, type Destination } from "@/lib/destinations";
import { toast } from "sonner";

type Ligne = {
  referenceLM: string;
  designation: string;
  quantite: number;
};

type CommandeBacko = {
  commande: string;
  fournisseur: string;
  dateLivraison: string;
  lignes: Ligne[];
};

export default function PreparationArrivagePage() {
  const router = useRouter();

  const [commande, setCommande] = useState<CommandeBacko | null>(null);
  const [globalCommande, setGlobalCommande] = useState(true);
  const [destinationGlobale, setDestinationGlobale] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);

  useEffect(() => {
    const json = localStorage.getItem("commandeBacko");

    if (!json) {
      router.replace("/import");
      return;
    }

    setCommande(JSON.parse(json));

    getDestinations()
      .then(setDestinations)
      .catch(console.error);
  }, [router]);

  async function enregistrer() {
    if (!commande) return;

    let dateISO: string | null = null;

    if (commande.dateLivraison) {
      const [j, m, a] = commande.dateLivraison.split("/");
      dateISO = `${a}-${m}-${j}`;
    }

    try {
      await creerArrivagePreparation({
        commande: commande.commande,
        fournisseur: commande.fournisseur,
        dateLivraison: dateISO,
        lignes: commande.lignes,
      });

      toast.success("Arrivage enregistré");
      router.push("/dashboard/arrivages");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'enregistrement");
    }
  }

  if (!commande) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Chargement...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#78BE20]">
            Préparation de l'arrivage
          </h1>

          <p>Commande {commande.commande}</p>
          <p>{commande.fournisseur}</p>
          <p>Livraison : {commande.dateLivraison}</p>
        </div>

        <div className="mb-8 rounded-2xl bg-white border p-6 shadow-sm">

          <label className="flex items-center gap-3 mb-5">
            <input
              type="checkbox"
              checked={globalCommande}
              onChange={(e)=>setGlobalCommande(e.target.checked)}
            />

            <span className="font-semibold">
              Toute la commande va à la même destination
            </span>
          </label>

          {globalCommande && (
            <select
              value={destinationGlobale}
              onChange={(e)=>setDestinationGlobale(e.target.value)}
              className="w-full rounded-xl border p-3"
            >
              <option value="">Choisir une destination...</option>

              {destinations.map((d)=>(
                <option key={d.id} value={d.code}>
                  {d.nom}
                </option>
              ))}
            </select>
          )}

          {!globalCommande && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 mt-4">
              Le mode "Répartition de la commande" sera développé dans la prochaine étape.
            </div>
          )}

        </div>

        <div className="space-y-6">

          {commande.lignes.map((ligne,index)=>(
            <PreparationLine
              key={index}
              reference={ligne.referenceLM}
              designation={ligne.designation}
              quantite={ligne.quantite}
              modeGlobal={globalCommande}
              destinationGlobale={destinationGlobale}
            />
          ))}

        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={enregistrer}
            className="rounded-xl bg-[#78BE20] px-8 py-4 text-white font-bold"
          >
            Enregistrer l'arrivage
          </button>
        </div>

      </div>
    </main>
  );
}
