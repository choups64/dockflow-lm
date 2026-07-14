import sharp from "sharp";
import fs from "fs";

export interface CropResult {
  references: Buffer;
  designations: Buffer;
  quantites: Buffer;
}

export async function cropBacko(image: Buffer): Promise<CropResult> {
  const metadata = await sharp(image).metadata();

  const width = metadata.width!;
  const height = metadata.height!;

  //
  // Les coordonnées sont exprimées en pourcentage
  // de la fenêtre BACKO.
  //

  const tableTop = Math.round(height * 0.405);
  const tableHeight = Math.round(height * 0.39);

  // =========================
  // Références LM
  // =========================

  const references = await sharp(image)
    .extract({
      left: Math.round(width * 0.03),
      top: tableTop,
      width: Math.round(width * 0.11),
      height: tableHeight,
    })
    .png()
    .toBuffer();

  // =========================
  // Désignations
  // =========================

  const designations = await sharp(image)
    .extract({
      left: Math.round(width * 0.145),
      top: tableTop,
      width: Math.round(width * 0.34),
      height: tableHeight,
    })
    .png()
    .toBuffer();

  // =========================
  // Quantités
  // =========================

  const quantites = await sharp(image)
    .extract({
      left: Math.round(width * 0.455),
      top: tableTop,
      width: Math.round(width * 0.08),
      height: tableHeight,
    })
    .png()
    .toBuffer();

  // =========================
  // Sauvegarde des découpes
  // =========================

  fs.writeFileSync("references.png", references);
  fs.writeFileSync("designations.png", designations);
  fs.writeFileSync("quantites.png", quantites);

  return {
    references,
    designations,
    quantites,
  };
}