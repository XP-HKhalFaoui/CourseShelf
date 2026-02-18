import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';

export interface ManifestResult {
  launchFile: string;
  scormVersion: string;
  title: string;
}

/**
 * Attempt to parse imsmanifest.xml from the given directory.
 * Returns null if the manifest file does not exist.
 */
function tryParseManifest(dir: string): ManifestResult | null {
  const manifestPath = path.join(dir, 'imsmanifest.xml');
  if (!fs.existsSync(manifestPath)) return null;

  const xml = fs.readFileSync(manifestPath, 'utf-8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => ['item', 'resource', 'organization'].includes(name),
  });
  const doc = parser.parse(xml);

  // --- Extract SCORM version ---
  let scormVersion = 'unknown';
  const meta = doc?.manifest?.metadata;
  if (meta) {
    const schemaVersion =
      meta?.schemaversion ||
      meta?.['adlcp:schemaversion'] ||
      meta?.['schemaVersion'] ||
      '';
    const sv = String(schemaVersion).trim().toLowerCase();
    if (sv.includes('2004')) scormVersion = '2004';
    else if (sv.includes('1.2') || sv === 'cam 1.3' || sv.includes('1.3'))
      scormVersion = '1.2';
    else if (sv) scormVersion = sv;
  }

  // --- Extract title ---
  let title = 'Untitled Course';
  const orgs = doc?.manifest?.organizations;
  if (orgs) {
    const orgList = orgs?.organization;
    if (Array.isArray(orgList) && orgList.length > 0) {
      title = orgList[0]?.title || title;
    }
  }

  // --- Resolve launch file via organizations > item > identifierref > resource href ---
  let launchFile: string | null = null;

  const resources = doc?.manifest?.resources?.resource;
  const orgArray = orgs?.organization;

  if (Array.isArray(orgArray) && orgArray.length > 0) {
    const items = orgArray[0]?.item;
    if (Array.isArray(items) && items.length > 0) {
      const identifierref = items[0]?.['@_identifierref'];
      if (identifierref && Array.isArray(resources)) {
        const match = resources.find(
          (r: any) => r['@_identifier'] === identifierref
        );
        if (match?.['@_href']) {
          launchFile = match['@_href'];
        }
      }
    }
  }

  // Fallback: use first resource href if no item-based match
  if (!launchFile && Array.isArray(resources) && resources.length > 0) {
    launchFile = resources[0]?.['@_href'] || null;
  }

  if (!launchFile) return null;

  return { launchFile, scormVersion, title };
}

/**
 * Find any .html file in the given directory (non-recursive).
 */
function findFirstHtml(dir: string): string | null {
  const entries = fs.readdirSync(dir);
  // Prefer index.html
  if (entries.includes('index.html')) return 'index.html';
  const html = entries.find((e) => e.endsWith('.html') || e.endsWith('.htm'));
  return html || null;
}

/**
 * Detect the launch file from an extracted SCORM package.
 *
 * Detection priority:
 * 1. imsmanifest.xml in root
 * 2. imsmanifest.xml one level down (wrapper folder)
 * 3. index.html in root
 * 4. First .html file in root
 * 5. Throw error
 */
export function parseManifest(extractedDir: string): ManifestResult {
  // 1. Try root manifest
  const rootResult = tryParseManifest(extractedDir);
  if (rootResult) return rootResult;

  // 2. Try one level down (wrapper folder)
  const entries = fs.readdirSync(extractedDir, { withFileTypes: true });
  const subDirs = entries.filter((e) => e.isDirectory());
  for (const sub of subDirs) {
    const subPath = path.join(extractedDir, sub.name);
    const subResult = tryParseManifest(subPath);
    if (subResult) {
      // Prefix launch file with the wrapper folder name
      subResult.launchFile = path.join(sub.name, subResult.launchFile);
      return subResult;
    }
  }

  // 3. Fallback to index.html or first .html in root
  const htmlFile = findFirstHtml(extractedDir);
  if (htmlFile) {
    return {
      launchFile: htmlFile,
      scormVersion: 'unknown',
      title: path.basename(extractedDir),
    };
  }

  // 4. Check one level down for HTML
  for (const sub of subDirs) {
    const subPath = path.join(extractedDir, sub.name);
    const subHtml = findFirstHtml(subPath);
    if (subHtml) {
      return {
        launchFile: path.join(sub.name, subHtml),
        scormVersion: 'unknown',
        title: sub.name,
      };
    }
  }

  throw new Error(
    'Could not detect a launch file. The ZIP does not appear to contain a valid SCORM package or HTML content.'
  );
}
