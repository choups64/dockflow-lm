"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { supabase } from "@/lib/supabase";
import { ProfileService, type CurrentProfile } from "@/services/profile";

type Magasin = { id: string; code: string; nom: string; ville: string | null; actif: boolean };

export default function MagasinsPage() {
  const [profil, setProfil] = useState<CurrentProfile | null>(null);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [code, setCode] = useState(""); const [nom, setNom] = useState(""); const [ville, setVille] = useState(""); const [erreur, setErreur] = useState<string | null>(null);
  const national = profil?.adminScope === "NATIONAL";
  const charger = async () => { const current = await ProfileService.getCurrentProfile(); setProfil(current); let query = supabase.from("magasins").select("id, code, nom, ville, actif").order("code"); if (current.adminScope !== "NATIONAL" && current.magasinId) query = query.eq("id", current.magasinId); const { data, error } = await query; if (error) setErreur(error.message); setMagasins((data ?? []) as Magasin[]); };
  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
  }, []);
  async function ajouter(event: FormEvent) { event.preventDefault(); if (!national) return; const { error } = await supabase.from("magasins").insert({ code: code.trim().toUpperCase(), nom: nom.trim(), ville: ville.trim() || null }); if (error) setErreur(error.message); else { setCode(""); setNom(""); setVille(""); void charger(); } }
  async function basculer(magasin: Magasin) { if (!national) return; const { error } = await supabase.from("magasins").update({ actif: !magasin.actif }).eq("id", magasin.id); if (error) setErreur(error.message); else void charger(); }
  return <><AdminPageHeader title="Magasins" description="Administration des magasins DockFlow et de leur statut." action={national ? <span className="inline-flex items-center gap-2 rounded-xl bg-[#EEF7E5] px-4 py-3 font-bold text-[#4F8F12]"><Building2 size={18} />Administrateur national</span> : undefined} />{erreur && <p className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">{erreur}</p>}{national && <form onSubmit={ajouter} className="mb-6 grid gap-3 rounded-3xl border border-[#E3E8EC] bg-white p-5 shadow-sm md:grid-cols-4"><input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" className="min-h-12 rounded-xl border border-[#E3E8EC] px-4" /><input required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du magasin" className="min-h-12 rounded-xl border border-[#E3E8EC] px-4" /><input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ville (facultatif)" className="min-h-12 rounded-xl border border-[#E3E8EC] px-4" /><button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#78BE20] px-4 font-bold text-white hover:bg-[#4F8F12]"><Plus size={18} />Créer</button></form>}<section className="overflow-hidden rounded-3xl border border-[#E3E8EC] bg-white shadow-sm"><table className="w-full text-left"><thead className="bg-[#F6F8FA] text-sm text-[#66727A]"><tr><th className="p-5">Code</th><th className="p-5">Magasin</th><th className="p-5">Ville</th><th className="p-5">Statut</th><th className="p-5 text-right">Action</th></tr></thead><tbody>{magasins.map((magasin) => <tr key={magasin.id} className="border-t border-[#E3E8EC]"><td className="p-5 font-bold">{magasin.code}</td><td className="p-5">{magasin.nom}</td><td className="p-5 text-[#66727A]">{magasin.ville ?? "—"}</td><td className="p-5"><span className={magasin.actif ? "rounded-full bg-[#EEF7E5] px-3 py-1 text-sm font-bold text-[#4F8F12]" : "rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600"}>{magasin.actif ? "Actif" : "Archivé"}</span></td><td className="p-5 text-right">{national && <button onClick={() => basculer(magasin)} className="rounded-xl border border-[#E3E8EC] px-3 py-2 font-bold text-[#101820]">{magasin.actif ? "Désactiver" : "Réactiver"}</button>}</td></tr>)}</tbody></table></section></>;
}
