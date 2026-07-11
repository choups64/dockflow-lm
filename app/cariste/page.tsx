import SearchBar from "@/components/cariste/SearchBar";
import ScannerButton from "@/components/cariste/ScannerButton";
import ArrivalCard from "@/components/cariste/ArrivalCard";
import DestinationCard from "@/components/cariste/DestinationCard";
import BottomMenu from "@/components/cariste/BottomMenu";

export default function CaristePage() {
  return (
    <main className="min-h-screen bg-[#111827] text-white pb-24">

      {/* Header */}

      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] px-5 py-6 shadow-xl">

        <h1 className="text-3xl font-bold">
          DockFlow LM
        </h1>

        <p className="text-green-400 mt-1">
          Application Cariste
        </p>

      </div>

      <div className="p-5 space-y-6">

        {/* Recherche */}

        <SearchBar />

        <ScannerButton />

        {/* Carte principale */}

        <ArrivalCard
          produit="Salon de jardin"
          commande="458963"
          rayon="R7"
          palettes={7}
          destination="Destinations multiples"
          date="15/07/2026"
        />

        {/* Destinations */}

        <div className="space-y-3">

          <DestinationCard
            destination="MER"
            palettes={4}
          />

          <DestinationCard
            destination="Réserve 1"
            palettes={2}
          />

          <DestinationCard
            destination="Rack Effi"
            palettes={1}
          />

        </div>

      </div>

      <BottomMenu />

    </main>
  );
}