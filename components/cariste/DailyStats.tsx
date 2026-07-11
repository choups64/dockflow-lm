interface DailyStatsProps {
  commandes: number;
  palettes: number;
  op: number;
  urgentes: number;
}

export default function DailyStats({
  commandes,
  palettes,
  op,
  urgentes,
}: DailyStatsProps) {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700 p-5 shadow-xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-slate-400 text-sm">
            Aujourd'hui
          </p>

          <h2 className="text-2xl font-bold text-white mt-1">
            Activité
          </h2>

        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#78BE20] flex items-center justify-center text-white font-bold text-lg">
          📦
        </div>

      </div>

      <div className="grid grid-cols-4 gap-3 mt-6">

        <div className="rounded-2xl bg-slate-800 p-3 text-center">

          <p className="text-2xl font-bold text-[#78BE20]">
            {commandes}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Commandes
          </p>

        </div>

        <div className="rounded-2xl bg-slate-800 p-3 text-center">

          <p className="text-2xl font-bold text-[#78BE20]">
            {palettes}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Palettes
          </p>

        </div>

        <div className="rounded-2xl bg-slate-800 p-3 text-center">

          <p className="text-2xl font-bold text-[#78BE20]">
            {op}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            OP
          </p>

        </div>

        <div className="rounded-2xl bg-slate-800 p-3 text-center">

          <p className="text-2xl font-bold text-[#EF4444]">
            {urgentes}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Urgentes
          </p>

        </div>

      </div>

    </section>
  );
}