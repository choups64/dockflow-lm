import Link from "next/link";
import { ArrowLeft, Plus, Pencil } from "lucide-react";

export default function ArrivagesRR() {
  return (
    <main className="min-h-screen bg-slate-100">

      <header className="bg-white border-b">

        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">

          <div className="flex items-center gap-4">

            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </Link>

            <div>

              <h1 className="text-3xl font-bold">
                Mes arrivages
              </h1>

              <p className="text-slate-500">
                Responsable de rayon
              </p>

            </div>

          </div>

          <Link
            href="/dashboard/nouvel-arrivage"
            className="flex items-center gap-2 rounded-xl bg-[#78BE20] px-5 py-3 text-white font-semibold"
          >
            <Plus size={18} />
            Nouvel arrivage
          </Link>

        </div>

      </header>

      <div className="max-w-7xl mx-auto p-8 space-y-5">

        {[
          {
            commande: "458963",
            produit: "Salon de jardin",
            palettes: 7,
            date: "15/07/2026",
          },
          {
            commande: "458964",
            produit: "WC suspendu",
            palettes: 3,
            date: "16/07/2026",
          },
          {
            commande: "458965",
            produit: "Parquet stratifié",
            palettes: 9,
            date: "17/07/2026",
          },
        ].map((arrivage) => (

          <div
            key={arrivage.commande}
            className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex justify-between items-center"
          >

            <div>

              <h2 className="text-2xl font-bold">
                {arrivage.produit}
              </h2>

              <p className="text-slate-500 mt-2">
                Commande BACKO : {arrivage.commande}
              </p>

              <p className="text-slate-500">
                {arrivage.palettes} palettes
              </p>

              <p className="text-slate-500">
                Mise en magasin : {arrivage.date}
              </p>

            </div>

            <Link
              href="/dashboard/modifier-arrivage"
              className="rounded-xl bg-slate-100 p-4 hover:bg-slate-200"
            >
              <Pencil size={22} />
            </Link>

          </div>

        ))}

      </div>

    </main>
  );
}