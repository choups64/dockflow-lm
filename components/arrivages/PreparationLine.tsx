// PreparationLine_v0.3 (squelette)
// Remplace progressivement ton fichier actuel.
// Cette version ajoute le support de la destination globale.

"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getDestinations,
  type Destination as DestinationDb,
} from "@/lib/destinations";

type Repartition = {
  palettes: number;
  destination: string;
};

interface Props {
  reference: string;
  designation: string;
  quantite: number;

  destinationGlobale?: string;
  modeGlobal?: boolean;

  destinationInitiale?: string;
  nombrePalettesInitial?: number;

  onChange?: (data: {
    destination: string;
    nombre_palettes: number;
  }) => void;
}

export default function PreparationLine({
  reference,
  designation,
  quantite,
  destinationGlobale = "",
  modeGlobal = false,
  destinationInitiale = "",
  nombrePalettesInitial = 1,
  onChange,
}: Props) {

  const [repartitions, setRepartitions] = useState([
  {
    palettes: nombrePalettesInitial ?? 1,
    destination: destinationInitiale,
  },
]);

  const [listeDestinations, setListeDestinations] = useState<DestinationDb[]>([]);

  useEffect(() => {
    getDestinations().then(setListeDestinations).catch(console.error);
  }, []);

  useEffect(() => {
    if (!modeGlobal || !destinationGlobale) return;

    setRepartitions((prev) =>
      prev.map((r) => ({
        ...r,
        destination: destinationGlobale,
      }))
    );
  }, [destinationGlobale, modeGlobal]);

  useEffect(() => {
    const prochaineRepartition = {
      palettes: nombrePalettesInitial ?? 1,
      destination: destinationInitiale ?? "",
    };

    setRepartitions((precedentes) => {
      if (
        precedentes.length === 1 &&
        precedentes[0].palettes === prochaineRepartition.palettes &&
        precedentes[0].destination === prochaineRepartition.destination
      ) {
        return precedentes;
      }

      return [prochaineRepartition];
    });
  }, [destinationInitiale, nombrePalettesInitial]);

  function notifierChangement(prochainesRepartitions: Repartition[]) {
    onChange?.({
      destination: prochainesRepartitions[0]?.destination ?? "",
      nombre_palettes: prochainesRepartitions.reduce(
        (total, repartition) => total + repartition.palettes,
        0
      ),
    });
  }

  
  function modifierDestination(index:number,valeur:string){
    const copy=[...repartitions];
    copy[index].destination=valeur;
    setRepartitions(copy);
    notifierChangement(copy);
  }

  function modifierPalettes(index:number,valeur:string){
    const copy=[...repartitions];
    copy[index].palettes=Number(valeur)||0;
    setRepartitions(copy);
    notifierChangement(copy);
  }

  function ajouterDestination(){
    setRepartitions([...repartitions,{palettes:1,destination:modeGlobal?destinationGlobale:""}]);
  }

  const total=repartitions.reduce((t,r)=>t+r.palettes,0);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold">{reference}</h3>
      <p>{designation}</p>
      <p className="mt-2 text-sm">Quantité BACKO : <strong>{quantite}</strong></p>

      <div className="mt-4 space-y-3">
        {repartitions.map((r,i)=>(
          <div key={i} className="flex gap-3">
            <input
              type="number"
              value={r.palettes}
              onChange={(e)=>modifierPalettes(i,e.target.value)}
              className="w-24 rounded border px-2 py-2"
            />

            <select
  value={r.destination ?? ""}
              disabled={modeGlobal}
              onChange={(e)=>modifierDestination(i,e.target.value)}
              className="flex-1 rounded border px-2 py-2"
            >
              <option value="">Choisir...</option>
              {listeDestinations.map((d)=>(
                <option key={d.id} value={d.code}>{d.nom}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span>Total palettes</span>
        <strong>{total}</strong>
      </div>

      {!modeGlobal && (
        <button
          onClick={ajouterDestination}
          className="mt-5 flex items-center gap-2 rounded-xl bg-[#78BE20] px-4 py-2 text-white"
        >
          <Plus size={18}/>
          Ajouter une destination
        </button>
      )}
    </div>
  );
}
