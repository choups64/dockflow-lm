// app/dashboard/arrivages/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Arrivage = {
  id: string;
  commande: string;
  fournisseur: string | null;
  date_arrivee: string | null;
  statut: string;
};

export default function ArrivagesPage() {
  const router = useRouter();
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

    if (!error) setArrivages((data ?? []) as Arrivage[]);
    setLoading(false);
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer cet arrivage ?")) return;

    const { error } = await supabase
      .from("arrivages")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Impossible de supprimer.");
      return;
    }

    chargerArrivages();
  }

  if (loading) {
    return <main className="p-10">Chargement...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8">

          <div className="flex items-center gap-4">

            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 hover:bg-slate-50"
            >
              <ArrowLeft size={18}/>
              Dashboard
            </Link>

            <h1 className="text-3xl font-bold text-[#78BE20]">
              Mes arrivages
            </h1>

          </div>

          <Link
            href="/dashboard/import"
            className="rounded-xl bg-[#78BE20] px-5 py-3 font-bold text-white hover:bg-[#63a71b]"
          >
            + Nouvel arrivage
          </Link>

        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow">

          <table className="w-full">

            <thead className="bg-slate-100">

              <tr>
                <th className="p-4 text-left">Commande</th>
                <th className="p-4 text-left">Fournisseur</th>
                <th className="p-4 text-left">Livraison</th>
                <th className="p-4 text-left">Statut</th>
                <th className="p-4 text-center">Actions</th>
              </tr>

            </thead>

            <tbody>

              {arrivages.map((a)=>(
                <tr key={a.id} className="border-t hover:bg-slate-50">

                  <td className="p-4 font-semibold">{a.commande}</td>
                  <td className="p-4">{a.fournisseur ?? "-"}</td>
                  <td className="p-4">{a.date_arrivee ?? "-"}</td>

                  <td className="p-4">
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800">
                      {a.statut}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex justify-center gap-3">

                      <button
                        onClick={()=>router.push(`/dashboard/arrivages/preparation?id=${a.id}`)}
                        className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                      >
                        <Pencil size={18}/>
                      </button>

                      <button
                        onClick={()=>supprimer(a.id)}
                        className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                      >
                        <Trash2 size={18}/>
                      </button>

                    </div>
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
