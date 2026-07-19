// PreparationLine_v0.3 (squelette)
// Remplace progressivement ton fichier actuel.
// Cette version ajoute le support de la destination globale.

"use client";

import { Plus, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
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
  destinations?: DestinationDb[];
  editable?: boolean;
  headerAction?: ReactNode;
  onDetailsChange?: (data: { reference: string; designation: string; quantite: number }) => void;

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
  destinations,
  editable = false,
  headerAction,
  onDetailsChange,
  destinationGlobale = "",
  modeGlobal = false,
  repartitionsInitiales = repartitionParDefaut,
  onChange,
}: Props) {

  const [repartitions, setRepartitions] = useState<Repartition[]>(
    repartitionsInitiales
  );

  const [listeDestinations, setListeDestinations] = useState<DestinationDb[]>([]);

  // Les deux effets suivants synchronisent les valeurs initiales et la destination globale reçues du parent.
  useEffect(() => {
    if (destinations) return;

    getDestinations().then(setListeDestinations).catch(console.error);
  }, [destinations]);

  const destinationsDisponibles = destinations ?? listeDestinations;

  useEffect(() => {
    if (!modeGlobal || !destinationGlobale) return;

    const prochainesRepartitions = repartitions.map((r) => ({
        ...r,
        destination: destinationGlobale,
      }));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRepartitions(prochainesRepartitions);
    onChange?.({ repartitions: prochainesRepartitions });
  }, [destinationGlobale, modeGlobal]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <article className="rounded-3xl border border-[#E3E8EC] bg-white p-5 shadow-sm sm:p-6">
      {headerAction && <div className="mb-4 flex items-center justify-end">{headerAction}</div>}
      {editable ? (
        <div className="grid gap-3 sm:grid-cols-[11rem_1fr_9rem]">
          <label className="text-sm font-semibold text-[#101820]">Référence LM
            <input value={reference} onChange={(event) => onDetailsChange?.({ reference: event.target.value, designation, quantite })} className="mt-1 min-h-11 w-full rounded-xl border border-[#E3E8EC] bg-white px-3 py-2 outline-none transition focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15" placeholder="87007999" />
          </label>
          <label className="text-sm font-semibold text-[#101820]">Désignation
            <input value={designation} onChange={(event) => onDetailsChange?.({ reference, designation: event.target.value, quantite })} className="mt-1 min-h-11 w-full rounded-xl border border-[#E3E8EC] bg-white px-3 py-2 outline-none transition focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15" placeholder="Désignation produit" />
          </label>
          <label className="text-sm font-semibold text-[#101820]">Quantité (optionnelle)
            <input type="number" min="0" value={quantite || ""} onChange={(event) => onDetailsChange?.({ reference, designation, quantite: Number(event.target.value) || 0 })} className="mt-1 min-h-11 w-full rounded-xl border border-[#E3E8EC] bg-white px-3 py-2 outline-none transition focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15" placeholder="0" />
          </label>
        </div>
      ) : (
        <>
          <h3 className="text-xl font-black text-[#101820]">{reference}</h3>
          <p className="mt-1 text-[#66727A]">{designation}</p>
          <p className="mt-2 text-sm">Quantité BACKO : <strong>{quantite}</strong></p>
        </>
      )}

      <div className="mt-4 space-y-3">
        {repartitions.map((r,i)=>(
          <div key={i} className="flex flex-col gap-3 rounded-2xl border border-[#E3E8EC] bg-[#F6F8FA] p-3 sm:flex-row">
            <input
              type="number"
              value={r.palettes}
              onChange={(e)=>modifierPalettes(i,e.target.value)}
              className="min-h-11 w-full rounded-xl border border-[#E3E8EC] bg-white px-3 py-2 outline-none transition focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15 sm:w-28"
            />

            <select
  value={r.destination ?? ""}
              disabled={modeGlobal}
              onChange={(e)=>modifierDestination(i,e.target.value)}
              className="min-h-11 flex-1 rounded-xl border border-[#E3E8EC] bg-white px-3 py-2 outline-none transition focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15"
            >
              <option value="">Choisir...</option>
              {destinationsDisponibles.map((d)=>(
                <option key={d.id} value={d.code}>{d.nom}</option>
              ))}
            </select>

            {repartitions.length > 1 && (
              <button
                type="button"
                onClick={() => supprimerDestination(i)}
                className="min-h-11 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-600 transition hover:bg-red-100"
                aria-label="Supprimer cette destination"
              >
                <Trash2 size={18}/>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="font-semibold text-[#66727A]">Total palettes</span>
        <strong className="text-lg text-[#101820]">{total}</strong>
      </div>

      {!modeGlobal && (
        <button
          onClick={ajouterDestination}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#78BE20] px-4 py-2 font-bold text-white transition hover:bg-[#4F8F12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/30"
        >
          <Plus size={18}/>
          Ajouter une destination
        </button>
      )}
    </article>
  );
}
