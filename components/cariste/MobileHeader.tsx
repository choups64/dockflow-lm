"use client";

import { Bell, Menu } from "lucide-react";

export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#0F172A] border-b border-slate-800">

      <div className="flex items-center justify-between px-5 pt-6">

        <button className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center">
          <Menu size={22} className="text-white" />
        </button>

        <div className="text-center">

          <h1 className="text-white text-xl font-bold">
            DockFlow LM
          </h1>

          <p className="text-slate-400 text-xs">
            Application Cariste
          </p>

        </div>

        <button className="relative w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center">

          <Bell size={20} className="text-white" />

          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#78BE20]" />

        </button>

      </div>

      <div className="px-5 py-5">

        <h2 className="text-3xl font-bold text-white">
          Bonjour Rémi 👋
        </h2>

        <p className="text-slate-400 mt-1">
          Prêt pour les arrivages du jour ?
        </p>

      </div>

    </header>
  );
}