import sharp from "sharp";

export async function preprocessImage(buffer: Buffer) {
  const original = buffer;

  const grayscale = await sharp(buffer)
    .grayscale()
    .toBuffer();

  const contrast = await sharp(buffer)
    .grayscale()
    .normalize()
    .sharpen()
    .toBuffer();

  const binary = await sharp(buffer)
    .grayscale()
    .normalize()
    .threshold(160)
    .toBuffer();

  return {
    original,
    grayscale,
    contrast,
    binary,
  };
}