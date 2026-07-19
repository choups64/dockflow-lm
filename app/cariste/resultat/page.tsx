import { Suspense } from "react";
import ResultatCaristeContent from "./ResultatCaristeContent";

export default function ResultatCaristePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090D0F] text-white">
          <div className="mx-auto w-full max-w-lg px-3 py-8 text-base sm:px-5 sm:py-10">Recherche en cours…</div>
        </div>
      }
    >
      <ResultatCaristeContent />
    </Suspense>
  );
}
