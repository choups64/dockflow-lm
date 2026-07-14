import { preprocessImage } from "./preprocess";
import { runOCR, runReferenceOCR } from "./ocrEngine";
import { mergeOCRResults } from "./merge";
import { parseBacko } from "./parser";

export async function analyseBacko(buffer: Buffer) {
  console.clear();

  console.log("========== PREPROCESS ==========");

  const images = await preprocessImage(buffer);

  console.log("OCR Original...");
  const original = await runOCR(images.original);

  console.log("OCR Grayscale...");
  const grayscale = await runOCR(images.grayscale);

  console.log("OCR Contrast...");
  const contrast = await runOCR(images.contrast);

  console.log("OCR Binary...");
  const binary = await runOCR(images.binary);

  console.log("OCR Références...");
  const references = await runReferenceOCR(images.contrast);

  console.log("========== OCR REFERENCES ==========");
  console.log(references);

  console.log("========== MERGE ==========");

  const texte = mergeOCRResults([
    original,
    grayscale,
    contrast,
    binary,
    references,
  ]);

  console.log(texte);

  console.log("========== PARSER ==========");

  const resultat = parseBacko(texte);

  console.table(resultat.lignes);

  return resultat;
}