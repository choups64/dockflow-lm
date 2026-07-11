import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  Package,
  Truck,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-72 bg-[#111827] text-white flex flex-col border-r border-zinc-800">

      {/* Logo */}

      <div className="flex flex-col items-center py-8">

        <Image
          src="/logo-lm.webp"
          alt="Leroy Merlin"
          width={80}
          height={80}
        />

        <h1 className="mt-5 text-3xl font-bold">
          DockFlow <span className="text-green-500">LM</span>
        </h1>

        <p className="text-sm text-zinc-400 mt-2">
          Optimisation des flux
        </p>

      </div>

      {/* Menu */}

      <nav className="flex-1 px-4 space-y-2">

        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-zinc-800 transition"
        >
          <LayoutDashboard size={20} />
          Tableau de bord
        </Link>

        <Link
          href="/import"
          className="flex items-center gap-3 rounded-xl bg-green-600 px-4 py-3 font-semibold hover:bg-green-700 transition"
        >
          <FileSpreadsheet size={20} />
          Commande BACKO
        </Link>

        <Link
          href="/arrivages/nouveau"
          className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-zinc-800 transition"
        >
          <PlusCircle size={20} />
          Nouvel arrivage
        </Link>

        <Link
          href="/arrivages"
          className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-zinc-800 transition"
        >
          <Package size={20} />
          Mes arrivages
        </Link>

        <Link
          href="/arrivages-du-jour"
          className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-zinc-800 transition"
        >
          <Truck size={20} />
          Arrivages du jour
        </Link>

        <Link
          href="/parametres"
          className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-zinc-800 transition"
        >
          <Settings size={20} />
          Paramètres
        </Link>

      </nav>

      {/* Bas */}

      <div className="border-t border-zinc-800 p-5">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center font-bold">

            RR

          </div>

          <div>

            <p className="font-semibold">
              Rémi
            </p>

            <p className="text-sm text-zinc-400">
              Responsable de rayon
            </p>

          </div>

        </div>

      </div>

    </aside>
  );
}