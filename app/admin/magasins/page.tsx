"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, Pencil, Plus, Trash2, X } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { supabase } from "@/lib/supabase";
import { ProfileService, type CurrentProfile } from "@/services/profile";

type Magasin = { id: string; code: string; nom: string; actif: boolean };
type Message = { type: "error" | "success"; text: string } | null;

function normaliserCode(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function normaliserNom(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export default function MagasinsPage() {
  const [profil, setProfil] = useState<CurrentProfile | null>(null);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [edition, setEdition] = useState<Magasin | null>(null);
  const [codeEdition, setCodeEdition] = useState("");
  const [nomEdition, setNomEdition] = useState("");
  const [suppression, setSuppression] = useState<Magasin | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [loading, setLoading] = useState(false);

  const national = profil?.adminScope === "NATIONAL";

  const charger = async () => {
    try {
      const current = await ProfileService.getCurrentProfile();
      setProfil(current);
      let query = supabase.from("magasins").select("id, code, nom, actif").order("code");
      if (current.adminScope !== "NATIONAL" && current.magasinId) query = query.eq("id", current.magasinId);
      const { data, error } = await query;
      if (error) throw error;
      setMagasins((data ?? []) as Magasin[]);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Impossible de charger les magasins." });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
  }, []);

  async function envoyer(payload: Record<string, unknown>) {
    const { data: sessionData } = await supabase.auth.getSession();
    const response = await fetch("/api/admin/stores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session?.access_token ?? ""}`,
      },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) throw new Error(result.error ?? "Action magasin impossible.");
    return result;
  }

  async function ajouter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!national) return;
    const normalizedCode = normaliserCode(code);
    const normalizedName = normaliserNom(nom);
    if (!normalizedCode || !normalizedName) {
      setMessage({ type: "error", text: "Le code et le nom du magasin sont obligatoires." });
      return;
    }
    setLoading(true);
    try {
      const result = await envoyer({ action: "create", code: normalizedCode, nom: normalizedName });
      setCode("");
      setNom("");
      setMessage({ type: "success", text: result.message ?? "Magasin créé." });
      await charger();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Création impossible." });
    } finally {
      setLoading(false);
    }
  }

  function ouvrirEdition(magasin: Magasin) {
    setEdition(magasin);
    setCodeEdition(magasin.code);
    setNomEdition(magasin.nom);
    setMessage(null);
  }

  async function enregistrerEdition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edition) return;
    const normalizedCode = normaliserCode(codeEdition);
    const normalizedName = normaliserNom(nomEdition);
    if (!normalizedCode || !normalizedName) {
      setMessage({ type: "error", text: "Le code et le nom du magasin sont obligatoires." });
      return;
    }
    setLoading(true);
    try {
      const result = await envoyer({ action: "update", id: edition.id, code: normalizedCode, nom: normalizedName });
      setEdition(null);
      setMessage({ type: "success", text: result.message ?? "Magasin modifié." });
      await charger();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Modification impossible." });
    } finally {
      setLoading(false);
    }
  }

  async function basculer(magasin: Magasin) {
    setLoading(true);
    try {
      const result = await envoyer({ action: "toggle", id: magasin.id, actif: !magasin.actif });
      setMessage({ type: "success", text: result.message ?? "Statut mis à jour." });
      await charger();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Mise à jour impossible." });
    } finally {
      setLoading(false);
    }
  }

  async function supprimer() {
    if (!suppression) return;
    setLoading(true);
    try {
      const result = await envoyer({ action: "delete", id: suppression.id });
      setSuppression(null);
      setMessage({ type: "success", text: result.message ?? "Magasin supprimé définitivement." });
      await charger();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Suppression impossible." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Magasins"
        description="Administration des magasins DockFlow et de leur statut."
        action={national ? <span className="inline-flex items-center gap-2 rounded-xl bg-[#EEF7E5] px-4 py-3 font-bold text-[#4F8F12]"><Building2 size={18} />Administrateur national</span> : undefined}
      />

      {message && <p className={`mb-5 rounded-xl p-4 ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-[#EEF7E5] text-[#356A0B]"}`}>{message.text}</p>}

      {national && (
        <form onSubmit={ajouter} className="mb-6 grid gap-3 rounded-3xl border border-[#E3E8EC] bg-white p-5 shadow-sm md:grid-cols-[minmax(10rem,1fr)_minmax(16rem,2fr)_auto]">
          <input required value={code} onChange={(event) => setCode(event.target.value)} placeholder="Code" className="min-h-12 rounded-xl border border-[#E3E8EC] px-4" />
          <input required value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Nom du magasin" className="min-h-12 rounded-xl border border-[#E3E8EC] px-4" />
          <button disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#78BE20] px-5 font-bold text-white hover:bg-[#4F8F12] disabled:opacity-60"><Plus size={18} />Créer</button>
        </form>
      )}

      <section className="overflow-x-auto rounded-3xl border border-[#E3E8EC] bg-white shadow-sm">
        <table className="min-w-full text-left">
          <thead className="bg-[#F6F8FA] text-sm text-[#66727A]"><tr><th className="p-5">Code</th><th className="p-5">Magasin</th><th className="p-5">Statut</th><th className="p-5 text-right">Actions</th></tr></thead>
          <tbody>{magasins.map((magasin) => <tr key={magasin.id} className="border-t border-[#E3E8EC]"><td className="p-5 font-bold">{magasin.code}</td><td className="p-5">{magasin.nom}</td><td className="p-5"><span className={magasin.actif ? "rounded-full bg-[#EEF7E5] px-3 py-1 text-sm font-bold text-[#4F8F12]" : "rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600"}>{magasin.actif ? "Actif" : "Archivé"}</span></td><td className="p-5"><div className="flex justify-end gap-2">{national && <><button onClick={() => ouvrirEdition(magasin)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[#E3E8EC] px-3 py-2 font-bold text-[#101820] hover:bg-[#F6F8FA] disabled:opacity-60"><Pencil size={16} />Modifier</button><button onClick={() => { setSuppression(magasin); setMessage(null); }} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"><Trash2 size={16} />Supprimer</button><button onClick={() => basculer(magasin)} disabled={loading} className="rounded-xl border border-[#E3E8EC] px-3 py-2 font-bold text-[#101820] hover:bg-[#F6F8FA] disabled:opacity-60">{magasin.actif ? "Désactiver" : "Réactiver"}</button></>}</div></td></tr>)}</tbody>
        </table>
      </section>

      {edition && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5" role="dialog" aria-modal="true" aria-labelledby="edit-store-title"><form onSubmit={enregistrerEdition} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 id="edit-store-title" className="text-xl font-black text-[#101820]">Modifier le magasin</h2><button type="button" onClick={() => setEdition(null)} className="rounded-lg p-2 text-[#66727A] hover:bg-slate-100" aria-label="Fermer"><X size={20} /></button></div><div className="grid gap-4"><label className="grid gap-2 font-semibold text-[#34424A]">Code<input required value={codeEdition} onChange={(event) => setCodeEdition(event.target.value)} className="min-h-12 rounded-xl border border-[#E3E8EC] px-4 font-normal" /></label><label className="grid gap-2 font-semibold text-[#34424A]">Nom du magasin<input required value={nomEdition} onChange={(event) => setNomEdition(event.target.value)} className="min-h-12 rounded-xl border border-[#E3E8EC] px-4 font-normal" /></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setEdition(null)} className="rounded-xl border border-[#E3E8EC] px-4 py-3 font-bold text-[#101820]">Annuler</button><button disabled={loading} className="rounded-xl bg-[#78BE20] px-4 py-3 font-bold text-white hover:bg-[#4F8F12] disabled:opacity-60">Enregistrer</button></div></form></div>}

      {suppression && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5" role="dialog" aria-modal="true" aria-labelledby="delete-store-title"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"><h2 id="delete-store-title" className="text-xl font-black text-[#101820]">Supprimer ce magasin ?</h2><p className="mt-3 text-[#66727A]">Cette action supprimera définitivement le magasin uniquement s’il ne contient aucune donnée associée.</p><p className="mt-4 rounded-xl bg-[#F6F8FA] p-4 font-bold text-[#101820]">{suppression.code} — {suppression.nom}</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setSuppression(null)} className="rounded-xl border border-[#E3E8EC] px-4 py-3 font-bold text-[#101820]">Annuler</button><button type="button" onClick={() => void supprimer()} disabled={loading} className="rounded-xl bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60">Supprimer définitivement</button></div></div></div>}
    </>
  );
}
