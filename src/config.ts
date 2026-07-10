import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import type { AppConfig } from "./types";

export const DEFAULT_CONFIG: AppConfig = {
  cacheSeconds: 60,
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

export async function loadConfig(): Promise<AppConfig> {
  try {
    const raw = await fs.readFile(getConfigPath(), "utf8");
    const custom = JSON.parse(raw) as Partial<AppConfig>;

    return {
      ...DEFAULT_CONFIG,
      ...custom,
      performance: {
        ...DEFAULT_CONFIG.performance,
        ...custom.performance,
      },
      providerDetection: {
        ...DEFAULT_CONFIG.providerDetection,
        ...custom.providerDetection,
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function ensureConfig(): Promise<string> {
  const configPath = getConfigPath();
  await fs.mkdir(path.dirname(configPath), { recursive: true });

  try {
    await fs.access(configPath);
  } catch {
    await fs.writeFile(
      configPath,
      `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`,
      { mode: 0o600 },
    );
  }

  return configPath;
}
