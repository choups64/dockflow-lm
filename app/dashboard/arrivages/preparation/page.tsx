// PreparationArrivagePage_v0.3
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PreparationLine from "@/components/arrivages/PreparationLine";
import { getDestinations, type Destination } from "@/lib/destinations";
import { toast } from "sonner";
import {
  getArrivageById,
  getLignesArrivage,
} from "@/lib/arrivages";
import {
  creerArrivagePreparation,
  updateArrivage,
} from "@/lib/arrivages";

type Ligne = {
  referenceLM: string;
  designation: string;
  quantite: number;
  destination?: string;
  nombre_palettes?: number;
  ean?: string | null;
};

type CommandeBacko = {
  commande: string;
  fournisseur: string;
  dateLivraison: string;
  lignes: Ligne[];
};

type Props = {
  mode?: "create" | "edit";
  arrivageId?: string;
};

export default function PreparationArrivagePage({
  mode = "create",
  arrivageId,
}: Props) {
  const router = useRouter();

  const [commande, setCommande] = useState<CommandeBacko | null>(null);
  const [globalCommande, setGlobalCommande] = useState(true);
  const [destinationGlobale, setDestinationGlobale] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);

  useEffect(() => {
  async function initialiser() {
    if (mode === "create") {
      const json = localStorage.getItem("commandeBacko");

      if (!json) {
        router.replace("/import");
        return;
      }

      setCommande(JSON.parse(json));
    } else {
      if (!arrivageId) return;

const arrivage = await getArrivageById(arrivageId);
const lignes = await getLignesArrivage(arrivageId);

setCommande({
  commande: arrivage.commande,
  fournisseur: arrivage.fournisseur ?? "",
  dateLivraison: arrivage.date_arrivee ?? "",
  lignes: lignes.map((l: any) => ({
    referenceLM: l.reference_lm,
    designation: l.designation,
    quantite: l.quantite,
    destination: l.destination ?? "",
    nombre_palettes: l.nombre_palettes ?? 1,
    ean: l.ean,
  })),
});
    }

    getDestinations()
      .then(setDestinations)
      .catch(console.error);
  }

  initialiser();
}, [router, mode, arrivageId]);

  async function enregistrer() {
    if (!commande) return;
    const currentCommande = commande;

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
      lignes: currentCommande.lignes,
    });

    toast.success("Arrivage modifié avec succès");

  } else {

    await creerArrivagePreparation({
      commande: currentCommande.commande,
      fournisseur: currentCommande.fournisseur,
      dateLivraison: dateISO,
      lignes: currentCommande.lignes,
    });

    toast.success("Arrivage enregistré avec succès");

  }

  router.push("/dashboard/arrivages");

} catch (error: any) {
  console.error("Erreur complète :", error);
  console.error("Message :", error?.message);
  console.error("Details :", error?.details);
  console.error("Hint :", error?.hint);
  console.error("Code :", error?.code);

  toast.error(error?.message ?? "Erreur lors de l'enregistrement");
}

}

if (!commande) {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center">
      <p className="text-xl text-slate-500">
        Chargement de l'arrivage...
      </p>
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

          {commande.lignes.map((ligne, index) => (
  <PreparationLine
    key={`${arrivageId ?? commande.commande}-${index}`}
    reference={ligne.referenceLM}
    designation={ligne.designation}
    quantite={ligne.quantite}
    modeGlobal={globalCommande}
    destinationGlobale={destinationGlobale}
    destinationInitiale={ligne.destination ?? ""}
    nombrePalettesInitial={ligne.nombre_palettes}
    onChange={({ destination, nombre_palettes }) => {
      setCommande((prev) => {
        if (!prev) return prev;

        const lignes = [...prev.lignes];

        lignes[index] = {
          ...lignes[index],
          destination,
          nombre_palettes,
        };

        return {
          ...prev,
          lignes,
        };
      });
    }}
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
