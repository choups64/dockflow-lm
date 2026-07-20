"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { supabase } from "@/lib/supabase";
import { ProfileService, type CurrentProfile } from "@/services/profile";

type Destination = { id: number; code: string; nom: string; magasin_id: string | null; actif: boolean };
type Magasin = { id: string; code: string; nom: string };

function normalizeDestinationCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

export default function DestinationsPage() {
  const [profil, setProfil] = useState<CurrentProfile | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [magasinId, setMagasinId] = useState("");
  const [actif, setActif] = useState(true);
  const [envoi, setEnvoi] = useState(false);

  const magasinsParId = useMemo(() => new Map(magasins.map((magasin) => [magasin.id, magasin])), [magasins]);

  const charger = useCallback(async () => {
    try {
      const current = await ProfileService.getCurrentProfile();
      setProfil(current);
      let destinationsQuery = supabase.from("destinations").select("id, code, nom, magasin_id, actif").order("code");
      let magasinsQuery = supabase.from("magasins").select("id, code, nom").order("code");
      if (current.adminScope !== "NATIONAL" && current.magasinId) {
        destinationsQuery = destinationsQuery.eq("magasin_id", current.magasinId);
        magasinsQuery = magasinsQuery.eq("id", current.magasinId);
      }
      const [destinationsResult, magasinsResult] = await Promise.all([destinationsQuery, magasinsQuery]);
      if (destinationsResult.error || magasinsResult.error) throw destinationsResult.error ?? magasinsResult.error;
      setDestinations((destinationsResult.data ?? []) as Destination[]);
      setMagasins((magasinsResult.data ?? []) as Magasin[]);
      setErreur(null);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : "Impossible de charger les destinations.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
  }, [charger]);

  function ouvrirFormulaire() {
    setCode("");
    setNom("");
    setMagasinId(profil?.adminScope === "NATIONAL" ? "" : (profil?.magasinId ?? ""));
    setActif(true);
    setFormulaireOuvert(true);
  }

  async function creer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (envoi) return;

    const codeNormalise = normalizeDestinationCode(code);
    const nomNormalise = nom.trim().replace(/\s+/g, " ");
    if (!codeNormalise || !nomNormalise) {
      toast.error("Le code et le nom de la destination sont obligatoires.");
      return;
    }

    setEnvoi(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/destinations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ code: codeNormalise, nom: nomNormalise, magasinId: magasinId || null, actif }),
      });
      const result = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error ?? "Création de la destination impossible.");

      setFormulaireOuvert(false);
      await charger();
      toast.success(result.message ?? "Destination créée.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Création de la destination impossible.");
    } finally {
      setEnvoi(false);
    }
  }

  return <>
    <AdminPageHeader
      title="Destinations"
      description="Destinations disponibles, filtrées selon le périmètre administrateur."
      action={<button type="button" onClick={ouvrirFormulaire} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#78BE20] px-5 font-bold text-white hover:bg-[#4F8F12]"><Plus size={18} />Nouvelle destination</button>}
    />
    {erreur ? <p className="rounded-xl bg-red-50 p-4 text-red-700">{erreur}</p> : <section className="overflow-x-auto rounded-3xl border border-[#E3E8EC] bg-white shadow-sm">
      <table className="w-full table-fixed text-left"><thead className="bg-[#F6F8FA] text-sm text-[#66727A]"><tr><th className="w-[18%] px-5 py-4">Code</th><th className="w-[28%] px-5 py-4">Nom</th><th className="w-[34%] px-5 py-4">Magasin</th><th className="w-[20%] px-5 py-4">Statut</th></tr></thead><tbody>
        {destinations.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-[#66727A]">Aucune destination.</td></tr> : destinations.map((destination) => {
          const magasin = destination.magasin_id ? magasinsParId.get(destination.magasin_id) : undefined;
          return <tr key={destination.id} className="border-t border-[#E3E8EC]"><td className="px-5 py-4 font-semibold">{destination.code}</td><td className="px-5 py-4">{destination.nom}</td><td className="px-5 py-4"><div className="min-w-0">{magasin ? <><p className="truncate font-semibold">{magasin.code}</p><p className="truncate text-xs text-[#66727A]">{magasin.nom}</p></> : <p className="font-semibold text-[#66727A]">National</p>}</div></td><td className="px-5 py-4"><span className={destination.actif ? "rounded-full bg-[#EEF7E5] px-3 py-1.5 text-sm font-bold text-[#4F8F12]" : "rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600"}>{destination.actif ? "Actif" : "Inactif"}</span></td></tr>;
        })}
      </tbody></table>
    </section>}

    {formulaireOuvert && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-5" role="dialog" aria-modal="true" aria-labelledby="create-destination-title"><div className="flex min-h-full items-center justify-center"><form onSubmit={creer} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><div><h2 id="create-destination-title" className="text-xl font-black text-[#101820]">Nouvelle destination</h2><p className="mt-1 text-sm text-[#66727A]">Formulaire de création uniquement</p></div><button type="button" onClick={() => setFormulaireOuvert(false)} disabled={envoi} className="rounded-lg p-2 text-[#66727A] hover:bg-slate-100 disabled:opacity-60" aria-label="Fermer"><X size={20} /></button></div><div className="grid gap-4"><label className="grid gap-2 font-semibold text-[#34424A]">Code<input required value={code} onChange={(event) => setCode(event.target.value)} onBlur={() => setCode(normalizeDestinationCode(code))} className="min-h-12 rounded-xl border border-[#E3E8EC] px-4 font-normal" /></label><label className="grid gap-2 font-semibold text-[#34424A]">Nom<input required value={nom} onChange={(event) => setNom(event.target.value)} className="min-h-12 rounded-xl border border-[#E3E8EC] px-4 font-normal" /></label><label className="grid gap-2 font-semibold text-[#34424A]">Magasin<select value={magasinId} onChange={(event) => setMagasinId(event.target.value)} className="min-h-12 rounded-xl border border-[#E3E8EC] bg-white px-4 font-normal">{profil?.adminScope === "NATIONAL" && <option value="">National / aucun magasin</option>}{magasins.map((magasin) => <option key={magasin.id} value={magasin.id}>{magasin.code} — {magasin.nom}</option>)}</select></label><label className="flex items-center gap-3 rounded-xl border border-[#E3E8EC] px-4 py-3 font-semibold text-[#34424A]"><input type="checkbox" checked={actif} onChange={(event) => setActif(event.target.checked)} className="size-4 accent-[#78BE20]" />Actif</label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setFormulaireOuvert(false)} disabled={envoi} className="rounded-xl border border-[#E3E8EC] px-4 py-3 font-bold text-[#101820] disabled:opacity-60">Annuler</button><button disabled={envoi} className="rounded-xl bg-[#78BE20] px-4 py-3 font-bold text-white hover:bg-[#4F8F12] disabled:cursor-not-allowed disabled:opacity-60">{envoi ? "Création…" : "Créer"}</button></div></form></div></div>}
  </>;
}
