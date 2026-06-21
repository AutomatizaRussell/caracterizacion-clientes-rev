import "server-only";

import { readFile } from "fs/promises";
import path from "path";

let cachedRbPageBackgroundDataUri: string | null = null;

/**
 * Lee la plantilla visual de página usada por la vista previa documental
 * y la convierte en un Data URI embebible dentro del HTML generado.
 *
 * Razón:
 * - El HTML se guarda en OneDrive.
 * - OneDrive no puede resolver rutas relativas como /rb-page-bg.png.
 * - Un Data URI hace que el HTML sea autocontenido y reproducible.
 */
export async function getRbPageBackgroundDataUri() {
  if (cachedRbPageBackgroundDataUri) {
    return cachedRbPageBackgroundDataUri;
  }

  const assetPath = path.join(process.cwd(), "public", "rb-page-bg.png");
  const fileBuffer = await readFile(assetPath);

  cachedRbPageBackgroundDataUri = `data:image/png;base64,${fileBuffer.toString(
    "base64",
  )}`;

  return cachedRbPageBackgroundDataUri;
}