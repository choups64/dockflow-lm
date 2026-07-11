import Link from "next/link";
import {
  FileSpreadsheet,
  Package,
  Truck,
  Settings,
  ArrowRight,
} from "lucide-react";

export default function DashboardRR() {
  return (
    <main className="min-h-screen bg-slate-100">

      {/* HEADER */}

      <header className="bg-white border-b shadow-sm">

        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">

          <div>

            <h1 className="text-4xl font-bold text-slate-800">
              Bonjour Rémi 👋
            </h1>

            <p className="text-slate-500 mt-1">
              Responsable de rayon
            </p>

          </div>

          <div className="text-right">

            <p className="text-slate-500">
              DockFlow LM
            </p>

            <p className="text-3xl font-bold text-[#78BE20]">
              Dashboard
            </p>

          </div>

        </div>

      </header>

      {/* CONTENU */}

      <div className="max-w-7xl mx-auto p-8">

        {/* STATISTIQUES */}

        <div className="grid grid-cols-4 gap-6 mb-8">

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">

            <p className="text-slate-500">
              Arrivages
            </p>

            <h2 className="text-5xl font-bold text-[#78BE20] mt-3">
              12
            </h2>

          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">

            <p className="text-slate-500">
              Camions
            </p>

            <h2 className="text-5xl font-bold text-[#78BE20] mt-3">
              4
            </h2>

          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">

            <p className="text-slate-500">
              OP
            </p>

            <h2 className="text-5xl font-bold text-[#78BE20] mt-3">
              6
            </h2>

          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">

            <p className="text-slate-500">
              Palettes
            </p>

            <h2 className="text-5xl font-bold text-[#78BE20] mt-3">
              48
            </h2>

          </div>

        </div>

        {/* ACCÈS RAPIDES */}

        <div className="grid grid-cols-2 gap-6">

          <Link
            href="/import"
            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:border-[#78BE20] hover:shadow-lg transition"
          >
            <FileSpreadsheet
              size={42}
              className="text-[#78BE20]"
            />

            <h2 className="text-2xl font-bold mt-6">
              Import BACKO
            </h2>

            <p className="text-slate-500 mt-2">
              Importer une capture BACKO.
            </p>

            <ArrowRight className="mt-6 text-[#78BE20]" />

          </Link>

          <Link
            href="/dashboard/nouvel-arrivage"
            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:border-[#78BE20] hover:shadow-lg transition"
          >
            <Package
              size={42}
              className="text-[#78BE20]"
            />

            <h2 className="text-2xl font-bold mt-6">
              Nouvel arrivage
            </h2>

            <p className="text-slate-500 mt-2">
              Préparer un nouvel arrivage.
            </p>

            <ArrowRight className="mt-6 text-[#78BE20]" />

          </Link>

          <Link
            href="/dashboard/arrivages"
            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:border-[#78BE20] hover:shadow-lg transition"
          >
            <Truck
              size={42}
              className="text-[#78BE20]"
            />

            <h2 className="text-2xl font-bold mt-6">
              Mes arrivages
            </h2>

            <p className="text-slate-500 mt-2">
              Consulter et modifier les arrivages.
            </p>

            <ArrowRight className="mt-6 text-[#78BE20]" />

          </Link>

          <Link
            href="/parametres"
            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:border-[#78BE20] hover:shadow-lg transition"
          >
            <Settings
              size={42}
              className="text-[#78BE20]"
            />

            <h2 className="text-2xl font-bold mt-6">
              Paramètres
            </h2>

            <p className="text-slate-500 mt-2">
              Configuration de l'application.
            </p>

            <ArrowRight className="mt-6 text-[#78BE20]" />

          </Link>

        </div>

      </div>

    </main>
  );
}