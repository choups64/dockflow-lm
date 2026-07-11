interface StatCardProps {
  title: string;
  value: string;
  color?: string;
}

export default function StatCard({
  title,
  value,
  color = "#78BE20",
}: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 hover:shadow-lg transition-all duration-300">

      <p className="text-slate-500 text-sm">
        {title}
      </p>

      <h2
        className="mt-4 text-5xl font-bold"
        style={{ color }}
      >
        {value}
      </h2>

    </div>
  );
}