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

const repartitionParDefaut: Repartition[] = [{
  palettes: 1,
  destination: "",
}];

interface Props {
  reference: string;
  designation: string;
  quantite: number;

  destinationGlobale?: string;
  modeGlobal?: boolean;

  repartitionsInitiales?: Repartition[];

  onChange?: (data: {
    repartitions: Repartition[];
  }) => void;
}

export default function PreparationLine({
  reference,
  designation,
  quantite,
  destinationGlobale = "",
  modeGlobal = false,
  repartitionsInitiales = repartitionParDefaut,
  onChange,
}: Props) {

  const [repartitions, setRepartitions] = useState<Repartition[]>(
    repartitionsInitiales
  );

  const [listeDestinations, setListeDestinations] = useState<DestinationDb[]>([]);

  useEffect(() => {
    getDestinations().then(setListeDestinations).catch(console.error);
  }, []);

  useEffect(() => {
    if (!modeGlobal || !destinationGlobale) return;

    const prochainesRepartitions = repartitions.map((r) => ({
        ...r,
        destination: destinationGlobale,
      }));

    setRepartitions(prochainesRepartitions);
    onChange?.({ repartitions: prochainesRepartitions });
  }, [destinationGlobale, modeGlobal]);

  useEffect(() => {
    setRepartitions((precedentes) => {
      if (
        precedentes.length === repartitionsInitiales.length &&
        precedentes.every(
          (repartition, index) =>
            repartition.palettes === repartitionsInitiales[index].palettes &&
            repartition.destination === repartitionsInitiales[index].destination
        )
      ) {
        return precedentes;
      }

      return repartitionsInitiales;
    });
  }, [repartitionsInitiales]);

  function notifierChangement(prochainesRepartitions: Repartition[]) {
    onChange?.({ repartitions: prochainesRepartitions });
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
    const prochainesRepartitions = [
      ...repartitions,
      { palettes: 1, destination: modeGlobal ? destinationGlobale : "" },
    ];
    setRepartitions(prochainesRepartitions);
    notifierChangement(prochainesRepartitions);
  }

  function supprimerDestination(index: number) {
    const prochainesRepartitions = repartitions.filter((_, i) => i !== index);
    setRepartitions(prochainesRepartitions);
    notifierChangement(prochainesRepartitions);
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

            {repartitions.length > 1 && (
              <button
                type="button"
                onClick={() => supprimerDestination(i)}
                className="rounded border px-2 py-2 text-red-600"
                aria-label="Supprimer cette destination"
              >
                <Trash2 size={18}/>
              </button>
            )}
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
