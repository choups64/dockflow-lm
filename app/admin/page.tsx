"use client";

import { useEffect, useState } from "react";
import { Building2, ClipboardList, Package, Truck, Users } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { supabase } from "@/lib/supabase";
import { ProfileService, type CurrentProfile } from "@/services/profile";

type Magasin = { id: string; code: string; nom: string };
type Stats = { magasins: number; utilisateurs: number; rr: number; caristes: number; arrivages: number; preparation: number };

const initialStats: Stats = { magasins: 0, utilisateurs: 0, rr: 0, caristes: 0, arrivages: 0, preparation: 0 };

export default function AdminDashboard() {
  const [profil, setProfil] = useState<CurrentProfile | null>(null);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [magasinId, setMagasinId] = useState("");
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    ProfileService.getCurrentProfile().then((current) => {
      setProfil(current);
      setMagasinId(current.adminScope === "NATIONAL" ? "" : current.magasinId ?? "");
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!profil) return;
    async function charger() {
      const current = profil!;
      const filtre = current.adminScope === "NATIONAL" ? magasinId : current.magasinId;
      let utilisateursQuery = supabase.from("profiles").select("id", { count: "exact", head: true });
      let rrQuery = supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "RR");
      let caristesQuery = supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "CARISTE");
      let arrivagesQuery = supabase.from("arrivages").select("id", { count: "exact", head: true });
      let preparationQuery = supabase.from("arrivages").select("id", { count: "exact", head: true }).in("statut", ["EN_PREPARATION", "PREPARATION"]);
      if (filtre) { utilisateursQuery = utilisateursQuery.eq("magasin_id", filtre); rrQuery = rrQuery.eq("magasin_id", filtre); caristesQuery = caristesQuery.eq("magasin_id", filtre); arrivagesQuery = arrivagesQuery.eq("magasin_id", filtre); preparationQuery = preparationQuery.eq("magasin_id", filtre); }
      const [{ data: magasinsData }, utilisateursResult, rrResult, caristesResult, arrivagesResult, preparationResult] = await Promise.all([
        supabase.from("magasins").select("id, code, nom").eq("actif", true).order("code"),
        utilisateursQuery, rrQuery, caristesQuery, arrivagesQuery, preparationQuery,
      ]);
      setMagasins((magasinsData ?? []) as Magasin[]);
      setStats({ magasins: magasinsData?.length ?? 0, utilisateurs: utilisateursResult.count ?? 0, rr: rrResult.count ?? 0, caristes: caristesResult.count ?? 0, arrivages: arrivagesResult.count ?? 0, preparation: preparationResult.count ?? 0 });
    }
    void charger();
  }, [magasinId, profil]);

  const cartes = [
    ["Magasins actifs", stats.magasins, Building2], ["Utilisateurs", stats.utilisateurs, Users], ["Responsables de rayon", stats.rr, Users], ["Caristes", stats.caristes, Truck], ["Arrivages", stats.arrivages, Package], ["En préparation", stats.preparation, ClipboardList],
  ] as const;

  return <><AdminPageHeader title="Tableau de bord" description="Vue consolidée de l'activité DockFlow." action={profil?.adminScope === "NATIONAL" ? <select value={magasinId} onChange={(event) => setMagasinId(event.target.value)} className="min-h-12 rounded-xl border border-[#E3E8EC] bg-white px-4 font-semibold outline-none focus:border-[#78BE20]"><option value="">Tous les magasins</option>{magasins.map((magasin) => <option key={magasin.id} value={magasin.id}>{magasin.code} — {magasin.nom}</option>)}</select> : undefined} /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cartes.map(([label, valeur, Icon]) => <article key={label} className="rounded-3xl border border-[#E3E8EC] bg-white p-6 shadow-sm"><div className="flex items-center gap-4"><span className="rounded-2xl bg-[#EEF7E5] p-4 text-[#4F8F12]"><Icon size={26} /></span><div><p className="text-sm font-semibold text-[#66727A]">{label}</p><p className="mt-1 text-3xl font-black">{valeur}</p></div></div></article>)}</section></>;
}
