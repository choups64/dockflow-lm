"use client";

import Link from "next/link";
import { Home, Search, Package, User } from "lucide-react";

export default function BottomMenu() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 h-20 flex justify-around items-center">

      <Link
        href="/cariste"
        className="flex flex-col items-center text-[#78BE20]"
      >
        <Home size={24} />
        <span className="text-xs mt-1">Accueil</span>
      </Link>

      <Link
        href="/cariste/recherche"
        className="flex flex-col items-center text-slate-400"
      >
        <Search size={24} />
        <span className="text-xs mt-1">Recherche</span>
      </Link>

      <Link
        href="/cariste/arrivages"
        className="flex flex-col items-center text-slate-400"
      >
        <Package size={24} />
        <span className="text-xs mt-1">Arrivages</span>
      </Link>

      <Link
        href="/cariste/compte"
        className="flex flex-col items-center text-slate-400"
      >
        <User size={24} />
        <span className="text-xs mt-1">Compte</span>
      </Link>

    </nav>
  );
}