import Tesseract from "tesseract.js";

type RectangleBlanc = {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
  pixels: number;
};

type LigneSelectionnee = {
  reference: RectangleBlanc;
  designation: RectangleBlanc;
  quantite: RectangleBlanc;
  rowTop: number;
  rowBottom: number;
};

async function chargerImage(image: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Impossible de charger l'image pour l'OCR"));
    element.src = image;
  });
}

function chevauchementVertical(a: RectangleBlanc, b: RectangleBlanc): number {
  const haut = Math.max(a.y, b.y);
  const bas = Math.min(a.y + a.hauteur, b.y + b.hauteur);
  return Math.max(0, bas - haut) / Math.min(a.hauteur, b.hauteur);
}

function trouverCellule(
  rectangles: RectangleBlanc[],
  largeurImage: number,
  debutRatio: number,
  finRatio: number
): RectangleBlanc | null {
  return rectangles.find((rectangle) => {
    const centre = (rectangle.x + rectangle.largeur / 2) / largeurImage;
    return centre >= debutRatio && centre <= finRatio;
  }) ?? null;
}

function detecterLigneSelectionnee(source: HTMLImageElement): LigneSelectionnee | null {
  const canvas = document.createElement("canvas");
  canvas.width = source.naturalWidth;
  canvas.height = source.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(source, 0, 0);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const largeur = canvas.width;
  const hauteur = canvas.height;
  const debutX = Math.floor(largeur * 0.02);
  const finX = Math.floor(largeur * 0.98);
  const debutY = Math.floor(hauteur * 0.3);
  const finY = Math.floor(hauteur * 0.82);
  const visites = new Uint8Array(largeur * hauteur);
  const rectangles: RectangleBlanc[] = [];

  const estBlanc = (position: number) => {
    const offset = position * 4;
    return data[offset] > 240 && data[offset + 1] > 240 && data[offset + 2] > 240;
  };

  for (let y = debutY; y < finY; y += 1) {
    for (let x = debutX; x < finX; x += 1) {
      const depart = y * largeur + x;
      if (visites[depart] || !estBlanc(depart)) continue;

      const pile = [depart];
      visites[depart] = 1;
      let pixels = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;

      for (let index = 0; index < pile.length; index += 1) {
        const position = pile[index];
        const positionX = position % largeur;
        const positionY = (position - positionX) / largeur;
        pixels += 1;
        minX = Math.min(minX, positionX);
        maxX = Math.max(maxX, positionX);
        minY = Math.min(minY, positionY);
        maxY = Math.max(maxY, positionY);

        const voisins = [
          positionX > debutX ? position - 1 : -1,
          positionX + 1 < finX ? position + 1 : -1,
          positionY > debutY ? position - largeur : -1,
          positionY + 1 < finY ? position + largeur : -1,
        ];

        for (const voisin of voisins) {
          if (voisin >= 0 && !visites[voisin] && estBlanc(voisin)) {
            visites[voisin] = 1;
            pile.push(voisin);
          }
        }
      }

      const rectangle = {
        x: minX,
        y: minY,
        largeur: maxX - minX + 1,
        hauteur: maxY - minY + 1,
        pixels,
      };

      if (rectangle.largeur >= 40 && rectangle.hauteur >= 18 && rectangle.hauteur <= 60 && rectangle.pixels >= 800) {
        rectangles.push(rectangle);
      }
    }
  }

  console.log("[OCR HIGHLIGHT] Rectangles blancs détectés :", rectangles);
  const groupes: RectangleBlanc[][] = [];

  for (const rectangle of rectangles.sort((a, b) => a.y - b.y || a.x - b.x)) {
    const groupe = groupes.find((candidats) => chevauchementVertical(rectangle, candidats[0]) >= 0.8);
    if (groupe) {
      groupe.push(rectangle);
    } else {
      groupes.push([rectangle]);
    }
  }

  const cellules = groupes
    .filter((groupe) => groupe.length >= 3)
    .sort((a, b) => b.length - a.length)[0];
  if (!cellules) return null;

  const referenceBlanche = trouverCellule(cellules, largeur, 0.03, 0.15);
  const designation = trouverCellule(cellules, largeur, 0.15, 0.4);
  const quantite = trouverCellule(cellules, largeur, 0.43, 0.57);
  if (!referenceBlanche || !designation || !quantite) return null;

  // BACKO colore la première position de la cellule active en vert. Elle doit
  // être rattachée à la cellule blanche pour ne pas perdre le premier chiffre.
  let debutReference = referenceBlanche.x;
  for (let y = referenceBlanche.y; y < referenceBlanche.y + referenceBlanche.hauteur; y += 1) {
    for (let x = Math.floor(largeur * 0.03); x < referenceBlanche.x; x += 1) {
      const offset = (y * largeur + x) * 4;
      const rouge = data[offset];
      const vert = data[offset + 1];
      const bleu = data[offset + 2];
      if (vert > 130 && vert > rouge * 1.4 && vert > bleu * 1.4) {
        debutReference = Math.min(debutReference, x);
      }
    }
  }
  const reference = {
    ...referenceBlanche,
    x: debutReference,
    largeur: referenceBlanche.x + referenceBlanche.largeur - debutReference,
  };

  const rowTop = Math.max(0, Math.min(...cellules.map((cellule) => cellule.y)) - 2);
  const rowBottom = Math.min(hauteur, Math.max(...cellules.map((cellule) => cellule.y + cellule.hauteur)) + 2);
  console.log(`[OCR HIGHLIGHT] Ligne retenue : top=${rowTop} bottom=${rowBottom}`);
  console.log(`[OCR HIGHLIGHT] Cellule référence : x=${reference.x} y=${reference.y} w=${reference.largeur} h=${reference.hauteur}`);
  console.log(`[OCR HIGHLIGHT] Cellule désignation : x=${designation.x} y=${designation.y} w=${designation.largeur} h=${designation.hauteur}`);
  console.log(`[OCR HIGHLIGHT] Cellule quantité : x=${quantite.x} y=${quantite.y} w=${quantite.largeur} h=${quantite.hauteur}`);

  return { reference, designation, quantite, rowTop, rowBottom };
}

function dessinerCelluleNormalisee(
  destination: CanvasRenderingContext2D,
  source: HTMLImageElement,
  cellule: RectangleBlanc,
  destinationX: number,
  echelle: number
) {
  const marge = 2;
  const largeur = cellule.largeur - marge * 2;
  const hauteur = cellule.hauteur - marge * 2;
  const temporaire = document.createElement("canvas");
  temporaire.width = largeur;
  temporaire.height = hauteur;
  const contexteTemporaire = temporaire.getContext("2d", { willReadFrequently: true });
  if (!contexteTemporaire) throw new Error("Canvas indisponible pour le recadrage OCR");

  contexteTemporaire.drawImage(
    source,
    cellule.x + marge,
    cellule.y + marge,
    largeur,
    hauteur,
    0,
    0,
    largeur,
    hauteur
  );
  const imageData = contexteTemporaire.getImageData(0, 0, largeur, hauteur);
  for (let offset = 0; offset < imageData.data.length; offset += 4) {
    const luminosite = 0.2126 * imageData.data[offset] + 0.7152 * imageData.data[offset + 1] + 0.0722 * imageData.data[offset + 2];
    const valeur = luminosite > 150 ? 255 : 0;
    imageData.data[offset] = valeur;
    imageData.data[offset + 1] = valeur;
    imageData.data[offset + 2] = valeur;
  }
  contexteTemporaire.putImageData(imageData, 0, 0);
  destination.drawImage(temporaire, 0, 0, largeur, hauteur, destinationX, 0, largeur * echelle, hauteur * echelle);

  return largeur * echelle;
}

function creerCanvasLocal(source: HTMLImageElement, ligne: LigneSelectionnee): HTMLCanvasElement {
  const echelle = 2;
  const separateur = 16;
  const cellules = [ligne.reference, ligne.designation, ligne.quantite];
  const largeur = cellules.reduce((total, cellule) => total + (cellule.largeur - 4) * echelle, separateur * 2);
  const hauteur = Math.max(...cellules.map((cellule) => (cellule.hauteur - 4) * echelle));
  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = hauteur;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas indisponible pour le recadrage OCR");

  context.fillStyle = "white";
  context.fillRect(0, 0, largeur, hauteur);
  let x = 0;
  cellules.forEach((cellule, index) => {
    x += dessinerCelluleNormalisee(context, source, cellule, x, echelle);
    if (index < cellules.length - 1) {
      context.fillStyle = "black";
      context.fillRect(x + 6, 0, 3, hauteur);
      x += separateur;
    }
  });

  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined" && new URLSearchParams(window.location.search).has("ocrHighlightDebug")) {
    const lien = document.createElement("a");
    lien.href = canvas.toDataURL("image/png");
    lien.download = "dockflow-ocr-highlight.png";
    lien.click();
    console.log("[OCR HIGHLIGHT] Canvas diagnostic téléchargé");
  }

  return canvas;
}

function normaliserReference(texte: string): string | null {
  const candidat = texte.match(/(?:^|[^\d])(\d(?:[\s-]?\d){7})(?!\d)/)?.[1];
  const reference = candidat?.replace(/\D/g, "") ?? "";
  return /^\d{8}$/.test(reference) ? reference : null;
}

function normaliserQuantite(texte: string): number | null {
  const valeurs = texte.match(/\d+(?:[.,]\d+)?/g) ?? [];
  const valeur = valeurs
    .reverse()
    .map((candidat) => Number(candidat.replace(",", ".")))
    .find((candidat) => Number.isFinite(candidat) && candidat > 0 && candidat <= 9999);
  return valeur === undefined ? null : Math.round(valeur);
}

function normaliserDesignation(texte: string, reference: string, quantite: number): string {
  return texte
    .replace(reference, " ")
    .replace(/\bD[ÉE]SIGNATION\b/giu, " ")
    .replace(/[|]/g, " ")
    .replace(new RegExp(`\\b${quantite}(?:[.,]00)?\\b`, "g"), " ")
    .replace(/\b\d+(?:[.,]\d+)?\b/g, " ")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export async function readImage(image: string): Promise<string> {
  const debutTotal = performance.now();
  const source = await chargerImage(image);
  const debutDetection = performance.now();
  const ligneSelectionnee = detecterLigneSelectionnee(source);
  console.log(`[OCR HIGHLIGHT] Détection : ${(performance.now() - debutDetection).toFixed(1)} ms`);

  const debutPrincipal = performance.now();
  const resultatPrincipal = await Tesseract.recognize(image, "fra+eng", {
    logger: (m) => {
      if (m.status === "recognizing text") console.log(`OCR : ${Math.round(m.progress * 100)}%`);
    },
  });
  // Les bordures verticales de BACKO peuvent être reconnues comme "|/" juste
  // après une référence. Ce séparateur ne fait pas partie de la désignation.
  let texte = resultatPrincipal.data.text.replace(/(\b\d{8})\s*\|\/?\s*/g, "$1 ");
  console.log(`[OCR HIGHLIGHT] OCR principal : ${(performance.now() - debutPrincipal).toFixed(1)} ms`);

  if (!ligneSelectionnee) {
    console.log("[OCR HIGHLIGHT] Aucune ligne sélectionnée détectée");
    console.log(`[OCR HIGHLIGHT] Total : ${(performance.now() - debutTotal).toFixed(1)} ms`);
    return texte;
  }

  const debutLocal = performance.now();
  const canvasLocal = creerCanvasLocal(source, ligneSelectionnee);
  const resultatLocal = await Tesseract.recognize(canvasLocal, "eng", { logger: () => {} });
  const texteLocal = resultatLocal.data.text;
  console.log("[OCR HIGHLIGHT] Texte local brut :", texteLocal);
  console.log(`[OCR HIGHLIGHT] OCR local : ${(performance.now() - debutLocal).toFixed(1)} ms`);

  const reference = normaliserReference(texteLocal);
  const quantite = normaliserQuantite(texteLocal);
  const designation = reference && quantite ? normaliserDesignation(texteLocal, reference, quantite) : "";

  if (reference && designation && quantite) {
    const ligne = `${reference} ${designation} ${quantite}.00`;
    console.log(`[OCR HIGHLIGHT] Ligne normalisée : ${reference} | ${designation} | ${quantite}`);
    const lignes = texte.split("\n");
    const indexLigneExistante = lignes.findIndex((ligneExistante) => new RegExp(`\\b${reference}\\b`).test(ligneExistante));

    if (indexLigneExistante >= 0) {
      lignes[indexLigneExistante] = ligne;
      texte = lignes.join("\n");
    } else {
      texte += `\n${ligne}`;
    }
    console.log("[OCR HIGHLIGHT] Ligne fusionnée au résultat principal");
  }

  console.log(`[OCR HIGHLIGHT] Total : ${(performance.now() - debutTotal).toFixed(1)} ms`);
  return texte;
}
