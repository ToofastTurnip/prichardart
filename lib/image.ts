// Resizes an uploaded photo in the browser so only web-sized WebP files reach the repo.

export interface PreparedImage {
  /** "webp", or "jpg" in browsers that cannot encode WebP. */
  ext: "webp" | "jpg";
  full: Blob;
  thumb: Blob;
  width: number;
  height: number;
}

async function render(bitmap: ImageBitmap, maxW: number, maxH: number, quality: number) {
  const scale = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  const encode = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
  let blob = await encode("image/webp");
  // Some Safari versions silently fall back to PNG; JPEG is much smaller for paintings.
  if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg");
  if (!blob) throw new Error("This browser could not convert the image. Try a recent Chrome, Edge, Firefox or Safari.");
  return { blob, w, h };
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const full = await render(bitmap, 2000, 2000, 0.84);
    const thumb = await render(bitmap, 800, 4000, 0.78);
    const ext = full.blob.type === "image/webp" ? "webp" : "jpg";
    return { ext, full: full.blob, thumb: thumb.blob, width: full.w, height: full.h };
  } finally {
    bitmap.close();
  }
}

export async function blobToBase64(blob: Blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i += 0x8000) {
    binary += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
