import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  acquireCacheLock,
  getCacheEntry,
  getCached,
  recordCacheFailure,
  setCached,
} from "../src/utils/cache";

let cacheRoot: string;

beforeEach(async () => {
  cacheRoot = await fs.mkdtemp(path.join(os.tmpdir(), "provider-cache-"));
  process.env.XDG_CACHE_HOME = cacheRoot;
});

afterEach(async () => {
  delete process.env.XDG_CACHE_HOME;
  await fs.rm(cacheRoot, { recursive: true, force: true });
});

describe("provider cache", () => {
  it("allows only one lock holder", async () => {
    const release = await acquireCacheLock("glm:test", 5);
    expect(release).toBeTypeOf("function");
    await expect(acquireCacheLock("glm:test", 5)).resolves.toBeUndefined();
    await release?.();
    await expect(acquireCacheLock("glm:test", 5)).resolves.toBeTypeOf("function");
  });

  it("preserves stale text and records exponential retry state", async () => {
    await setCached("glm:test", "5h 20%");
    await recordCacheFailure("glm:test", "HTTP 500", [60, 300]);
    const entry = await getCacheEntry("glm:test");

    expect(entry?.text).toBe("5h 20%");
    expect(entry?.consecutiveFailures).toBe(1);
    expect(entry?.retryAfter).toBeGreaterThan(Date.now());
    await expect(getCached("glm:test", 60)).resolves.toBe("5h 20%");
  });
});
