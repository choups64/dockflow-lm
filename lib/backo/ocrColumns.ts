import Tesseract from "tesseract.js";

export async function readColumn(image: Buffer) {
  const result = await Tesseract.recognize(image, "eng", {
    logger: () => {},
  });

  return result.data.text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}