export function mergeOCRResults(results: string[]): string {
  if (results.length === 0) return "";

  // On garde pour l'instant le texte
  // qui contient le plus de caractères.
  // Plus tard on utilisera une logique
  // beaucoup plus intelligente.

  return results.reduce((best, current) => {
    return current.length > best.length
      ? current
      : best;
  }, "");
}