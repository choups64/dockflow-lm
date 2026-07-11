import Link from "next/link";
import { Truck, Boxes } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F172A] flex items-center justify-center p-8">

      <div className="w-[420px] rounded-[40px] bg-[#111827] border border-slate-700 shadow-2xl overflow-hidden">

        {/* Header */}

        <div className="bg-gradient-to-r from-[#78BE20] to-[#5F9C18] p-8">

          <h1 className="text-4xl font-black text-white text-center">
            DockFlow LM
          </h1>

          <p className="text-center text-white/80 mt-2">
            Gestion des arrivages Leroy Merlin
          </p>

        </div>

        {/* Contenu */}

        <div className="p-8">

          <h2 className="text-white text-2xl font-bold">
            Choisissez votre profil
          </h2>

          <p className="text-slate-400 mt-2">
            Sélectionnez votre mode d'utilisation.
          </p>

          <div className="mt-8 space-y-5">

            {/* RR */}

            <Link
              href="/dashboard"
              className="block rounded-3xl bg-slate-800 border border-slate-700 p-6 hover:border-[#78BE20] transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-5">

                <div className="w-16 h-16 rounded-2xl bg-[#78BE20] flex items-center justify-center">

                  <Boxes
                    size={30}
                    color="white"
                  />

                </div>

                <div>

                  <h3 className="text-white text-xl font-bold">
                    Responsable de Rayon
                  </h3>

                  <p className="text-slate-400 mt-1">
                    Gestion des commandes BACKO et des arrivages.
                  </p>

                </div>

              </div>

            </Link>

            {/* Cariste */}

            <Link
              href="/cariste"
              className="block rounded-3xl bg-slate-800 border border-slate-700 p-6 hover:border-[#78BE20] transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-5">

                <div className="w-16 h-16 rounded-2xl bg-[#78BE20] flex items-center justify-center">

                  <Truck
                    size={30}
                    color="white"
                  />

                </div>

                <div>

                  <h3 className="text-white text-xl font-bold">
                    Cariste
                  </h3>

                  <p className="text-slate-400 mt-1">
                    Recherche, scan EAN et gestion des palettes.
                  </p>

                </div>

              </div>

            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}