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
}

export default function PreparationLine({
  reference,
  designation,
  quantite,
}: Props) {
  const [repartitions, setRepartitions] = useState<Repartition[]>([
    {
      palettes: 1,
      destination: "",
    },
  ]);

  const [listeDestinations, setListeDestinations] = useState<
    DestinationDb[]
  >([]);

  useEffect(() => {
    async function charger() {
      try {
        const data = await getDestinations();
        setListeDestinations(data);
      } catch (error) {
        console.error(error);
      }
    }

    charger();
  }, []);

  function ajouterDestination() {
    setRepartitions([
      ...repartitions,
      {
        palettes: 1,
        destination: "",
      },
    ]);
  }

  function supprimerDestination(index: number) {
    if (repartitions.length === 1) return;

    setRepartitions(repartitions.filter((_, i) => i !== index));
  }

  function modifierPalettes(index: number, valeur: string) {
    const copy = [...repartitions];

    copy[index].palettes = Number(valeur) || 0;

    setRepartitions(copy);
  }

  function modifierDestination(index: number, valeur: string) {
    const copy = [...repartitions];

    copy[index].destination = valeur;

    setRepartitions(copy);
  }

  const totalPalettes = repartitions.reduce(
    (total, ligne) => total + ligne.palettes,
    0
  );

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="mb-5">

        <h3 className="text-xl font-bold">
          {reference}
        </h3>

        <p className="text-slate-600">
          {designation}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Quantité BACKO : <strong>{quantite}</strong>
        </p>

      </div>

      <div className="space-y-3">

        {repartitions.map((ligne, index) => (

          <div
            key={index}
            className="flex items-center gap-4"
          >

            <input
              type="number"
              min={1}
              value={ligne.palettes}
              onChange={(e) =>
                modifierPalettes(index, e.target.value)
              }
              className="w-28 rounded-lg border px-3 py-2 text-center"
            />

            <select
              value={ligne.destination}
              onChange={(e) =>
                modifierDestination(index, e.target.value)
              }
              className="flex-1 rounded-lg border px-3 py-2"
            >
              <option value="">
                Choisir une destination...
              </option>

              {listeDestinations.map((dest) => (
                <option
                  key={dest.id}
                  value={dest.code}
                >
                  {dest.nom}
                </option>
              ))}
            </select>

            {repartitions.length > 1 && (
              <button
                onClick={() => supprimerDestination(index)}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
              >
                <Trash2 size={18} />
              </button>
            )}

          </div>

        ))}

      </div>

      <div className="mt-5 rounded-xl bg-slate-100 p-4 flex items-center justify-between">

        <span className="font-semibold">
          Total palettes
        </span>

        <span className="text-2xl font-bold text-[#78BE20]">
          {totalPalettes}
        </span>

      </div>

      <div className="mt-5 flex justify-between">

        <button
          onClick={ajouterDestination}
          className="flex items-center gap-2 rounded-xl bg-[#78BE20] px-5 py-3 text-white font-semibold hover:bg-[#63a71b]"
        >
          <Plus size={18} />
          Ajouter une destination
        </button>

      </div>

    </div>
  );
}