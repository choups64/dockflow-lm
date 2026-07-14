"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PreparationLine from "@/components/arrivages/PreparationLine";
import { creerArrivagePreparation } from "@/lib/arrivages";
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

  useEffect(() => {
    const json = localStorage.getItem("commandeBacko");

    if (!json) {
      router.replace("/import");
      return;
    }

    setCommande(JSON.parse(json));
  }, [router]);

  async function enregistrer() {
    const currentCommande = commande;

    if (!currentCommande) return;

    try {
      await creerArrivagePreparation({
        commande: currentCommande.commande,
        fournisseur: currentCommande.fournisseur,
        dateLivraison: currentCommande.dateLivraison,
        lignes: currentCommande.lignes,
      });

      toast.success("Arrivage enregistré avec succès");

      router.push("/dashboard/arrivages");
    } catch (error) {
      console.error("Erreur complète :", error);

toast.error(
  error instanceof Error
    ? error.message
    : JSON.stringify(error)
);
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

          <p className="text-slate-500 mt-2">
            Commande {commande.commande}
          </p>

          <p className="text-slate-500">
            {commande.fournisseur}
          </p>

          <p className="text-slate-500">
            Livraison : {commande.dateLivraison}
          </p>

        </div>

        <div className="space-y-6">

          {commande.lignes.map((ligne, index) => (
            <PreparationLine
              key={index}
              reference={ligne.referenceLM}
              designation={ligne.designation}
              quantite={ligne.quantite}
            />
          ))}

        </div>

        <div className="mt-10 flex justify-end">

          <button
            onClick={enregistrer}
            className="rounded-xl bg-[#78BE20] px-8 py-4 text-white font-bold hover:bg-[#63a71b]"
          >
            Enregistrer l'arrivage
          </button>

        </div>

      </div>
    </main>
  );
}