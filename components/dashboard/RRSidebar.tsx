"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  House,
  LogOut,
  Package,
  PlusCircle,
} from "lucide-react";

const liens = [
  { href: "/dashboard", label: "Accueil", icon: House },
  { href: "/dashboard/arrivages", label: "Mes arrivages", icon: Package },
  { href: "/dashboard/nouvel-arrivage", label: "Nouvel arrivage", icon: PlusCircle },
  { href: "/import", label: "Import BACKO", icon: FileSpreadsheet },
];

export default function RRSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function deconnexion() {
    localStorage.removeItem("user");
    router.push("/");
  }

  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col bg-[#0B1115] text-white lg:sticky lg:top-0 lg:flex">
      <div className="border-b border-white/10 px-7 py-8">
        <Image
          src="/leroy-merlin-logo.svg"
          alt="Leroy Merlin"
          width={110}
          height={70}
          className="h-12 w-auto object-contain brightness-0 invert"
        />
        <p className="mt-7 text-2xl font-black tracking-[0.12em]">
          DOCK<span className="text-[#78BE20]">FLOW</span>
        </p>
        <p className="mt-2 text-xs font-bold tracking-[0.18em] text-slate-400">MODE RR</p>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6" aria-label="Navigation responsable de rayon">
        {liens.map(({ href, label, icon: Icon }) => {
          const actif = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78BE20] ${
                actif ? "bg-[#78BE20] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          onClick={deconnexion}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78BE20]"
        >
          <LogOut size={20} aria-hidden="true" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
