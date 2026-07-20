"use client";

import { useEffect, useState } from "react";
import { destinationValue, getDestinations, type Destination } from "@/lib/destinations";

export default function NouvelArrivage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [chargementDestinations, setChargementDestinations] = useState(true);
  const [erreurDestinations, setErreurDestinations] = useState<string | null>(null);

  useEffect(() => {
    getDestinations()
      .then(setDestinations)
      .catch((error: unknown) => setErreurDestinations(error instanceof Error ? error.message : "Impossible de charger les destinations."))
      .finally(() => setChargementDestinations(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8">

        <h1 className="text-4xl font-bold text-green-600">
          Nouvel arrivage
        </h1>

        <p className="text-gray-500 mt-2 mb-8">
          Préparer la réception avant l&apos;arrivée du camion.
        </p>

        {/* TYPE */}

        <div className="mb-8">

          <label className="block font-semibold mb-3">
            Type d&apos;arrivage
          </label>

          <div className="flex gap-8">

            <label className="flex items-center gap-2">
              <input type="radio" name="type" defaultChecked />
              Opération Commerciale
            </label>

            <label className="flex items-center gap-2">
              <input type="radio" name="type" />
              Arrivage Exceptionnel
            </label>

          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-6">

          <div>

            <label className="block font-semibold mb-2">
              Numéro de commande
            </label>

            <input
              className="w-full border rounded-lg p-3"
              placeholder="71261706"
            />

          </div>

          <div>

            <label className="block font-semibold mb-2">
              Référence LM
            </label>

            <input
              className="w-full border rounded-lg p-3"
              placeholder="69489840"
            />

          </div>

          <div>

            <label className="block font-semibold mb-2">
              Nombre de palettes
            </label>

            <input
              className="w-full border rounded-lg p-3"
              placeholder="8"
            />

          </div>

          <div>

            <label className="block font-semibold mb-2">
              Destination
            </label>

            <select disabled={chargementDestinations || Boolean(erreurDestinations)} className="w-full border rounded-lg p-3">
              <option value="">{chargementDestinations ? "Chargement des destinations..." : destinations.length ? "Choisir une destination..." : "Aucune destination disponible"}</option>
              {destinations.map((destination) => <option key={destination.id} value={destinationValue(destination)}>{destination.nom}</option>)}
            </select>
            {erreurDestinations && <p className="mt-2 text-sm text-red-600">{erreurDestinations}</p>}

          </div>

          <div>

            <label className="block font-semibold mb-2">
              Date de mise à disposition magasin
            </label>

            <input
              type="date"
              className="w-full border rounded-lg p-3"
            />

          </div>

          <div>

            <label className="block font-semibold mb-2">
              Repère visuel
            </label>

            <input
              className="w-full border rounded-lg p-3"
              placeholder="Salon de jardin gris"
            />

          </div>

        </div>

        <div className="mt-8">

          <label className="block font-semibold mb-2">
            Commentaire (facultatif)
          </label>

          <textarea
            className="w-full border rounded-lg p-3 h-28"
            placeholder="Informations complémentaires..."
          />

        </div>

        <div className="flex justify-end mt-10">

          <button
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700"
          >
            Enregistrer
          </button>

        </div>

      </div>

    </main>
  );
}
