import { Suspense } from "react";
import ResultatCaristeContent from "./ResultatCaristeContent";

export default function ResultatCaristePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090D0F] text-white">
          <div className="mx-auto max-w-lg px-5 py-10">Recherche en cours…</div>
        </div>
      }
    >
      <ResultatCaristeContent />
    </Suspense>
  );
}
