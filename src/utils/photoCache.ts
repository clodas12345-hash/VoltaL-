/**
 * IndexedDB Persistent Photo Cache for VoltaLá
 * 
 * Provides a robust 2-level caching architecture (L1 In-Memory Map + L2 IndexedDB)
 * to store Google Places and Street View photos locally on the user's device.
 * 
 * Benefits:
 * - Drastically reduces data consumption on mobile networks
 * - Instant image rendering (0ms network delay from disk/memory)
 * - Prevents redundant Google Places API photo quota calls & costs
 * - Full offline / PWA support for previously loaded establishment photos
 */

import { useState, useEffect } from 'react';

const DB_NAME = 'voltala_places_photo_cache_v1';
const STORE_NAME = 'photos';
const DB_VERSION = 1;
const CACHE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days retention

// L1 In-Memory Cache for lightning-fast instant render during current session
const memoryCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string | null>>();

interface CachedRecord {
  key: string;
  dataUrl: string;
  originalUrl: string;
  timestamp: number;
  size?: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Auto cleanup expired records on startup
      cleanExpiredCache(db).catch(() => {});
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Automatically clean expired cache records older than 30 days
 */
async function cleanExpiredCache(db: IDBDatabase): Promise<void> {
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const cutoff = Date.now() - CACHE_EXPIRY_MS;
    const range = IDBKeyRange.upperBound(cutoff);

    const cursorRequest = index.openCursor(range);
    cursorRequest.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (err) {
    console.debug('Photo cache auto-cleanup notice:', err);
  }
}

/**
 * Convert an image URL to a compact Base64 Data URL using canvas or fetch
 */
async function fetchAndConvertToBase64(url: string): Promise<string> {
  // Method 1: Try fetch as Blob (Fastest & best quality preservation)
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert blob to data URL'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (corsErr) {
    // CORS restricted or blocked direct fetch - proceed to canvas fallback
  }

  // Method 2: HTML Image + Canvas with crossOrigin
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Limit max dimensions to 600x400 to save IndexedDB space while keeping high crispness
        const maxDim = 600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(url);
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      } catch (err) {
        // Tainted canvas or restriction, fallback to original URL
        resolve(url);
      }
    };

    img.onerror = () => {
      // In case of error loading the image, resolve with original url
      resolve(url);
    };

    img.src = url;
  });
}

/**
 * Retrieve a cached photo from L1 Memory or L2 IndexedDB
 */
export async function getCachedPhoto(urlOrKey: string): Promise<string | null> {
  if (!urlOrKey) return null;

  // 1. Check L1 Memory Cache
  if (memoryCache.has(urlOrKey)) {
    return memoryCache.get(urlOrKey)!;
  }

  // 2. Check L2 IndexedDB
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(urlOrKey);

      request.onsuccess = () => {
        const record = request.result as CachedRecord | undefined;
        if (record && record.dataUrl) {
          // Check if expired
          if (Date.now() - record.timestamp < CACHE_EXPIRY_MS) {
            memoryCache.set(urlOrKey, record.dataUrl);
            resolve(record.dataUrl);
            return;
          }
        }
        resolve(null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    return null;
  }
}

/**
 * Save a photo data URL to IndexedDB and memory
 */
export async function savePhotoToCache(urlOrKey: string, dataUrl: string, originalUrl: string): Promise<void> {
  if (!urlOrKey || !dataUrl) return;

  // Save to L1 Memory
  memoryCache.set(urlOrKey, dataUrl);

  // Save to L2 IndexedDB
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record: CachedRecord = {
      key: urlOrKey,
      dataUrl,
      originalUrl,
      timestamp: Date.now(),
      size: dataUrl.length
    };
    store.put(record);
  } catch (err) {
    console.debug('Failed to write photo to IndexedDB cache:', err);
  }
}

/**
 * Get or fetch and cache a place photo
 */
export async function getOrFetchCachedPhoto(url: string, customKey?: string): Promise<string> {
  if (!url) return '';
  const key = customKey || url;

  // Check if already in memory
  if (memoryCache.has(key)) {
    return memoryCache.get(key)!;
  }

  // Check if there is already a fetch in flight for this key to prevent duplicate requests
  if (inFlightRequests.has(key)) {
    const result = await inFlightRequests.get(key);
    if (result) return result;
  }

  // Fetch from IndexedDB
  const cached = await getCachedPhoto(key);
  if (cached) {
    return cached;
  }

  // If not cached, fetch and store
  const fetchPromise = (async () => {
    try {
      const base64Data = await fetchAndConvertToBase64(url);
      if (base64Data && base64Data.startsWith('data:image')) {
        await savePhotoToCache(key, base64Data, url);
        return base64Data;
      }
      // If conversion failed, cache the URL itself in memory
      memoryCache.set(key, url);
      return url;
    } catch (e) {
      return url;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, fetchPromise);
  return await fetchPromise;
}

/**
 * React Hook for seamless asynchronous photo caching with instant display
 */
export function useCachedPhoto(originalUrl?: string, customKey?: string): { src: string | undefined; isCached: boolean; isLoading: boolean } {
  const [src, setSrc] = useState<string | undefined>(() => {
    if (!originalUrl) return undefined;
    const key = customKey || originalUrl;
    return memoryCache.get(key) || originalUrl;
  });
  const [isCached, setIsCached] = useState<boolean>(() => {
    if (!originalUrl) return false;
    const key = customKey || originalUrl;
    return memoryCache.has(key);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!originalUrl) {
      setSrc(undefined);
      setIsCached(false);
      return;
    }

    const key = customKey || originalUrl;

    // Check memory first
    if (memoryCache.has(key)) {
      setSrc(memoryCache.get(key));
      setIsCached(true);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    getOrFetchCachedPhoto(originalUrl, key)
      .then((cachedSrc) => {
        if (isMounted) {
          setSrc(cachedSrc);
          setIsCached(cachedSrc.startsWith('data:image'));
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSrc(originalUrl);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [originalUrl, customKey]);

  return { src: src || originalUrl, isCached, isLoading };
}

/**
 * Get total cache metrics & storage statistics
 */
export async function getPhotoCacheStats(): Promise<{ count: number; estimatedSizeKb: number }> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const countReq = store.count();

      countReq.onsuccess = () => {
        const count = countReq.result || 0;
        let totalBytes = 0;
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const val = cursor.value as CachedRecord;
            totalBytes += val.dataUrl ? val.dataUrl.length : 0;
            cursor.continue();
          } else {
            resolve({
              count,
              estimatedSizeKb: Math.round(totalBytes / 1024)
            });
          }
        };
      };

      countReq.onerror = () => {
        resolve({ count: memoryCache.size, estimatedSizeKb: 0 });
      };
    });
  } catch (e) {
    return { count: memoryCache.size, estimatedSizeKb: 0 };
  }
}

/**
 * Clear the entire photo cache
 */
export async function clearPhotoCache(): Promise<void> {
  memoryCache.clear();
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch (err) {
    console.debug('Failed to clear photo cache:', err);
  }
}
