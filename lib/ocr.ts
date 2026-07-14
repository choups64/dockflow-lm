import Tesseract from "tesseract.js";

export async function readImage(image: string): Promise<string> {
  const {
    data: { text },
  } = await Tesseract.recognize(image, "fra+eng", {
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