import { supabase } from "./supabaseClient";

const DOCUMENTS_BUCKET = "documents";

/**
 * Obtiene la ruta del objeto dentro del bucket `documents` desde:
 * - URL pública de Supabase Storage, o
 * - Ruta relativa guardada en BD (ej. players/cedulas/archivo.jpg)
 */
export function extractDocumentsStoragePath(storedValue: string): string | null {
  const trimmed = storedValue.trim();
  if (!trimmed) return null;

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed.replace(/^\/+/, "");
  }

  const publicMarker = `/storage/v1/object/public/${DOCUMENTS_BUCKET}/`;
  let idx = trimmed.indexOf(publicMarker);
  if (idx !== -1) {
    let path = trimmed.slice(idx + publicMarker.length);
    const q = path.indexOf("?");
    if (q !== -1) path = path.slice(0, q);
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  }

  const shortMarker = `/object/public/${DOCUMENTS_BUCKET}/`;
  idx = trimmed.indexOf(shortMarker);
  if (idx !== -1) {
    let path = trimmed.slice(idx + shortMarker.length);
    const q = path.indexOf("?");
    if (q !== -1) path = path.slice(0, q);
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  }

  return null;
}

/**
 * URL lista para mostrar en un <img> (firma temporal si el bucket es privado).
 */
export async function getCedulaPhotoDisplayUrl(storedUrl: string): Promise<string> {
  const path = extractDocumentsStoragePath(storedUrl);

  if (path) {
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(path, 60 * 60);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
    console.warn("getCedulaPhotoDisplayUrl: createSignedUrl falló, se usa URL guardada", error);
  }

  return storedUrl;
}

/**
 * Abre la foto de cédula en una pestaña nueva (por si se usa en otro flujo).
 */
export async function openCedulaPhotoInNewTab(storedUrl: string): Promise<void> {
  const url = await getCedulaPhotoDisplayUrl(storedUrl);
  window.open(url, "_blank", "noopener,noreferrer");
}
