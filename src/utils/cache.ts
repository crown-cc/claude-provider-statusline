import fs from "node:fs/promises";
import path from "node:path";
import { getCachePath } from "../config";

export interface CacheEntry {
  text?: string;
  updatedAt?: number;
  consecutiveFailures?: number;
  retryAfter?: number;
  lastError?: string;
}

type CacheFile = Record<string, CacheEntry>;

async function readCache(): Promise<CacheFile> {
  try {
    return JSON.parse(await fs.readFile(getCachePath(), "utf8")) as CacheFile;
  } catch {
    return {};
  }
}

async function writeCache(cache: CacheFile): Promise<void> {
  const cachePath = getCachePath();
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  const temporary = `${cachePath}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(cache, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temporary, cachePath);
}

export async function getCacheEntry(key: string): Promise<CacheEntry | undefined> {
  return (await readCache())[key];
}

export async function getCached(
  key: string,
  maxAgeSeconds: number,
): Promise<string | undefined> {
  const entry = await getCacheEntry(key);
  if (!entry?.text || !entry.updatedAt) return undefined;
  if (Date.now() - entry.updatedAt > maxAgeSeconds * 1000) return undefined;
  return entry.text;
}

export async function getStaleCached(key: string): Promise<string | undefined> {
  return (await getCacheEntry(key))?.text;
}

export async function setCached(key: string, text: string): Promise<void> {
  const cache = await readCache();
  cache[key] = { text, updatedAt: Date.now(), consecutiveFailures: 0 };
  await writeCache(cache);
}

export async function recordCacheFailure(
  key: string,
  error: string,
  backoffSeconds: number[],
): Promise<CacheEntry> {
  const cache = await readCache();
  const previous = cache[key] ?? {};
  const failures = (previous.consecutiveFailures ?? 0) + 1;
  const delay = backoffSeconds[Math.min(failures - 1, backoffSeconds.length - 1)] ?? 60;
  const entry: CacheEntry = {
    ...previous,
    consecutiveFailures: failures,
    retryAfter: Date.now() + delay * 1000,
    lastError: error,
  };
  cache[key] = entry;
  await writeCache(cache);
  return entry;
}

function lockPath(key: string): string {
  const safe = Buffer.from(key).toString("base64url");
  return path.join(path.dirname(getCachePath()), "locks", `${safe}.lock`);
}

export async function acquireCacheLock(
  key: string,
  staleAfterSeconds: number,
): Promise<(() => Promise<void>) | undefined> {
  const file = lockPath(key);
  await fs.mkdir(path.dirname(file), { recursive: true });

  try {
    const handle = await fs.open(file, "wx", 0o600);
    await handle.writeFile(`${process.pid}\n${Date.now()}\n`);
    await handle.close();
    return async () => {
      await fs.rm(file, { force: true });
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "EEXIST") throw error;
  }

  try {
    const stat = await fs.stat(file);
    if (Date.now() - stat.mtimeMs > staleAfterSeconds * 1000) {
      await fs.rm(file, { force: true });
      return acquireCacheLock(key, staleAfterSeconds);
    }
  } catch {
    return acquireCacheLock(key, staleAfterSeconds);
  }

  return undefined;
}
