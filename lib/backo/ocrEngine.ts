import Tesseract from "tesseract.js";

const logger = (m: any) => {
  if (m.status === "recognizing text") {
    console.log(`OCR : ${Math.round(m.progress * 100)}%`);
  }
};

export async function runOCR(buffer: Buffer): Promise<string> {
  const result = await Tesseract.recognize(
    buffer,
    "fra+eng",
    {
      logger,
    }
  );

  return result.data.text;
}

export async function runReferenceOCR(
  buffer: Buffer
): Promise<string> {

  const result = await Tesseract.recognize(
    buffer,
    "eng",
    {
      logger,
    }
  );

  return result.data.text;
}