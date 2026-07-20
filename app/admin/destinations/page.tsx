"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { supabase } from "@/lib/supabase";
import { ProfileService } from "@/services/profile";

type Destination = { id: number; code: string; nom: string; magasin_id: string | null; actif: boolean };
type Magasin = { id: string; code: string; nom: string };

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  const magasinsParId = useMemo(() => new Map(magasins.map((magasin) => [magasin.id, magasin])), [magasins]);

  useEffect(() => {
    async function charger() {
      try {
        const profil = await ProfileService.getCurrentProfile();
        let destinationsQuery = supabase.from("destinations").select("id, code, nom, magasin_id, actif").order("code");
        let magasinsQuery = supabase.from("magasins").select("id, code, nom").order("code");
        if (profil.adminScope !== "NATIONAL" && profil.magasinId) {
          destinationsQuery = destinationsQuery.eq("magasin_id", profil.magasinId);
          magasinsQuery = magasinsQuery.eq("id", profil.magasinId);
        }
        const [destinationsResult, magasinsResult] = await Promise.all([destinationsQuery, magasinsQuery]);
        if (destinationsResult.error || magasinsResult.error) throw destinationsResult.error ?? magasinsResult.error;
        setDestinations((destinationsResult.data ?? []) as Destination[]);
        setMagasins((magasinsResult.data ?? []) as Magasin[]);
      } catch (cause) {
        setErreur(cause instanceof Error ? cause.message : "Impossible de charger les destinations.");
      }
    }
    void charger();
  }, []);

  return <>
    <AdminPageHeader title="Destinations" description="Destinations disponibles, filtrées selon le périmètre administrateur." />
    {erreur ? <p className="rounded-xl bg-red-50 p-4 text-red-700">{erreur}</p> : <section className="overflow-x-auto rounded-3xl border border-[#E3E8EC] bg-white shadow-sm">
      <table className="w-full table-fixed text-left"><thead className="bg-[#F6F8FA] text-sm text-[#66727A]"><tr><th className="w-[18%] px-5 py-4">Code</th><th className="w-[28%] px-5 py-4">Nom</th><th className="w-[34%] px-5 py-4">Magasin</th><th className="w-[20%] px-5 py-4">Statut</th></tr></thead><tbody>
        {destinations.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-[#66727A]">Aucune destination.</td></tr> : destinations.map((destination) => {
          const magasin = destination.magasin_id ? magasinsParId.get(destination.magasin_id) : undefined;
          return <tr key={destination.id} className="border-t border-[#E3E8EC]"><td className="px-5 py-4 font-semibold">{destination.code}</td><td className="px-5 py-4">{destination.nom}</td><td className="px-5 py-4"><div className="min-w-0">{magasin ? <><p className="truncate font-semibold">{magasin.code}</p><p className="truncate text-xs text-[#66727A]">{magasin.nom}</p></> : <p className="font-semibold text-[#66727A]">National</p>}</div></td><td className="px-5 py-4"><span className={destination.actif ? "rounded-full bg-[#EEF7E5] px-3 py-1.5 text-sm font-bold text-[#4F8F12]" : "rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600"}>{destination.actif ? "Actif" : "Inactif"}</span></td></tr>;
        })}
      </tbody></table>
    </section>}
  </>;
}
