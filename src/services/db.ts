/**
 * HospitalFlow IndexedDB Photo Storage Service
 * 
 * Boundary & Security Guidelines:
 * - Stores photo blobs purely client-side in IndexedDB (hospitalflow_db / photos store).
 * - Never stores image binaries or Base64 data URLs in localStorage.
 * - Idempotent deletion: safely succeeds whether record exists or was already removed.
 * - Errors are reported visibly to the caller.
 * - Image URLs and raw photo bytes are NEVER exposed to logs or audit records.
 */

const DB_NAME = 'hospitalflow_db';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

export interface PhotoRecord {
  caseId: string;
  blob: Blob;
  mimeType: string;
  uploadedAt: string;
  expiresAt: string;
  status: 'pending' | 'approved';
  sizeBytes: number;
}

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 Megabytes limit

class PhotoStorageDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
          reject(new Error('IndexedDB is not supported in this environment.'));
          return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'caseId' });
            store.createIndex('expiresAt', 'expiresAt', { unique: false });
            store.createIndex('status', 'status', { unique: false });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error || new Error('Failed to open IndexedDB'));
        };

        request.onblocked = () => {
          console.warn('[HospitalFlow IDB] Database open blocked by another tab.');
        };
      });
    }
    return this.dbPromise;
  }

  /**
   * Validate image file size and MIME type
   */
  public validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type (${file.type || 'unknown'}). Only JPEG, PNG, and WebP images are permitted for operational bed verification.`
      };
    }

    if (file.size > MAX_PHOTO_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File size (${sizeMB} MB) exceeds maximum allowed limit of 10 MB.`
      };
    }

    return { valid: true };
  }

  /**
   * Store or overwrite photo blob for a case
   */
  public async savePhoto(
    caseId: string,
    blob: Blob,
    mimeType: string,
    expiresAt: string,
    status: 'pending' | 'approved'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const db = await this.getDB();
      const record: PhotoRecord = {
        caseId,
        blob,
        mimeType,
        uploadedAt: new Date().toISOString(),
        expiresAt,
        status,
        sizeBytes: blob.size,
      };

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);

        req.onsuccess = () => resolve({ success: true });
        req.onerror = () => {
          resolve({
            success: false,
            error: req.error ? req.error.message : 'Failed to write photo to IndexedDB'
          });
        };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown storage error';
      return { success: false, error: msg };
    }
  }

  /**
   * Update expiry timestamp & status on approval (e.g. set to 48 hours from approval)
   */
  public async updateExpiryAndStatus(
    caseId: string,
    expiresAt: string,
    status: 'approved'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(caseId);

        getReq.onsuccess = () => {
          const record = getReq.result as PhotoRecord | undefined;
          if (!record) {
            // Photo already deleted or doesn't exist
            resolve({ success: true });
            return;
          }
          record.expiresAt = expiresAt;
          record.status = status;
          const putReq = store.put(record);
          putReq.onsuccess = () => resolve({ success: true });
          putReq.onerror = () => resolve({
            success: false,
            error: putReq.error ? putReq.error.message : 'Failed to update photo retention'
          });
        };

        getReq.onerror = () => {
          resolve({
            success: false,
            error: getReq.error ? getReq.error.message : 'Failed to retrieve photo record'
          });
        };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update retention';
      return { success: false, error: msg };
    }
  }

  /**
   * Retrieve photo record (blob and metadata).
   * Caller is responsible for creating and revoking ObjectURL.
   */
  public async getPhoto(caseId: string): Promise<PhotoRecord | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(caseId);

        req.onsuccess = () => {
          resolve(req.result || null);
        };
        req.onerror = () => {
          reject(req.error || new Error(`Error fetching photo for case ${caseId}`));
        };
      });
    } catch {
      return null;
    }
  }

  /**
   * Check whether a photo exists in storage without loading the blob into memory
   */
  public async hasPhoto(caseId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.count(IDBKeyRange.only(caseId));
        req.onsuccess = () => resolve(req.result > 0);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  /**
   * Idempotently delete a photo for a given case.
   * Succeeds even if the photo was already deleted.
   */
  public async deletePhoto(caseId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(caseId);

        req.onsuccess = () => {
          resolve({ success: true });
        };
        req.onerror = () => {
          resolve({
            success: false,
            error: req.error ? req.error.message : 'Failed to delete photo from storage'
          });
        };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Storage deletion error';
      return { success: false, error: msg };
    }
  }

  /**
   * Inspect all records in the photos store and purge records whose expiresAt <= referenceTime
   */
  public async purgeExpiredPhotos(referenceTime: Date = new Date()): Promise<{
    purgedCaseIds: string[];
    errors: string[];
  }> {
    const purgedCaseIds: string[] = [];
    const errors: string[] = [];

    try {
      const db = await this.getDB();
      const recordsToPurge = await new Promise<string[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.openCursor();
        const dueIds: string[] = [];

        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const val = cursor.value as PhotoRecord;
            const expiryTime = new Date(val.expiresAt).getTime();
            if (!isNaN(expiryTime) && expiryTime <= referenceTime.getTime()) {
              dueIds.push(val.caseId);
            }
            cursor.continue();
          } else {
            resolve(dueIds);
          }
        };

        req.onerror = () => reject(req.error || new Error('Cursor scan failed'));
      });

      for (const caseId of recordsToPurge) {
        const delRes = await this.deletePhoto(caseId);
        if (delRes.success) {
          purgedCaseIds.push(caseId);
        } else {
          errors.push(`Case ${caseId}: ${delRes.error || 'Unknown deletion failure'}`);
        }
      }
    } catch (err: unknown) {
      errors.push(err instanceof Error ? err.message : 'IndexedDB purge scan failure');
    }

    return { purgedCaseIds, errors };
  }

  /**
   * Storage summary diagnostic for demo inspection
   */
  public async getStorageSummary(): Promise<{
    totalPhotos: number;
    totalSizeBytes: number;
    pendingCount: number;
    approvedCount: number;
  }> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.openCursor();
        let totalPhotos = 0;
        let totalSizeBytes = 0;
        let pendingCount = 0;
        let approvedCount = 0;

        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const val = cursor.value as PhotoRecord;
            totalPhotos++;
            totalSizeBytes += val.sizeBytes || 0;
            if (val.status === 'pending') pendingCount++;
            if (val.status === 'approved') approvedCount++;
            cursor.continue();
          } else {
            resolve({ totalPhotos, totalSizeBytes, pendingCount, approvedCount });
          }
        };

        req.onerror = () => {
          resolve({ totalPhotos: 0, totalSizeBytes: 0, pendingCount: 0, approvedCount: 0 });
        };
      });
    } catch {
      return { totalPhotos: 0, totalSizeBytes: 0, pendingCount: 0, approvedCount: 0 };
    }
  }

  /**
   * Demo utility: clear all photos
   */
  public async clearAllPhotos(): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignored in clear
    }
  }
}

export const photoStorage = new PhotoStorageDB();

