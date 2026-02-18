import AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';

/** Directory where all extracted courses are cached */
function getCacheDir(): string {
  const cacheDir = path.join(app.getPath('home'), '.courseshelf', 'cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

/**
 * Extract a ZIP file into a unique subdirectory under the cache.
 * Returns the absolute path to the extraction folder.
 */
export function extractZip(zipPath: string): string {
  const id = uuidv4();
  const destDir = path.join(getCacheDir(), id);
  fs.mkdirSync(destDir, { recursive: true });

  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destDir, true);

  return destDir;
}

/**
 * Remove an extracted course folder from cache.
 */
export function removeCacheFolder(cachePath: string): void {
  if (fs.existsSync(cachePath)) {
    fs.rmSync(cachePath, { recursive: true, force: true });
  }
}
