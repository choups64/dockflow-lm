import Link from "next/link";
import { ArrowLeft, Package2 } from "lucide-react";

export default function DetailPalette() {
  return (
    <main className="min-h-screen bg-[#0F172A] flex justify-center py-8">

      <div className="w-[390px] min-h-screen bg-[#111827] text-white">

        {/* Header */}

        <header className="sticky top-0 bg-[#111827] border-b border-slate-800 p-5">

          <div className="flex items-center gap-4">

            <Link
              href="/cariste/resultat"
              className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </Link>

            <div>

              <h1 className="text-2xl font-bold">
                Détail palette
              </h1>

              <p className="text-slate-400">
                Commande 458963
              </p>

            </div>

          </div>

        </header>

        <div className="p-5 space-y-5">

          <div className="rounded-3xl bg-slate-800 border border-slate-700 p-6">

            <div className="flex items-center gap-4">

              <div className="w-16 h-16 rounded-2xl bg-[#78BE20] flex items-center justify-center">

                <Package2 size={28} />

              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Salon de jardin
                </h2>

                <p className="text-slate-400">
                  Rayon R9
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-3xl bg-slate-800 border border-slate-700 p-6">

            <h3 className="font-bold text-lg mb-5">
              Destinations
            </h3>

            <div className="space-y-4">

              <div className="flex justify-between">
                <span>MER</span>
                <span className="font-bold text-[#78BE20]">
                  4 palettes
                </span>
              </div>

              <div className="flex justify-between">
                <span>Réserve 1</span>
                <span className="font-bold">
                  2 palettes
                </span>
              </div>

              <div className="flex justify-between">
                <span>Rack Effi</span>
                <span className="font-bold">
                  1 palette
                </span>
              </div>

            </div>

          </div>

          <div className="rounded-3xl bg-slate-800 border border-slate-700 p-6">

            <div className="flex justify-between">

              <span className="text-slate-400">
                Mise à disposition
              </span>

              <span className="font-bold">
                15/07/2026
              </span>

            </div>

          </div>

          <button className="w-full rounded-2xl bg-[#78BE20] py-4 text-lg font-bold">
            Palette traitée
          </button>

        </div>

      </div>

    </main>
  );
}