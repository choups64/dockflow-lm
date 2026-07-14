export interface BackoLine {
  referenceLM: string;
  designation: string;
  quantite: number;
}

export interface BackoResult {
  commande: string;
  fournisseur: string;
  dateLivraison: string;
  lignes: BackoLine[];
}

export function parseBacko(text: string): BackoResult {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // =========================
  // Commande
  // =========================

  const commande =
    lines.find((l) => l.includes("N° commande"))
      ?.match(/\d{8}/)?.[0] ?? "";

  // =========================
  // Fournisseur
  // =========================

  let fournisseur = "";

  const fournisseurLine = lines.find((l) =>
    l.includes("Fournisseur")
  );

  if (fournisseurLine) {
    const match = fournisseurLine.match(
      /Fournisseur\s*:\s*(.*?)\s*Date cde/i
    );

    fournisseur = match ? match[1].trim() : "";
  }

  // =========================
  // Date livraison
  // =========================

  const dateLivraison =
    lines.find((l) => l.includes("Date liv"))
      ?.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] ?? "";

  // =========================
  // Produits
  // =========================

  const produits: BackoLine[] = [];

  for (const line of lines) {

    // Ignore les lignes d'entête
    if (
      line.includes("N° commande") ||
      line.includes("Fournisseur") ||
      line.includes("Date liv") ||
      line.includes("Date cde") ||
      line.includes("Etat") ||
      line.includes("DETAIL COMMANDE") ||
      line.includes("Réf") ||
      line.includes("Qté") ||
      line.includes("Prix") ||
      line.includes("Boni") ||
      line.includes("Total cde") ||
      line.startsWith("Fin(")
    ) {
      continue;
    }

    // Cherche une référence LM de 8 chiffres
    const ref = line.match(/\b\d{8}\b/);

    if (!ref) continue;

    const referenceLM = ref[0];

    // Tout ce qui est après la référence
    let designation = line.substring(
      line.indexOf(referenceLM) + referenceLM.length
    );

    // Nettoyage OCR
    designation = designation
      .replace(/^[|\s:]+/, "")
      .replace(/\s+/g, " ")
      .trim();

    // Coupe avant le premier nombre décimal
    const premierNombre = designation.search(/-?\d+\.\d{2}/);

    if (premierNombre > -1) {
      designation = designation.substring(0, premierNombre).trim();
    }

    // Ignore les désignations trop courtes
    if (designation.length < 3) continue;

    produits.push({
      referenceLM,
      designation,
      quantite: 0,
    });
  }

  return {
    commande,
    fournisseur,
    dateLivraison,
    lignes: produits,
  };
}