import type { StatusLineSegment } from "../types";
import { getProviderQuery } from "../../providers/registry";
import {
  acquireCacheLock,
  getCacheEntry,
  getCached,
  recordCacheFailure,
  setCached,
} from "../../utils/cache";

export function formatProviderQuotaText(provider: string, text: string): string {
  if (provider !== "glm") return text;

  return text.replace(/\b(5h|week|month)\s+(\d+(?:\.\d+)?%)(?!\s+left)/g, "$1 $2 left");
}

export const providerSegment: StatusLineSegment = {
  id: "provider",
  order: 500,
  enabled: ({ provider, settings }) =>
    provider !== "unknown" && Boolean(settings.apiKey),
  render: async ({ provider, settings, config }) => {
    if (!settings.apiKey) return null;

    const query = getProviderQuery(provider);
    if (!query) return `${provider} quota unsupported`;

    const cacheKey = `${provider}:${settings.baseUrl ?? "default"}`;
    const providerCacheSeconds =
      config.refresh.providerCacheSeconds[provider]
      ?? config.refresh.providerCacheSeconds.default
      ?? config.cacheSeconds;
    const cached = await getCached(cacheKey, providerCacheSeconds);
    if (cached) return formatProviderQuotaText(provider, cached);

    const entry = await getCacheEntry(cacheKey);
    const stale = entry?.text;
    if (entry?.retryAfter && entry.retryAfter > Date.now()) {
      return stale
        ? `${formatProviderQuotaText(provider, stale)} stale`
        : `${provider} quota retrying later`;
    }

    const release = await acquireCacheLock(
      cacheKey,
      config.performance.providerLockSeconds,
    );
    if (!release) {
      return stale
        ? `${formatProviderQuotaText(provider, stale)} stale`
        : `${provider} quota refreshing`;
    }

    try {
      const result = await query({
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        timeoutMs: config.timeoutMs,
      });

      await setCached(cacheKey, result.text);
      return formatProviderQuotaText(provider, result.text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await recordCacheFailure(
        cacheKey,
        message,
        config.performance.failureBackoffSeconds,
      );
      return stale
        ? `${formatProviderQuotaText(provider, stale)} stale`
        : `${provider} quota unavailable`;
    } finally {
      await release();
    }
  },
};
