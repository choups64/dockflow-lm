interface ArrivalCardProps {
  produit: string;
  commande: string;
  rayon: string;
  palettes: number;
  destination: string;
  date: string;
}

export default function ArrivalCard({
  produit,
  commande,
 rayon,
  palettes,
  destination,
  date,
}: ArrivalCardProps) {
  return (
    <div className="rounded-3xl bg-slate-800 p-5 shadow-lg border border-slate-700">

      <div className="flex justify-between items-start">

        <div>
          <h2 className="text-xl font-bold text-white">
            {produit}
          </h2>

          <p className="text-slate-400 mt-1">
            Commande {commande}
          </p>
        </div>

        <div className="rounded-full bg-[#78BE20] px-3 py-1 text-sm font-bold text-white">
          {rayon}
        </div>

      </div>

      <div className="mt-5 space-y-2">

        <div className="flex justify-between">
          <span className="text-slate-400">Palettes</span>
          <span className="font-semibold text-white">{palettes}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Destination</span>
          <span className="font-semibold text-[#78BE20]">{destination}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Mise à disposition</span>
          <span className="font-semibold text-white">{date}</span>
        </div>

      </div>
    </div>
  );
}