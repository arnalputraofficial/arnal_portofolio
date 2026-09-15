/**
 * Validation rules for the profile photo slot.
 *
 * Two gates, in order. The first reads the metadata the browser already has
 * on the File object: MIME type, extension, and byte size. The second decodes
 * the file as an image, because an extension can be renamed and only a real
 * decode proves the bytes are a picture the browser can paint.
 */

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTO_MB = 5;

export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPTED_PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

const TYPE_LABELS: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

/** Value for the accept attribute on the file input. */
export const PHOTO_ACCEPT_ATTRIBUTE = [
  ...ACCEPTED_PHOTO_TYPES,
  ...ACCEPTED_PHOTO_EXTENSIONS,
].join(",");

export type PhotoProblem = {
  /** Short, specific headline. */
  title: string;
  /** What the user can do about it. */
  detail: string;
};

/** "JPG, PNG, WebP", built from the list so the copy cannot drift from the rule. */
export function acceptedTypeLabel() {
  return ACCEPTED_PHOTO_TYPES.map((type) => TYPE_LABELS[type]).join(", ");
}

/** Human readable size, in the unit that keeps the number short. */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** First gate: type and size, before anything is read into memory. */
export function validatePhotoFile(file: File): PhotoProblem | null {
  const type = file.type.toLowerCase();
  const typeAccepted = ACCEPTED_PHOTO_TYPES.includes(type);
  const extensionAccepted = ACCEPTED_PHOTO_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );

  // Some systems hand over an empty MIME type, so a matching extension is
  // enough to reach the decode gate. A wrong MIME type is never enough.
  if (!typeAccepted && !(type === "" && extensionAccepted)) {
    const detected = type || "an unknown type";
    return {
      title: `${file.name} is not a photo this slot accepts`,
      detail: `The browser reports it as ${detected}. Only ${acceptedTypeLabel()} files go in, so documents, archives, and video are refused even when the extension was renamed.`,
    };
  }

  if (file.size === 0) {
    return {
      title: `${file.name} is empty`,
      detail: "The file holds 0 bytes, so there is nothing to show. Export the photo again from the source.",
    };
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return {
      title: `${file.name} is over the size limit`,
      detail: `The file is ${formatBytes(file.size)} and the limit is ${MAX_PHOTO_MB} MB. Resize it, or export it again at a lower quality.`,
    };
  }

  return null;
}

/** Second gate: the bytes have to decode as a picture. */
export function readPhotoSize(
  objectUrl: string,
): Promise<{ width: number; height: number } | PhotoProblem> {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () =>
      resolve({
        title: "The file could not be decoded as an image",
        detail: `Its name or type says ${acceptedTypeLabel()}, but the content does not match. The file is damaged, or it is another format under a renamed extension.`,
      });

    image.src = objectUrl;
  });
}
