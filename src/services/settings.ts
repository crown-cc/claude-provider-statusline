import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ClaudeProviderSettings } from "../types";

interface ClaudeSettingsFile {
  env?: Record<string, string | undefined>;
}

export function getClaudeConfigDir(): string {
  return process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), ".claude");
}

export function getClaudeSettingsPath(): string {
  return path.join(getClaudeConfigDir(), "settings.json");
}

export async function readClaudeProviderSettings(): Promise<ClaudeProviderSettings> {
  const settingsPath = getClaudeSettingsPath();
  let settings: ClaudeSettingsFile = {};

  try {
    settings = JSON.parse(await fs.readFile(settingsPath, "utf8")) as ClaudeSettingsFile;
  } catch {
    // Environment variables may still provide all required values.
  }

  const fileEnv = settings.env ?? {};

  return {
    settingsPath,
    baseUrl:
      process.env.ANTHROPIC_BASE_URL
      ?? fileEnv.ANTHROPIC_BASE_URL,
    apiKey:
      process.env.ANTHROPIC_AUTH_TOKEN
      ?? fileEnv.ANTHROPIC_AUTH_TOKEN
      ?? process.env.ANTHROPIC_API_KEY
      ?? fileEnv.ANTHROPIC_API_KEY,
    model:
      process.env.ANTHROPIC_MODEL
      ?? fileEnv.ANTHROPIC_MODEL
      ?? process.env.ANTHROPIC_DEFAULT_SONNET_MODEL
      ?? fileEnv.ANTHROPIC_DEFAULT_SONNET_MODEL,
  };
}

export async function installStatusLine(command: string): Promise<string> {
  const settingsPath = getClaudeSettingsPath();
  let settings: Record<string, unknown> = {};

  try {
    settings = JSON.parse(await fs.readFile(settingsPath, "utf8")) as Record<string, unknown>;
  } catch {
    // Create a new settings file below.
  }

  settings.statusLine = {
    type: "command",
    command,
    padding: 0,
  };

  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);

  return settingsPath;
}
