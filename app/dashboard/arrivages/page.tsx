// app/dashboard/arrivages/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getStatutArrivage } from "@/lib/arrivages";
import { ProfileService } from "@/services/profile";
import RRPageHeader from "@/components/dashboard/RRPageHeader";
import RRPageLayout from "@/components/dashboard/RRPageLayout";

type Arrivage = {
  id: string;
  commande: string;
  fournisseur: string | null;
  date_arrivee: string | null;
  statut: string;
  created_at?: string | null;
  nombre_total_palettes?: number | null;
};

type OrdreDate = "desc" | "asc";
type FiltreStatut = "TOUS" | "EN_PREPARATION" | "PRET_A_RECEVOIR" | "RECEPTIONNEE";

const libellesStatuts: Record<Exclude<FiltreStatut, "TOUS">, string> = {
  EN_PREPARATION: "En préparation",
  PRET_A_RECEVOIR: "Prêt à recevoir",
  RECEPTIONNEE: "Réceptionnée",
};

export default function ArrivagesPage() {
  const router = useRouter();
  const [arrivages, setArrivages] = useState<Arrivage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [ordreDate, setOrdreDate] = useState<OrdreDate>("desc");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("TOUS");

  const arrivagesAffiches = useMemo(() => {
    const datePourTri = (arrivage: Arrivage) => {
      const date = arrivage.date_arrivee ? new Date(arrivage.date_arrivee).getTime() : 0;
      const creation = arrivage.created_at ? new Date(arrivage.created_at).getTime() : 0;
      return { date: Number.isNaN(date) ? 0 : date, creation: Number.isNaN(creation) ? 0 : creation };
    };

    return arrivages
      .filter((arrivage) => filtreStatut === "TOUS" || arrivage.statut === filtreStatut)
      .sort((a, b) => {
        const aDates = datePourTri(a);
        const bDates = datePourTri(b);
        const resultat = aDates.date - bDates.date || aDates.creation - bDates.creation;
        return ordreDate === "desc" ? -resultat : resultat;
      });
  }, [arrivages, filtreStatut, ordreDate]);

  const filtresParDefaut = ordreDate === "desc" && filtreStatut === "TOUS";

  async function chargerArrivages() {
    try {
      setMessage(null);
      const profil = await ProfileService.getCurrentProfile();
      const rayons = await ProfileService.getCurrentUserRayons();
      const rayonIds = rayons.map((rayon) => rayon.id);

      if (!rayonIds.length) {
        setArrivages([]);
        setMessage("Aucun rayon n’est associé à votre profil. Contactez un administrateur.");
        return;
      }

      const { data, error } = await supabase
        .from("arrivages")
        .select("*")
        .eq("magasin_id", profil.magasinId ?? "")
        .in("rayon_id", rayonIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArrivages((data ?? []) as Arrivage[]);
    } catch (error) {
      setArrivages([]);
      setMessage(error instanceof Error ? error.message : "Impossible de charger les arrivages.");
    } finally {
      setLoading(false);
    }
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

      {message && <p className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">{message}</p>}

      {!message && <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#E3E8EC] bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-semibold text-[#101820]">Trier par date
          <select value={ordreDate} onChange={(event) => setOrdreDate(event.target.value as OrdreDate)} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#E3E8EC] bg-white px-3 text-[#101820] outline-none transition focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15">
            <option value="desc">Plus récente en premier</option>
            <option value="asc">Plus ancienne en premier</option>
          </select>
        </label>
        <label className="flex-1 text-sm font-semibold text-[#101820]">Filtrer par statut
          <select value={filtreStatut} onChange={(event) => setFiltreStatut(event.target.value as FiltreStatut)} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#E3E8EC] bg-white px-3 text-[#101820] outline-none transition focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15">
            <option value="TOUS">Tous les statuts</option>
            {Object.entries(libellesStatuts).map(([statut, libelle]) => <option key={statut} value={statut}>{libelle}</option>)}
          </select>
        </label>
        <button type="button" disabled={filtresParDefaut} onClick={() => { setOrdreDate("desc"); setFiltreStatut("TOUS"); }} className="min-h-11 rounded-xl border border-[#D4E9BA] bg-[#EEF7E5] px-4 font-bold text-[#4F8F12] transition hover:bg-[#DDEFCB] disabled:cursor-not-allowed disabled:opacity-50">Réinitialiser</button>
      </section>}

      {arrivages.length === 0 && !message ? (
        <div className="rounded-3xl border border-dashed border-[#E3E8EC] bg-white p-10 text-center text-[#66727A] shadow-sm">
          Aucun arrivage n&apos;a encore été créé.
        </div>
      ) : arrivagesAffiches.length === 0 && !message ? (
        <div className="rounded-3xl border border-dashed border-[#E3E8EC] bg-white p-10 text-center text-[#66727A] shadow-sm">
          Aucun arrivage ne correspond à ces critères.
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
                  <th className="px-6 py-4">Estimation</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {arrivagesAffiches.map((a) => {
                  const statut = getStatutArrivage(a.statut);
                  return (
                    <tr key={a.id} className="border-t border-[#E3E8EC] transition hover:bg-[#F6F8FA]">
                      <td className="px-6 py-5 font-bold">{a.commande}</td>
                      <td className="px-6 py-5 text-[#66727A]">{a.fournisseur ?? "-"}</td>
                      <td className="px-6 py-5 text-[#66727A]">{a.date_arrivee ?? "-"}</td>
                      <td className="px-6 py-5"><span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statut.badgeClassName}`}>{statut.emoji} {statut.libelle}</span></td>
                      <td className="px-6 py-5 text-[#66727A]">{a.nombre_total_palettes && a.nombre_total_palettes > 0 ? `Palettes estimées : ${a.nombre_total_palettes}` : "-"}</td>
                      <td className="px-6 py-5"><ActionsArrivage id={a.id} onEdit={() => router.push(`/dashboard/arrivages/modifier/${a.id}`)} onDelete={() => supprimer(a.id)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-4 md:hidden">
            {arrivagesAffiches.map((a) => {
              const statut = getStatutArrivage(a.statut);
              return (
                <article key={a.id} className="rounded-2xl border border-[#E3E8EC] p-4">
                  <div className="flex items-start justify-between gap-3"><p className="text-lg font-black">Commande {a.commande}</p><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statut.badgeClassName}`}>{statut.emoji} {statut.libelle}</span></div>
                  <p className="mt-3 text-sm text-[#66727A]">{a.fournisseur ?? "Fournisseur non renseigné"}</p>
                  <p className="mt-1 text-sm text-[#66727A]">Livraison : {a.date_arrivee ?? "-"}</p>
                  {a.nombre_total_palettes && a.nombre_total_palettes > 0 ? <p className="mt-1 text-sm text-[#66727A]">Palettes estimées : {a.nombre_total_palettes}</p> : null}
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
