"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { supabase } from "@/lib/supabase";
import { ProfileService, type CurrentProfile } from "@/services/profile";

type Role = "RR" | "CARISTE" | "ADMIN";
type AdminScope = "MAGASIN" | "NATIONAL";
type Store = { id: string; code: string; nom: string };
type Rayon = { id: number; code: string; nom: string; magasin_id: string };
type Profile = { id: string; email: string; role: Role; magasin_id: string; admin_scope: AdminScope | null; actif: boolean; created_at: string | null; rayonIds: number[] };
type Message = { type: "error" | "success"; text: string } | null;

const actionClass = "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white text-[0px] transition disabled:opacity-60 [&>svg]:h-3.5 [&>svg]:w-3.5 last:after:content-['◉'] last:after:text-sm";

export default function UtilisateursPage() {
  const [profil, setProfil] = useState<CurrentProfile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [rayons, setRayons] = useState<Rayon[]>([]);
  const [modal, setModal] = useState<"create" | Profile | null>(null);
  const [suppression, setSuppression] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("RR");
  const [magasinId, setMagasinId] = useState("");
  const [rayonIds, setRayonIds] = useState<number[]>([]);
  const [adminScope, setAdminScope] = useState<AdminScope>("MAGASIN");
  const [actif, setActif] = useState(true);
  const [message, setMessage] = useState<Message>(null);
  const [loading, setLoading] = useState(false);

  const national = profil?.adminScope === "NATIONAL";
  const availableRayons = useMemo(() => rayons.filter((rayon) => rayon.magasin_id === magasinId), [magasinId, rayons]);
  const storesById = useMemo(() => new Map(stores.map((store) => [store.id, store])), [stores]);
  const rayonsById = useMemo(() => new Map(rayons.map((rayon) => [rayon.id, rayon])), [rayons]);

  const charger = async () => {
    try {
      const current = await ProfileService.getCurrentProfile();
      setProfil(current);
      let profilesQuery = supabase.from("profiles").select("id, email, role, magasin_id, admin_scope, actif, created_at").order("created_at", { ascending: false });
      let storesQuery = supabase.from("magasins").select("id, code, nom").order("code");
      let rayonsQuery = supabase.from("rayons").select("id, code, nom, magasin_id").order("code");
      if (current.adminScope !== "NATIONAL" && current.magasinId) {
        profilesQuery = profilesQuery.eq("magasin_id", current.magasinId);
        storesQuery = storesQuery.eq("id", current.magasinId);
        rayonsQuery = rayonsQuery.eq("magasin_id", current.magasinId);
      }
      const [profilesResult, storesResult, rayonsResult, associationsResult] = await Promise.all([
        profilesQuery,
        storesQuery,
        rayonsQuery,
        supabase.from("profile_rayons").select("profile_id, rayon_id"),
      ]);
      const error = profilesResult.error || storesResult.error || rayonsResult.error || associationsResult.error;
      if (error) throw error;
      const idsByProfile = new Map<string, number[]>();
      for (const association of associationsResult.data ?? []) {
        const existing = idsByProfile.get(association.profile_id) ?? [];
        existing.push(association.rayon_id);
        idsByProfile.set(association.profile_id, existing);
      }
      setProfiles((profilesResult.data ?? []).map((item) => ({ ...item, role: item.role as Role, admin_scope: item.admin_scope as AdminScope | null, rayonIds: idsByProfile.get(item.id) ?? [] })));
      setStores((storesResult.data ?? []) as Store[]);
      setRayons((rayonsResult.data ?? []) as Rayon[]);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Impossible de charger les utilisateurs." });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
  }, []);

  function ouvrirCreation() {
    setModal("create");
    setEmail("");
    setPassword("");
    setRole("RR");
    setMagasinId(profil?.magasinId ?? stores[0]?.id ?? "");
    setRayonIds([]);
    setAdminScope("MAGASIN");
    setActif(true);
    setMessage(null);
  }

  function ouvrirEdition(user: Profile) {
    setModal(user);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setMagasinId(user.magasin_id);
    setRayonIds(user.rayonIds);
    setAdminScope(user.admin_scope ?? "MAGASIN");
    setActif(user.actif);
    setMessage(null);
  }

  async function envoyer(payload: Record<string, unknown>) {
    const { data: sessionData } = await supabase.auth.getSession();
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionData.session?.access_token ?? ""}` },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) throw new Error(result.error ?? "Action utilisateur impossible.");
    return result;
  }

  function changeRole(value: Role) {
    setRole(value);
    if (value !== "RR") setRayonIds([]);
    if (value !== "ADMIN") setAdminScope("MAGASIN");
  }

  function changeStore(value: string) {
    setMagasinId(value);
    setRayonIds([]);
  }

  function toggleRayon(rayonId: number) {
    setRayonIds((current) => current.includes(rayonId) ? current.filter((id) => id !== rayonId) : [...current, rayonId]);
  }

  async function enregistrer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isCreate = modal === "create";
    if (!modal) return;
    setLoading(true);
    try {
      const base = { email, role, magasinId, rayonIds, adminScope: role === "ADMIN" ? adminScope : null, actif };
      const result = isCreate
        ? await envoyer({ action: "create", ...base, password })
        : await envoyer({ action: "update", ...base, userId: modal.id });
      setModal(null);
      setMessage({ type: "success", text: result.message ?? (isCreate ? "Utilisateur créé." : "Utilisateur modifié.") });
      await charger();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Enregistrement impossible." });
    } finally {
      setLoading(false);
    }
  }

  async function basculer(user: Profile) {
    setLoading(true);
    try {
      const result = await envoyer({ action: "toggle", userId: user.id, actif: !user.actif });
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
      const result = await envoyer({ action: "delete", userId: suppression.id });
      setSuppression(null);
      setMessage({ type: "success", text: result.message ?? "Utilisateur supprimé définitivement." });
      await charger();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Suppression impossible." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AdminPageHeader title="Utilisateurs" description="Comptes DockFlow gérés par Supabase Auth." action={<button onClick={ouvrirCreation} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#78BE20] px-5 font-bold text-white hover:bg-[#4F8F12]"><Plus size={18} />Nouvel utilisateur</button>} />
      {message && <p className={`mb-5 rounded-xl p-4 ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-[#EEF7E5] text-[#356A0B]"}`}>{message.text}</p>}

      <section className="overflow-x-auto rounded-3xl border border-[#E3E8EC] bg-white shadow-sm lg:overflow-visible">
        <table className="min-w-[920px] w-full table-fixed text-left lg:min-w-0"><colgroup><col className="w-[22%]" /><col className="w-[7%]" /><col className="w-[15%]" /><col className="w-[13%]" /><col className="w-[9%]" /><col className="w-[9%]" /><col className="w-[300px]" /></colgroup><thead className="bg-[#F6F8FA] text-sm text-[#66727A]"><tr><th className="px-3 py-4">E-mail</th><th className="px-3 py-4">Rôle</th><th className="px-3 py-4">Magasin</th><th className="px-3 py-4">Rayon</th><th className="px-3 py-4">Scope</th><th className="px-3 py-4">Statut</th><th className="w-[300px] px-3 py-4 text-right">Actions</th></tr></thead><tbody>{profiles.map((user) => { const store = storesById.get(user.magasin_id); const userRayons = user.rayonIds.map((id) => rayonsById.get(id)).filter((rayon): rayon is Rayon => Boolean(rayon)); const rayonCodes = userRayons.map((rayon) => rayon.code).join(", "); const rayonTitle = userRayons.map((rayon) => `${rayon.code} — ${rayon.nom}`).join(", "); return <tr key={user.id} className="border-t border-[#E3E8EC]"><td className="px-3 py-4 align-middle"><p title={user.email} className="truncate whitespace-nowrap font-semibold">{user.email}</p></td><td className="px-3 py-4 align-middle whitespace-nowrap">{user.role}</td><td className="px-3 py-4 align-middle"><div title={store ? `${store.code} — ${store.nom}` : undefined} className="min-w-0"><p className="truncate whitespace-nowrap font-semibold">{store?.code ?? "—"}</p>{store && <p className="truncate text-xs text-[#66727A]">{store.nom}</p>}</div></td><td className="px-3 py-4 align-middle"><p title={rayonTitle || undefined} className="truncate whitespace-nowrap">{rayonCodes || "—"}</p></td><td className="px-3 py-4 align-middle whitespace-nowrap">{user.admin_scope ?? "—"}</td><td className="px-3 py-4 align-middle whitespace-nowrap"><span className={user.actif ? "rounded-full bg-[#EEF7E5] px-2.5 py-1 text-sm font-bold text-[#4F8F12]" : "rounded-full bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-600"}>{user.actif ? "Actif" : "Désactivé"}</span></td><td className="w-[300px] px-3 py-4 align-middle"><div className="flex flex-nowrap justify-end gap-2"><button onClick={() => ouvrirEdition(user)} disabled={loading} className={`${actionClass} border-[#E3E8EC] text-[#101820] hover:bg-[#F6F8FA]`}><Pencil size={15} />Modifier</button><button onClick={() => { setSuppression(user); setMessage(null); }} disabled={loading} className={`${actionClass} border-red-200 text-red-700 hover:bg-red-50`}><Trash2 size={15} />Supprimer</button><button onClick={() => void basculer(user)} disabled={loading} className={`${actionClass} border-[#E3E8EC] text-[#101820] hover:bg-[#F6F8FA]`}>{user.actif ? "Désactiver" : "Réactiver"}</button></div></td></tr>; })}</tbody></table>
      </section>

      {modal && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-5"><div className="flex min-h-full items-center justify-center"><form onSubmit={enregistrer} className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black text-[#101820]">{modal === "create" ? "Nouvel utilisateur" : "Modifier l’utilisateur"}</h2><button type="button" onClick={() => setModal(null)} className="rounded-lg p-2 text-[#66727A] hover:bg-slate-100" aria-label="Fermer"><X size={20} /></button></div><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 font-semibold text-[#34424A]">E-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 rounded-xl border border-[#E3E8EC] px-4 font-normal" /></label>{modal === "create" && <label className="grid gap-2 font-semibold text-[#34424A]">Mot de passe temporaire<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 rounded-xl border border-[#E3E8EC] px-4 font-normal" /></label>}<label className="grid gap-2 font-semibold text-[#34424A]">Rôle<select value={role} onChange={(event) => changeRole(event.target.value as Role)} className="min-h-12 rounded-xl border border-[#E3E8EC] bg-white px-4 font-normal"><option value="RR">RR</option><option value="CARISTE">CARISTE</option><option value="ADMIN">ADMIN</option></select></label><label className="grid gap-2 font-semibold text-[#34424A]">Magasin<select required value={magasinId} onChange={(event) => changeStore(event.target.value)} className="min-h-12 rounded-xl border border-[#E3E8EC] bg-white px-4 font-normal"><option value="">Sélectionner</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.code} — {store.nom}</option>)}</select></label>{role === "ADMIN" && <label className="grid gap-2 font-semibold text-[#34424A]">Périmètre administrateur<select value={adminScope} onChange={(event) => setAdminScope(event.target.value as AdminScope)} className="min-h-12 rounded-xl border border-[#E3E8EC] bg-white px-4 font-normal"><option value="MAGASIN">MAGASIN</option>{national && <option value="NATIONAL">NATIONAL</option>}</select></label>}{modal !== "create" && <label className="flex items-center gap-3 self-end rounded-xl border border-[#E3E8EC] px-4 py-3 font-semibold text-[#34424A]"><input type="checkbox" checked={actif} onChange={(event) => setActif(event.target.checked)} className="size-4 accent-[#78BE20]" />Compte actif</label>}</div>{role === "RR" && <fieldset className="mt-5"><legend className="font-semibold text-[#34424A]">Rayon(x)</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{availableRayons.map((rayon) => <label key={rayon.id} className="flex items-center gap-3 rounded-xl border border-[#E3E8EC] px-4 py-3"><input type="checkbox" checked={rayonIds.includes(rayon.id)} onChange={() => toggleRayon(rayon.id)} className="size-4 accent-[#78BE20]" />{rayon.code} — {rayon.nom}</label>)}{availableRayons.length === 0 && <p className="text-sm text-[#66727A]">Aucun rayon disponible pour ce magasin.</p>}</div></fieldset>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setModal(null)} className="rounded-xl border border-[#E3E8EC] px-4 py-3 font-bold text-[#101820]">Annuler</button><button disabled={loading} className="rounded-xl bg-[#78BE20] px-4 py-3 font-bold text-white hover:bg-[#4F8F12] disabled:opacity-60">Enregistrer</button></div></form></div></div>}

      {suppression && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5" role="dialog" aria-modal="true" aria-labelledby="delete-user-title"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"><h2 id="delete-user-title" className="text-xl font-black text-[#101820]">Supprimer définitivement cet utilisateur ?</h2><p className="mt-3 text-[#66727A]">Cette action supprimera le compte DockFlow ainsi que le compte Supabase Auth.</p><p className="mt-4 rounded-xl bg-[#F6F8FA] p-4 font-bold text-[#101820]">{suppression.email}</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setSuppression(null)} className="rounded-xl border border-[#E3E8EC] px-4 py-3 font-bold text-[#101820]">Annuler</button><button type="button" onClick={() => void supprimer()} disabled={loading} className="rounded-xl bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60">Supprimer</button></div></div></div>}
    </>
  );
}
