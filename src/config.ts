import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import type { AppConfig } from "./types";

export const DEFAULT_CONFIG: AppConfig = {
  cacheSeconds: 60,
  refresh: {
    providerCacheSeconds: {
      default: 30,
      deepseek: 15,
      glm: 15,
    },
  },
  timeoutMs: 2000,
  showCost: false,
  performance: {
    providerLockSeconds: 5,
    failureBackoffSeconds: [60, 300, 900, 1800],
  },
  providerDetection: {
    deepseek: ["deepseek", "deep-seek", "api.deepseek.com", "ds-v3", "ds-r1"],
    glm: ["glm", "zai", "zhipu", "bigmodel.cn", "api.z.ai"],
  },
};

export function getConfigDir(): string {
  return process.env.CLAUDE_PROVIDER_STATUSLINE_CONFIG_DIR
    ?? path.join(os.homedir(), ".config", "claude-provider-statusline");
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), "config.json");
}

export function getCachePath(): string {
  return path.join(
    process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), ".cache"),
    "claude-provider-statusline",
    "cache.json",
  );
}

function mergeConfig(custom: Partial<AppConfig> = {}): AppConfig {
  return {
    ...DEFAULT_CONFIG,
    ...custom,
    refresh: {
      ...DEFAULT_CONFIG.refresh,
      ...custom.refresh,
      providerCacheSeconds: {
        ...DEFAULT_CONFIG.refresh.providerCacheSeconds,
        ...custom.refresh?.providerCacheSeconds,
      },
    },
    performance: {
      ...DEFAULT_CONFIG.performance,
      ...custom.performance,
    },
    providerDetection: {
      ...DEFAULT_CONFIG.providerDetection,
      ...custom.providerDetection,
    },
  };
}

export async function loadConfig(): Promise<AppConfig> {
  try {
    const raw = await fs.readFile(getConfigPath(), "utf8");
    return mergeConfig(JSON.parse(raw) as Partial<AppConfig>);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function ensureConfig(): Promise<string> {
  const configPath = getConfigPath();
  await fs.mkdir(path.dirname(configPath), { recursive: true });

  let config = DEFAULT_CONFIG;

  try {
    const raw = await fs.readFile(configPath, "utf8");
    config = mergeConfig(JSON.parse(raw) as Partial<AppConfig>);
  } catch {
    // Create the default configuration below.
  }

  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  return configPath;
}
