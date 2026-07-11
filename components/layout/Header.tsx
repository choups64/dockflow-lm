export default function Header() {
  const now = new Date();

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">

      <div>

        <h1 className="text-3xl font-bold text-slate-800">
          Tableau de bord
        </h1>

        <p className="text-sm text-slate-500">
          Responsable de rayon
        </p>

      </div>

      <div className="text-right">

        <p className="text-sm text-slate-500">
          {now.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <p className="text-2xl font-bold text-[#78BE20]">
          {now.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

      </div>

    </header>
  );
}