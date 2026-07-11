import Link from "next/link";
import {
  ArrowLeft,
  Search,
  ScanLine,
  Clock3,
} from "lucide-react";

export default function RecherchePage() {
  return (
    <main className="min-h-screen bg-[#0F172A] flex justify-center py-8">

      <div className="w-[390px] min-h-screen bg-[#111827] text-white">

        {/* HEADER */}

        <header className="sticky top-0 bg-[#111827] border-b border-slate-800 p-5">

          <div className="flex items-center gap-4">

            <Link
              href="/cariste"
              className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center"
            >
              <ArrowLeft size={20}/>
            </Link>

            <h1 className="text-2xl font-bold">
              Recherche
            </h1>

          </div>

        </header>

        <div className="p-5">

          {/* BARRE */}

          <div className="flex gap-3">

            <div className="flex-1 h-14 rounded-2xl bg-slate-800 flex items-center px-4">

              <Search
                size={20}
                className="text-slate-400"
              />

              <input
                className="ml-3 flex-1 bg-transparent outline-none"
                placeholder="Commande, EAN ou Réf LM"
              />

            </div>

            <button className="w-14 rounded-2xl bg-[#78BE20] flex items-center justify-center">

              <ScanLine size={22}/>

            </button>

          </div>

          {/* HISTORIQUE */}

          <div className="mt-8">

            <h2 className="text-lg font-bold">
              Dernières recherches
            </h2>

            <div className="space-y-3 mt-5">

              {[
                "Commande 458963",
                "Salon de jardin",
                "EAN 3700541204568",
                "Réf LM 82345671",
              ].map((item) => (

                <button
                  key={item}
                  className="w-full rounded-2xl bg-slate-800 p-4 flex items-center gap-4 hover:bg-slate-700 transition"
                >

                  <Clock3
                    size={18}
                    className="text-slate-400"
                  />

                  <span>
                    {item}
                  </span>

                </button>

              ))}

            </div>

          </div>

          {/* BOUTON */}

          <button className="mt-10 w-full rounded-2xl bg-[#78BE20] py-4 font-bold text-lg">

            Rechercher

          </button>

        </div>

      </div>

    </main>
  );
}