import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NouvelArrivage() {
  return (
    <main className="min-h-screen bg-slate-100">

      <header className="bg-white border-b">

        <div className="max-w-6xl mx-auto h-20 flex items-center gap-4 px-8">

          <Link
            href="/dashboard/arrivages"
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>

            <h1 className="text-3xl font-bold">
              Nouvel arrivage
            </h1>

            <p className="text-slate-500">
              Responsable de rayon
            </p>

          </div>

        </div>

      </header>

      <div className="max-w-4xl mx-auto p-8">

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">

          <div className="grid grid-cols-2 gap-6">

            <div>

              <label className="text-sm font-semibold">
                Numéro de commande BACKO
              </label>

              <input
                className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                placeholder="458963"
              />

            </div>

            <div>

              <label className="text-sm font-semibold">
                Date de mise en magasin
              </label>

              <input
                type="date"
                className="mt-2 w-full rounded-xl border border-slate-300 p-3"
              />

            </div>

            <div>

              <label className="text-sm font-semibold">
                Rayon
              </label>

              <select className="mt-2 w-full rounded-xl border border-slate-300 p-3">

                <option>R1</option>
                <option>R2</option>
                <option>R3</option>
                <option>R4</option>
                <option>R5</option>
                <option>R6</option>
                <option>R7</option>
                <option>R8</option>
                <option>R9</option>
                <option>R10</option>
                <option>R11</option>
                <option>R12</option>
                <option>R13</option>

              </select>

            </div>

            <div>

              <label className="text-sm font-semibold">
                Commentaire produit
              </label>

              <input
                className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                placeholder="Ex : Salon de jardin"
              />

            </div>

          </div>

          <div className="mt-8">

            <h2 className="text-xl font-bold mb-4">
              Destinations
            </h2>

            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-4">

                <select className="rounded-xl border border-slate-300 p-3">

                  <option>MER</option>
                  <option>Réserve 1</option>
                  <option>Réserve 2</option>
                  <option>BMV</option>
                  <option>Rack Effi</option>

                </select>

                <input
                  className="rounded-xl border border-slate-300 p-3"
                  placeholder="Nombre de palettes"
                />

              </div>

            </div>

          </div>

          <button className="mt-10 flex items-center gap-3 rounded-xl bg-[#78BE20] px-6 py-4 text-white font-bold">

            <Save size={20} />

            Enregistrer l'arrivage

          </button>

        </div>

      </div>

    </main>
  );
}