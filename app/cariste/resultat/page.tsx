import Link from "next/link";
import {
  ArrowLeft,
  Package,
  ChevronRight,
} from "lucide-react";

export default function ResultatRecherche() {
  return (
    <main className="min-h-screen bg-[#0F172A] flex justify-center py-8">

      <div className="w-[390px] min-h-screen bg-[#111827] text-white">

        {/* HEADER */}

        <header className="sticky top-0 bg-[#111827] border-b border-slate-800 px-5 py-5">

          <div className="flex items-center gap-4">

            <Link
              href="/cariste/recherche"
              className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </Link>

            <div>

              <h1 className="text-2xl font-bold">
                Résultats
              </h1>

              <p className="text-sm text-slate-400">
                3 palettes trouvées
              </p>

            </div>

          </div>

        </header>

        <div className="p-5 space-y-4">

          {/* Palette 1 */}

          <Link
            href="/cariste/detail"
            className="block rounded-3xl bg-slate-800 border border-slate-700 p-5 hover:border-[#78BE20] transition"
          >

            <div className="flex justify-between items-center">

              <div className="flex items-center gap-4">

                <div className="w-14 h-14 rounded-2xl bg-[#78BE20] flex items-center justify-center">

                  <Package size={26} />

                </div>

                <div>

                  <h2 className="font-bold text-lg">
                    Salon de jardin
                  </h2>

                  <p className="text-slate-400">
                    Cmd 458963
                  </p>

                </div>

              </div>

              <ChevronRight />

            </div>

            <div className="mt-5 flex justify-between text-sm">

              <span className="text-slate-400">
                Rayon
              </span>

              <span className="font-semibold">
                R9
              </span>

            </div>

            <div className="mt-2 flex justify-between text-sm">

              <span className="text-slate-400">
                Destination
              </span>

              <span className="text-[#78BE20] font-bold">
                MER + 2 autres
              </span>

            </div>

          </Link>

          {/* Palette 2 */}

          <div className="rounded-3xl bg-slate-800 border border-slate-700 p-5">

            <div className="flex justify-between">

              <div>

                <h2 className="font-bold">
                  Salon de jardin
                </h2>

                <p className="text-slate-400">
                  Cmd 458963
                </p>

              </div>

              <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                R9
              </span>

            </div>

            <div className="mt-5 flex justify-between">

              <span>Réserve 1</span>

              <span>2 palettes</span>

            </div>

          </div>

          {/* Palette 3 */}

          <div className="rounded-3xl bg-slate-800 border border-slate-700 p-5">

            <div className="flex justify-between">

              <div>

                <h2 className="font-bold">
                  Salon de jardin
                </h2>

                <p className="text-slate-400">
                  Cmd 458963
                </p>

              </div>

              <span className="bg-orange-600 px-3 py-1 rounded-full text-sm">
                R9
              </span>

            </div>

            <div className="mt-5 flex justify-between">

              <span>Rack Effi</span>

              <span>1 palette</span>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}