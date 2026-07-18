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

function recadrerBande(source: HTMLImageElement, bande: BandeSelectionnee): string {
  const canvas = document.createElement("canvas");
  const echelle = 2;
  canvas.width = bande.largeur * echelle;
  canvas.height = bande.hauteur * echelle;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas indisponible pour le recadrage OCR");

  context.drawImage(source, bande.x, bande.y, bande.largeur, bande.hauteur, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  for (let offset = 0; offset < imageData.data.length; offset += 4) {
    const luminosite = 0.2126 * imageData.data[offset] + 0.7152 * imageData.data[offset + 1] + 0.0722 * imageData.data[offset + 2];
    const contraste = luminosite > 150 ? 255 : 0;
    imageData.data[offset] = contraste;
    imageData.data[offset + 1] = contraste;
    imageData.data[offset + 2] = contraste;
  }

  context.putImageData(imageData, 0, 0);
  console.log(`[OCR HIGHLIGHT] Bande de ligne recadrée : ${canvas.width}x${canvas.height} (x2)`);
  return canvas.toDataURL("image/png");
}

function extraireLigneSelectionnee(texte: string): string | null {
  const reference = texte.match(/\b\d{8}\b/)?.[0];
  if (!reference) return null;

  const quantite = texte.match(/\b\d+[.,]00\b/)?.[0] ?? "";
  let designation = texte
    .replace(reference, "")
    .replace(quantite, "")
    .replace(/[^A-Za-zÀ-ÿ0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (designation.length < 3) designation = "-";
  return `${reference} ${designation}${quantite ? ` ${quantite}` : ""}`;
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
  const resultatLocal = await Tesseract.recognize(recadrerBande(source, bande), "eng", {
    logger: () => {},
  });
  const texteLocal = resultatLocal.data.text;
  console.log("[OCR HIGHLIGHT] Texte reconnu :", texteLocal);
  console.log(`[OCR HIGHLIGHT] OCR local : ${(performance.now() - debutLocal).toFixed(1)} ms`);

  const ligne = extraireLigneSelectionnee(texteLocal);
  if (ligne) {
    const reference = ligne.match(/\b\d{8}\b/)![0];
    console.log(`[OCR HIGHLIGHT] Référence extraite : ${reference}`);
    if (!new RegExp(`\\b${reference}\\b`).test(texte)) {
      texte += `\n${ligne}`;
      console.log("[OCR HIGHLIGHT] Ligne fusionnée au résultat principal");
    }
  }

  console.log(`[OCR HIGHLIGHT] Total : ${(performance.now() - debutTotal).toFixed(1)} ms`);
  return texte;
}
