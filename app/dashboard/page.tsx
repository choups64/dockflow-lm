"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardCheck,
  FileSpreadsheet,
  PackageOpen,
  Plus,
  Truck,
} from "lucide-react";
import RRSidebar from "@/components/dashboard/RRSidebar";
import { supabase } from "@/lib/supabase";
import { getFirstNameFromEmail } from "@/lib/profile-utils";
import { ProfileService } from "@/services/profile";

type Arrivage = { statut: string | null };
type LigneArrivage = { nombre_palettes: number | string | null };

const STATUTS_ACTIFS = ["EN_PREPARATION", "PREPARATION", "PRET_A_RECEVOIR"];
const STATUTS_PREPARATION = ["EN_PREPARATION", "PREPARATION"];

export default function DashboardRR() {
  const [prenom, setPrenom] = useState<string | null>(null);
  const [rayonsAffiches, setRayonsAffiches] = useState("Aucun rayon associé");
  const [rayonsComplets, setRayonsComplets] = useState("Aucun rayon associé");
  const [arrivagesActifs, setArrivagesActifs] = useState(0);
  const [palettesTotales, setPalettesTotales] = useState(0);
  const [enPreparation, setEnPreparation] = useState(0);

  useEffect(() => {
    async function chargerIdentite() {
      try {
        const profil = await ProfileService.getCurrentProfile();
        setPrenom(getFirstNameFromEmail(profil.email));
        const rayons = profil.rayons
          .filter((rayon) => rayon.actif && rayon.magasin_id === profil.magasinId)
          .sort((a, b) => a.code.localeCompare(b.code));
        const libelles = rayons.map((rayon) => `${rayon.code} ${rayon.nom}`);
        const resume = libelles.length > 2
          ? `${libelles.slice(0, 2).join(" · ")} · +${libelles.length - 2} autre${libelles.length - 2 > 1 ? "s" : ""}`
          : libelles.join(" · ");
        setRayonsAffiches(resume || "Aucun rayon associé");
        setRayonsComplets(libelles.join(" · ") || "Aucun rayon associé");
      } catch {
        setPrenom(null);
        setRayonsAffiches("Aucun rayon associé");
        setRayonsComplets("Aucun rayon associé");
      }
    }

    async function chargerStatistiques() {
      const [{ data: arrivages, error: erreurArrivages }, { data: lignes, error: erreurLignes }] = await Promise.all([
        supabase.from("arrivages").select("statut"),
        supabase.from("arrivage_lignes").select("nombre_palettes"),
      ]);

      if (erreurArrivages || erreurLignes) {
        console.error("Impossible de charger les statistiques du dashboard", erreurArrivages ?? erreurLignes);
        return;
      }

      const arrivagesData = (arrivages ?? []) as Arrivage[];
      const lignesData = (lignes ?? []) as LigneArrivage[];
      setArrivagesActifs(arrivagesData.filter((arrivage) => STATUTS_ACTIFS.includes(arrivage.statut ?? "")).length);
      setEnPreparation(arrivagesData.filter((arrivage) => STATUTS_PREPARATION.includes(arrivage.statut ?? "")).length);
      setPalettesTotales(lignesData.reduce((total, ligne) => total + (Number(ligne.nombre_palettes) || 0), 0));
    }

    void chargerIdentite();
    void chargerStatistiques();
  }, []);

  const nomAffiche = prenom ? `Bonjour ${prenom}` : "Bonjour";

  return (
    <main className="min-h-screen bg-[#F6F8FA] text-[#101820] lg:flex">
      <RRSidebar />

      <div className="min-w-0 flex-1">
        <header className="border-b border-[#E3E8EC] bg-white px-5 py-4 lg:hidden">
          <p className="text-lg font-black tracking-[0.12em]">DOCK<span className="text-[#78BE20]">FLOW</span></p>
          <p className="text-xs font-bold tracking-[0.16em] text-[#66727A]">MODE RR</p>
        </header>

        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          <section className="relative min-h-[250px] overflow-hidden rounded-3xl border border-[#E3E8EC] bg-white px-6 py-8 sm:min-h-[280px] sm:px-10 sm:py-10">
            <div className="relative z-10 max-w-xl">
              <p title={rayonsComplets} className="text-sm font-bold uppercase leading-relaxed tracking-[0.18em] text-[#66727A]">Responsable de rayon — {rayonsAffiches}</p>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                {nomAffiche} <span aria-hidden="true">👋</span>
              </h1>
              <p className="mt-4 text-base text-[#66727A] sm:text-lg">Optimisez vos flux logistiques avec <span className="font-bold text-[#4F8F12]">DockFlow</span>.</p>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-3/5">
              <Image
                src="/images/rr-logistics-hero.webp"
                alt="Camion, palettes et chariot élévateur sur un quai logistique"
                fill
                priority
                sizes="(max-width: 640px) 100vw, 60vw"
                className="object-contain object-right-bottom opacity-25 sm:opacity-100"
              />
            </div>
          </section>

          <section className="mt-7 grid gap-4 sm:grid-cols-3">
            <StatCard icon={<Truck size={24} />} label="Arrivages actifs" value={arrivagesActifs} />
            <StatCard icon={<PackageOpen size={24} />} label="Palettes totales" value={palettesTotales} />
            <StatCard icon={<ClipboardCheck size={24} />} label="En préparation" value={enPreparation} />
          </section>

          <section className="mt-9">
            <h2 className="text-2xl font-black">Actions rapides</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Link href="/dashboard/nouvel-arrivage" className="flex min-h-32 items-center gap-5 rounded-3xl bg-[#78BE20] p-6 text-white shadow-sm transition hover:bg-[#4F8F12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/40">
                <span className="rounded-2xl bg-white/15 p-4"><Plus size={30} aria-hidden="true" /></span>
                <span className="flex-1"><span className="block text-xl font-black">Nouvel arrivage</span><span className="mt-1 block text-sm text-white/80">Préparer une commande</span></span>
                <ArrowRight size={26} aria-hidden="true" />
              </Link>
              <Link href="/dashboard/arrivages" className="flex min-h-32 items-center gap-5 rounded-3xl border border-[#E3E8EC] bg-white p-6 shadow-sm transition hover:border-[#78BE20] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/30">
                <span className="rounded-2xl bg-[#EEF7E5] p-4 text-[#4F8F12]"><PackageOpen size={30} aria-hidden="true" /></span>
                <span className="flex-1"><span className="block text-xl font-black">Mes arrivages</span><span className="mt-1 block text-sm text-[#66727A]">Consulter et modifier les arrivages</span></span>
                <ArrowRight size={26} className="text-[#4F8F12]" aria-hidden="true" />
              </Link>
            </div>
            <Link href="/import" className="mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-[#4F8F12] hover:bg-[#EEF7E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78BE20]">
              <FileSpreadsheet size={18} aria-hidden="true" /> Importer une capture BACKO
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#E3E8EC] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="rounded-xl bg-[#EEF7E5] p-3 text-[#4F8F12]">{icon}</span>
        <div><p className="text-sm font-semibold text-[#66727A]">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div>
      </div>
    </div>
  );
}
