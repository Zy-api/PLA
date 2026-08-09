// File storage layer using IndexedDB. Stores file contents for repos/branches/snapshots.
// Key format: `${repoId}:${branchId}:${path}` for working files
//             `${repoId}:snapshot:${snapshotId}:${path}` for snapshot files

const DB_NAME = 'launchpad-file-store';
const STORE_NAME = 'files';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDel(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbKeys(prefix: string): Promise<string[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAllKeys();
    req.onsuccess = () => {
      const allKeys = req.result as string[];
      resolve(allKeys.filter((k) => k.startsWith(prefix)));
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbClearPrefix(prefix: string): Promise<void> {
  const keys = await idbKeys(prefix);
  await Promise.all(keys.map((k) => idbDel(k)));
}

export function fileKey(repoId: string, branchId: string, path: string): string {
  return `${repoId}:${branchId}:${path}`;
}

export function snapshotKey(repoId: string, snapshotId: string, path: string): string {
  return `${repoId}:snapshot:${snapshotId}:${path}`;
}

export function repoPrefix(repoId: string): string {
  return `${repoId}:`;
}

export async function readFile(repoId: string, branchId: string, path: string): Promise<string | null> {
  return idbGet(fileKey(repoId, branchId, path));
}

export async function writeFile(repoId: string, branchId: string, path: string, content: string): Promise<void> {
  await idbSet(fileKey(repoId, branchId, path), content);
}

export async function deleteFile(repoId: string, branchId: string, path: string): Promise<void> {
  await idbDel(fileKey(repoId, branchId, path));
}

export async function listFiles(repoId: string, branchId: string): Promise<string[]> {
  const prefix = `${repoId}:${branchId}:`;
  const keys = await idbKeys(prefix);
  return keys.map((k) => k.substring(prefix.length));
}

export async function copyBranchFiles(repoId: string, fromBranch: string, toBranch: string): Promise<void> {
  const files = await listFiles(repoId, fromBranch);
  await Promise.all(files.map(async (path) => {
    const content = await readFile(repoId, fromBranch, path);
    if (content !== null) await writeFile(repoId, toBranch, path, content);
  }));
}

export async function deleteBranchFiles(repoId: string, branchId: string): Promise<void> {
  await idbClearPrefix(`${repoId}:${branchId}:`);
}

export async function deleteRepoFiles(repoId: string): Promise<void> {
  await idbClearPrefix(`${repoId}:`);
}

export async function createSnapshotFiles(repoId: string, branchId: string, snapshotId: string): Promise<Record<string, string>> {
  const files = await listFiles(repoId, branchId);
  const fileMap: Record<string, string> = {};
  await Promise.all(files.map(async (path) => {
    const content = await readFile(repoId, branchId, path);
    if (content !== null) {
      fileMap[path] = content;
      await idbSet(snapshotKey(repoId, snapshotId, path), content);
    }
  }));
  return fileMap;
}

export async function restoreSnapshotFiles(repoId: string, branchId: string, snapshotId: string): Promise<void> {
  const prefix = `${repoId}:snapshot:${snapshotId}:`;
  const keys = await idbKeys(prefix);
  const paths = keys.map((k) => k.substring(prefix.length));
  await deleteBranchFiles(repoId, branchId);
  await Promise.all(paths.map(async (path) => {
    const content = await idbGet(snapshotKey(repoId, snapshotId, path));
    if (content !== null) await writeFile(repoId, branchId, path, content);
  }));
}

export async function mergeBranchFiles(repoId: string, sourceBranchId: string, targetBranchId: string): Promise<{ merged: number; conflicts: string[] }> {
  const sourceFiles = await listFiles(repoId, sourceBranchId);
  const targetFiles = await listFiles(repoId, targetBranchId);
  const targetSet = new Set(targetFiles);
  const conflicts: string[] = [];
  let merged = 0;
  for (const path of sourceFiles) {
    const sourceContent = await readFile(repoId, sourceBranchId, path);
    if (sourceContent === null) continue;
    if (targetSet.has(path)) {
      const targetContent = await readFile(repoId, targetBranchId, path);
      if (targetContent !== sourceContent) {
        conflicts.push(path);
        continue;
      }
    }
    await writeFile(repoId, targetBranchId, path, sourceContent);
    merged++;
  }
  return { merged, conflicts };
}

export async function getAllFilesForDeploy(repoId: string, branchId: string): Promise<Record<string, string>> {
  const files = await listFiles(repoId, branchId);
  const result: Record<string, string> = {};
  await Promise.all(files.map(async (path) => {
    const content = await readFile(repoId, branchId, path);
    if (content !== null) result[path] = content;
  }));
  return result;
}
