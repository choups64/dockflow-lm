import Tesseract from "tesseract.js";

async function uniformiserSurbrillanceBacko(image: string): Promise<string> {
  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Impossible de charger l'image pour l'OCR"));
    element.src = image;
  });

  const canvas = document.createElement("canvas");
  canvas.width = source.naturalWidth;
  canvas.height = source.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return image;
  }

  context.drawImage(source, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  const gris = new Uint8ClampedArray(canvas.width * canvas.height);

  for (let pixel = 0; pixel < gris.length; pixel += 1) {
    const offset = pixel * 4;
    const luminance = 0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2];
    gris[pixel] = Math.max(0, Math.min(255, (luminance - 128) * 1.12 + 128));
  }

  const rayon = 4;
  const largeur = canvas.width;
  const hauteur = canvas.height;

  for (let y = 0; y < hauteur; y += 1) {
    for (let x = 0; x < largeur; x += 1) {
      const pixel = y * largeur + x;
      const luminance = gris[pixel];
      const voisins = [
        gris[Math.max(0, y - rayon) * largeur + x],
        gris[Math.min(hauteur - 1, y + rayon) * largeur + x],
        gris[y * largeur + Math.max(0, x - rayon)],
        gris[y * largeur + Math.min(largeur - 1, x + rayon)],
      ];
      const environnementClair = voisins.reduce((somme, valeur) => somme + valeur, 0) / voisins.length > 190;
      const valeur = environnementClair ? (luminance < 135 ? 255 : 0) : luminance;
      const offset = pixel * 4;
      data[offset] = valeur;
      data[offset + 1] = valeur;
      data[offset + 2] = valeur;
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export async function readImage(image: string): Promise<string> {
  const imageUniformisee = await uniformiserSurbrillanceBacko(image);

  const {
    data: { text },
  } = await Tesseract.recognize(imageUniformisee, "fra+eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        console.log(
          `OCR : ${Math.round(m.progress * 100)}%`
        );
      }
    },
  });

  return text;
}
