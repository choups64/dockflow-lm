import Tesseract from "tesseract.js";

type BandeSelectionnee = {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
};

async function chargerImage(image: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Impossible de charger l'image pour l'OCR"));
    element.src = image;
  });
}

function detecterBandeSelectionnee(source: HTMLImageElement): BandeSelectionnee | null {
  const canvas = document.createElement("canvas");
  canvas.width = source.naturalWidth;
  canvas.height = source.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(source, 0, 0);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const largeur = canvas.width;
  const hauteur = canvas.height;
  const debutX = Math.floor(largeur * 0.03);
  const finX = Math.floor(largeur * 0.57);
  const debutY = Math.floor(hauteur * 0.3);
  const finY = Math.floor(hauteur * 0.82);
  const lignesClaires: number[] = [];

  for (let y = debutY; y < finY; y += 2) {
    let pixelsClairs = 0;
    let echantillons = 0;

    for (let x = debutX; x < finX; x += 4) {
      const offset = (y * largeur + x) * 4;
      if (data[offset] > 225 && data[offset + 1] > 225 && data[offset + 2] > 225) {
        pixelsClairs += 1;
      }
      echantillons += 1;
    }

    if (echantillons > 0 && pixelsClairs / echantillons > 0.55) {
      lignesClaires.push(y);
    }
  }

  if (lignesClaires.length === 0) return null;

  const y = Math.max(0, lignesClaires[0] - 4);
  const dernierY = lignesClaires[lignesClaires.length - 1] + 5;
  const bande = {
    x: debutX,
    y,
    largeur: finX - debutX,
    hauteur: Math.min(hauteur - y, Math.max(24, dernierY - y)),
  };

  console.log(`[OCR HIGHLIGHT] Zone claire détectée : x=${bande.x}, y=${bande.y}, largeur=${bande.largeur}, hauteur=${bande.hauteur}`);
  return bande;
}

function recadrerColonne(
  source: HTMLImageElement,
  bande: BandeSelectionnee,
  debutRatio: number,
  finRatio: number
): string {
  const x = Math.floor(source.naturalWidth * debutRatio);
  const largeur = Math.floor(source.naturalWidth * finRatio) - x;
  const canvas = document.createElement("canvas");
  const echelle = 2;
  canvas.width = largeur * echelle;
  canvas.height = bande.hauteur * echelle;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas indisponible pour le recadrage OCR");

  context.drawImage(source, x, bande.y, largeur, bande.hauteur, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  for (let offset = 0; offset < imageData.data.length; offset += 4) {
    const luminosite = 0.2126 * imageData.data[offset] + 0.7152 * imageData.data[offset + 1] + 0.0722 * imageData.data[offset + 2];
    const contraste = luminosite > 150 ? 255 : 0;
    imageData.data[offset] = contraste;
    imageData.data[offset + 1] = contraste;
    imageData.data[offset + 2] = contraste;
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function normaliserReference(texte: string): string | null {
  return texte.replace(/\D/g, "").match(/\d{8}/)?.[0] ?? null;
}

function normaliserDesignation(texte: string): string {
  return texte
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normaliserQuantite(texte: string): number | null {
  const valeur = texte.replace(",", ".").match(/\d+(?:\.\d+)?/)?.[0];
  if (!valeur) return null;

  const quantite = Math.round(Number(valeur));
  return Number.isInteger(quantite) && quantite > 0 ? quantite : null;
}

export async function readImage(image: string): Promise<string> {
  const debutTotal = performance.now();
  const source = await chargerImage(image);
  const debutDetection = performance.now();
  const bande = detecterBandeSelectionnee(source);
  console.log(`[OCR HIGHLIGHT] Détection : ${(performance.now() - debutDetection).toFixed(1)} ms`);

  const debutPrincipal = performance.now();
  const resultatPrincipal = await Tesseract.recognize(image, "fra+eng", {
    logger: (m) => {
      if (m.status === "recognizing text") console.log(`OCR : ${Math.round(m.progress * 100)}%`);
    },
  });
  let texte = resultatPrincipal.data.text;
  console.log(`[OCR HIGHLIGHT] OCR principal : ${(performance.now() - debutPrincipal).toFixed(1)} ms`);

  if (!bande) {
    console.log("[OCR HIGHLIGHT] Aucune ligne sélectionnée détectée");
    console.log(`[OCR HIGHLIGHT] Total : ${(performance.now() - debutTotal).toFixed(1)} ms`);
    return texte;
  }

  const debutLocal = performance.now();
  const [referenceImage, designationImage, quantiteImage] = [
    recadrerColonne(source, bande, 0.035, 0.14),
    recadrerColonne(source, bande, 0.15, 0.38),
    recadrerColonne(source, bande, 0.45, 0.545),
  ];
  console.log("[OCR HIGHLIGHT] Bande de ligne recadrée : Réf 3.5–14 %, Désignation 15–38 %, Qté 45–54.5 % (x2)");

  const worker = await Tesseract.createWorker("eng", 1, { logger: () => {} });
  let referenceBrute = "";
  let designationBrute = "";
  let quantiteBrute = "";

  try {
    referenceBrute = (await worker.recognize(referenceImage)).data.text;
    designationBrute = (await worker.recognize(designationImage)).data.text;
    quantiteBrute = (await worker.recognize(quantiteImage)).data.text;
  } finally {
    await worker.terminate();
  }

  console.log("[OCR HIGHLIGHT] Référence brute :", referenceBrute);
  console.log("[OCR HIGHLIGHT] Désignation brute :", designationBrute);
  console.log("[OCR HIGHLIGHT] Quantité brute :", quantiteBrute);
  console.log(`[OCR HIGHLIGHT] OCR local : ${(performance.now() - debutLocal).toFixed(1)} ms`);

  const reference = normaliserReference(referenceBrute);
  const designation = normaliserDesignation(designationBrute);
  const quantite = normaliserQuantite(quantiteBrute);

  if (reference && designation && quantite) {
    const ligne = `${reference} ${designation} ${quantite}.00`;
    console.log(`[OCR HIGHLIGHT] Ligne normalisée : ${reference} | ${designation} | ${quantite}`);
    const lignes = texte.split("\n");
    const indexLigneExistante = lignes.findIndex((ligneExistante) =>
      new RegExp(`\\b${reference}\\b`).test(ligneExistante)
    );

    if (indexLigneExistante >= 0) {
      lignes[indexLigneExistante] = ligne;
      texte = lignes.join("\n");
      console.log("[OCR HIGHLIGHT] Ligne fusionnée au résultat principal");
    } else {
      texte += `\n${ligne}`;
      console.log("[OCR HIGHLIGHT] Ligne fusionnée au résultat principal");
    }
  }

  console.log(`[OCR HIGHLIGHT] Total : ${(performance.now() - debutTotal).toFixed(1)} ms`);
  return texte;
}
