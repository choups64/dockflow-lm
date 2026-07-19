"use client";

import { useEffect, useState } from "react";

type MobileMetrics = {
  innerWidth: number;
  screenWidth: number;
  devicePixelRatio: number;
  documentWidth: number;
};

function lireMetriques(): MobileMetrics {
  return {
    innerWidth: window.innerWidth,
    screenWidth: window.screen.width,
    devicePixelRatio: window.devicePixelRatio,
    documentWidth: document.documentElement.scrollWidth,
  };
}

export default function MobileDebug() {
  const [metriques, setMetriques] = useState<MobileMetrics | null>(null);

  useEffect(() => {
    const actualiser = () => {
      const prochainesMetriques = lireMetriques();
      console.log("[MOBILE DEBUG]", prochainesMetriques);
      setMetriques(prochainesMetriques);
    };

    actualiser();
    window.addEventListener("resize", actualiser);
    return () => window.removeEventListener("resize", actualiser);
  }, []);

  if (process.env.NODE_ENV === "production" || !metriques) return null;

  return (
    <div className="fixed bottom-3 right-3 z-50 rounded-lg border border-[#78BE20]/60 bg-[#11181C]/95 px-3 py-2 text-xs font-semibold text-white shadow-lg">
      <p>Viewport : {metriques.innerWidth} px</p>
      <p>Document : {metriques.documentWidth} px</p>
      <p>DPR : {metriques.devicePixelRatio}</p>
    </div>
  );
}
