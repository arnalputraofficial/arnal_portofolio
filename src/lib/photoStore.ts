/**
 * Storage for the profile photo slot on the home page.
 *
 * This site is a static build with no server behind it, so the file never
 * leaves the browser. IndexedDB is used rather than localStorage for two
 * reasons: localStorage only stores strings, so the image would have to be
 * base64 encoded (about a third larger), and its usual quota cannot hold a
 * file of the size this slot accepts. IndexedDB keeps the Blob as it is.
 */

const DB_NAME = "arnal-portfolio";
const DB_VERSION = 1;
const STORE_NAME = "media";
const PHOTO_KEY = "profile-photo";

export type StoredPhoto = {
  blob: Blob;
  fileName: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  savedAt: string;
};

/** Some browsers refuse IndexedDB outright, for example in strict private mode. */
export function hasPhotoStorage() {
  return typeof indexedDB !== "undefined";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("The browser refused to open IndexedDB."));
    request.onblocked = () => reject(new Error("IndexedDB is blocked by another open tab."));
  });
}

export async function loadStoredPhoto(): Promise<StoredPhoto | null> {
  if (!hasPhotoStorage()) return null;
  const db = await openDatabase();
  try {
    return await new Promise<StoredPhoto | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(PHOTO_KEY);
      request.onsuccess = () => resolve((request.result as StoredPhoto | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error("The saved photo could not be read."));
    });
  } finally {
    db.close();
  }
}

export async function saveStoredPhoto(photo: StoredPhoto): Promise<void> {
  if (!hasPhotoStorage()) {
    throw new Error("This browser does not provide IndexedDB, so the photo cannot be kept.");
  }
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(photo, PHOTO_KEY);
      // Resolve on commit, not on the request, so a failed write is reported.
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("The photo could not be written to storage."));
      tx.onabort = () =>
        reject(tx.error ?? new Error("The write was aborted, most likely because the storage quota is full."));
    });
  } finally {
    db.close();
  }
}

export async function deleteStoredPhoto(): Promise<void> {
  if (!hasPhotoStorage()) return;
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(PHOTO_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("The photo could not be removed from storage."));
      tx.onabort = () => reject(tx.error ?? new Error("The removal was aborted."));
    });
  } finally {
    db.close();
  }
}
