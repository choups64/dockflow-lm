// app/dashboard/arrivages/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getStatutArrivage } from "@/lib/arrivages";
import RRPageHeader from "@/components/dashboard/RRPageHeader";
import RRPageLayout from "@/components/dashboard/RRPageLayout";

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

  async function chargerArrivages() {
    const { data, error } = await supabase
      .from("arrivages")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setArrivages((data ?? []) as Arrivage[]);
    setLoading(false);
  }

  useEffect(() => {
    // Le chargement initial est volontairement déclenché à l'ouverture de la page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void chargerArrivages();
  }, []);

  async function supprimer(id: string) {
    if (!confirm("Supprimer cet arrivage ?")) return;

    console.info("[ARRIVAGE SUPPRESSION] ID ciblé :", id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(`/api/rr/arrivages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionData.session?.access_token ?? ""}` },
      });
      const result = await response.json() as { error?: string; code?: string; deletedCount?: number; destinationsDeleted?: number; lignesDeleted?: number };
      console.info("[ARRIVAGE SUPPRESSION] Résultat :", result);
      if (!response.ok) throw new Error(result.error ?? "Erreur de suppression inconnue.");

      setArrivages((current) => current.filter((arrivage) => arrivage.id !== id));
      toast.success("Arrivage supprimé avec succès.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur de suppression inconnue.";
      console.error("[ARRIVAGE SUPPRESSION] Erreur :", error);
      toast.error(`Impossible de supprimer cet arrivage : ${message}`);
    }
  }

  if (loading) {
    return (
      <RRPageLayout>
        <p className="py-10 text-center text-lg text-[#66727A]">Chargement des arrivages...</p>
      </RRPageLayout>
    );
  }

  return (
    <RRPageLayout>
      <RRPageHeader
        title="Mes arrivages"
        description="Consultez, préparez et suivez les arrivages de votre rayon."
        actions={
          <Link
            href="/dashboard/nouvel-arrivage"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#78BE20] px-5 py-3 font-bold text-white transition hover:bg-[#4F8F12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/30"
          >
            <Plus size={20} aria-hidden="true" />
            Nouvel arrivage
          </Link>
        }
      />

      {arrivages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#E3E8EC] bg-white p-10 text-center text-[#66727A] shadow-sm">
          Aucun arrivage n&apos;a encore été créé.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#E3E8EC] bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead className="bg-[#F6F8FA] text-sm font-bold text-[#66727A]">
                <tr>
                  <th className="px-6 py-4">Commande</th>
                  <th className="px-6 py-4">Fournisseur</th>
                  <th className="px-6 py-4">Livraison</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {arrivages.map((a) => {
                  const statut = getStatutArrivage(a.statut);
                  return (
                    <tr key={a.id} className="border-t border-[#E3E8EC] transition hover:bg-[#F6F8FA]">
                      <td className="px-6 py-5 font-bold">{a.commande}</td>
                      <td className="px-6 py-5 text-[#66727A]">{a.fournisseur ?? "-"}</td>
                      <td className="px-6 py-5 text-[#66727A]">{a.date_arrivee ?? "-"}</td>
                      <td className="px-6 py-5"><span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statut.badgeClassName}`}>{statut.emoji} {statut.libelle}</span></td>
                      <td className="px-6 py-5"><ActionsArrivage id={a.id} onEdit={() => router.push(`/dashboard/arrivages/modifier/${a.id}`)} onDelete={() => supprimer(a.id)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-4 md:hidden">
            {arrivages.map((a) => {
              const statut = getStatutArrivage(a.statut);
              return (
                <article key={a.id} className="rounded-2xl border border-[#E3E8EC] p-4">
                  <div className="flex items-start justify-between gap-3"><p className="text-lg font-black">Commande {a.commande}</p><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statut.badgeClassName}`}>{statut.emoji} {statut.libelle}</span></div>
                  <p className="mt-3 text-sm text-[#66727A]">{a.fournisseur ?? "Fournisseur non renseigné"}</p>
                  <p className="mt-1 text-sm text-[#66727A]">Livraison : {a.date_arrivee ?? "-"}</p>
                  <div className="mt-4"><ActionsArrivage id={a.id} onEdit={() => router.push(`/dashboard/arrivages/modifier/${a.id}`)} onDelete={() => supprimer(a.id)} /></div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </RRPageLayout>
  );
}

function ActionsArrivage({ id, onEdit, onDelete }: { id: string; onEdit: () => void; onDelete: () => void }) {
  return <div className="flex justify-end gap-2"><button onClick={onEdit} className="inline-flex size-10 items-center justify-center rounded-xl border border-[#D4E9BA] bg-[#EEF7E5] text-[#4F8F12] transition hover:bg-[#DDEFCB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78BE20]" aria-label={`Modifier l'arrivage ${id}`}><Pencil size={18} aria-hidden="true" /></button><button onClick={onDelete} className="inline-flex size-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" aria-label={`Supprimer l'arrivage ${id}`}><Trash2 size={18} aria-hidden="true" /></button></div>;
}
