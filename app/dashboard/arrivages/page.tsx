"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Arrivage = {
  id: string;
  commande: string;
  fournisseur: string | null;
  date_arrivee: string | null;
  statut: string;
};

export default function ArrivagesPage() {
  const [arrivages, setArrivages] = useState<Arrivage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerArrivages();
  }, []);

  async function chargerArrivages() {
    const { data, error } = await supabase
      .from("arrivages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setArrivages(data as Arrivage[]);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="p-10">
        <p className="text-xl">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="p-10 bg-slate-100 min-h-screen">

      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8">

          <h1 className="text-3xl font-bold text-[#78BE20]">
            Mes arrivages
          </h1>

          <a
            href="/dashboard/import"
            className="rounded-xl bg-[#78BE20] px-5 py-3 font-bold text-white hover:bg-[#63a71b]"
          >
            + Nouvel arrivage
          </a>

        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow">

          <table className="w-full">

            <thead className="bg-slate-100">

              <tr>

                <th className="p-4 text-left">
                  Commande
                </th>

                <th className="p-4 text-left">
                  Fournisseur
                </th>

                <th className="p-4 text-left">
                  Livraison
                </th>

                <th className="p-4 text-left">
                  Statut
                </th>

              </tr>

            </thead>

            <tbody>

              {arrivages.length === 0 && (

                <tr>

                  <td
                    colSpan={4}
                    className="p-8 text-center text-slate-500"
                  >
                    Aucun arrivage enregistré.
                  </td>

                </tr>

              )}

              {arrivages.map((a) => (

                <tr
                  key={a.id}
                  className="border-t hover:bg-slate-50"
                >

                  <td className="p-4 font-semibold">
                    {a.commande}
                  </td>

                  <td className="p-4">
                    {a.fournisseur ?? "-"}
                  </td>

                  <td className="p-4">
                    {a.date_arrivee ?? "-"}
                  </td>

                  <td className="p-4">

                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800">

                      {a.statut}

                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </main>
  );
}