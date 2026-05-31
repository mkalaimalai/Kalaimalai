/**
 * Client-side image downscaling for avatar photos. The center-crop math is a
 * pure function so it can be unit-tested; the canvas/File work is a thin async
 * wrapper around it (untestable in jsdom, kept minimal).
 */

export interface CoverCrop {
  sx: number;
  sy: number;
  size: number;
}

/** Center-crop a `w`×`h` image to the largest centered square. */
export function computeCoverCrop(w: number, h: number): CoverCrop {
  const size = Math.min(w, h);
  return { sx: (w - size) / 2, sy: (h - size) / 2, size };
}

const OUTPUT = 256;

/**
 * Read an image File and return a 256×256 center-cropped JPEG data URL.
 * Rejects if the file is not a decodable image.
 */
export function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const { sx, sy, size } = computeCoverCrop(
          img.naturalWidth,
          img.naturalHeight,
        );
        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT;
        canvas.height = OUTPUT;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context unavailable.");
        ctx.drawImage(img, sx, sy, size, size, 0, 0, OUTPUT, OUTPUT);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}
