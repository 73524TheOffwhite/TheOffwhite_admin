import { supabase } from "@/lib/supabase";

export const MEDIA_BUCKET = "media";

export type OptimizedImageOptions = {
  width?: number;
  quality?: number;
};

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "image/avif") return "avif";
  return "jpg";
}

/** Public URL for a storage path (or passthrough for absolute/blob URLs). */
export function publicMediaUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return undefined;
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("blob:") ||
    pathOrUrl.startsWith("data:")
  ) {
    return pathOrUrl;
  }

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(pathOrUrl);
  return data.publicUrl;
}

/**
 * Delivery URL for stored media.
 * Uses the public object URL (CDN-cached, long cacheControl on upload).
 * Absolute/blob/data URLs are passed through unchanged.
 */
export function optimizedMediaUrl(pathOrUrl?: string | null, _opts: OptimizedImageOptions = {}) {
  return publicMediaUrl(pathOrUrl);
}

export async function uploadMediaFile(file: File, folder = "homepage") {
  const ext = extensionFor(file);
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || `image/${ext}`,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message || "Image upload failed");
  }

  return {
    path,
    publicUrl: publicMediaUrl(path)!,
    previewUrl: optimizedMediaUrl(path, { width: 480, quality: 70 })!,
  };
}
