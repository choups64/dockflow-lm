interface DestinationCardProps {
  destination: string;
  palettes: number;
}

export default function DestinationCard({
  destination,
  palettes,
}: DestinationCardProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-700 p-4">

      <span className="text-white font-medium">
        {destination}
      </span>

      <span className="rounded-full bg-[#78BE20] px-3 py-1 text-sm font-bold text-white">
        {palettes} palettes
      </span>

    </div>
  );
}