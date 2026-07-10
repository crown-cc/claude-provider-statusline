#!/usr/bin/env node

import process from "node:process";

import { ensureConfig, loadConfig } from "./config";
import { runDoctor } from "./services/doctor";
import {
  getClaudeSettingsPath,
  installStatusLine,
  readClaudeProviderSettings,
} from "./services/settings";
import { readStatusInput } from "./services/stdin";
import { renderStatusLine } from "./statusline";

function printStep(message: string): void {
  console.log(`\n🔹 ${message}`);
}

function printSuccess(message: string): void {
  console.log(`   ✓ ${message}`);
}

function printWarning(message: string): void {
  console.log(`   ! ${message}`);
}

async function setup(): Promise<void> {
  console.log("🚀 Setting up claude-provider-statusline...");

  printStep("Creating configuration");
  const configPath = await ensureConfig();
  printSuccess(`Config ready: ${configPath}`);

  printStep("Locating Claude Code settings");
  const settingsPath = getClaudeSettingsPath();
  printSuccess(`Settings path: ${settingsPath}`);

  printStep("Installing status line configuration");

  // Always install the stable global command name. Using process.argv[1]
  // could persist a temporary tsx/npx path into Claude Code settings.
  const statusLineCommand = "claude-provider-statusline";
  await installStatusLine(statusLineCommand);
  printSuccess(`Command installed: ${statusLineCommand}`);

  printStep("Checking provider configuration");
  const providerSettings = await readClaudeProviderSettings();

  if (providerSettings.baseUrl) {
    printSuccess(`Base URL: ${providerSettings.baseUrl}`);
  } else {
    printWarning("Base URL: not configured");
  }

  if (providerSettings.model) {
    printSuccess(`Model: ${providerSettings.model}`);
  } else {
    printWarning("Model: not configured");
  }

  if (providerSettings.apiKey) {
    printSuccess("API key: found");
  } else {
    printWarning("API key: not found");
  }

  printStep("Testing provider quota");
  const config = await loadConfig();
  const report = await runDoctor(providerSettings, config);
  const quotaCheck = report.checks.find((item) => item.label === "Quota query");

  if (report.success && quotaCheck) {
    printSuccess(`Quota query: ${quotaCheck.message}`);
  } else if (quotaCheck) {
    printWarning(`Quota query: ${quotaCheck.message}`);
  } else {
    printWarning("Quota query: unavailable");
  }

  console.log();
  console.log("✅ Setup complete.");
  console.log();
  console.log("Next steps:");
  console.log("  1. Run: claude-provider-statusline doctor");
  console.log("  2. Restart Claude Code");
}

async function doctor(): Promise<void> {
  const settings = await readClaudeProviderSettings();
  const config = await loadConfig();
  const report = await runDoctor(settings, config);

  const icon = {
    ok: "✓",
    warn: "!",
    error: "✗",
  } as const;

  console.log("Claude Provider Statusline Doctor");
  console.log();

  for (const item of report.checks) {
    console.log(`${icon[item.status]} ${item.label.padEnd(17)} ${item.message}`);
  }

  console.log();
  if (report.success) {
    console.log(
      `Ready: provider configuration and live ${report.provider} quota query succeeded.`,
    );
    return;
  }

  if (!report.ready) {
    console.log("Not ready: complete the missing configuration, then run doctor again.");
  } else {
    console.log(
      `Configuration detected, but the live ${report.provider} quota query failed.`,
    );
  }

  process.exitCode = 1;
}

function printHelp(): void {
  console.log(`claude-provider-statusline

Usage:
  claude-provider-statusline
  claude-provider-statusline setup
  claude-provider-statusline init
  claude-provider-statusline doctor
  claude-provider-statusline help

Commands:
  setup    Install and configure the Claude Code status line
  init     Alias for setup
  doctor   Validate configuration and perform a live quota query
  help     Show this help message

Without a command, the program reads Claude Code status data from stdin
and renders the configured status line.
`);
}

async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case "setup":
    case "init":
      await setup();
      return;

    case "doctor":
      await doctor();
      return;

    case "help":
    case "--help":
    case "-h":
      printHelp();
      return;

    case undefined: {
      const input = await readStatusInput();
      const config = await loadConfig();
      process.stdout.write(await renderStatusLine(input, config));
      return;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.error();
      printHelp();
      process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`claude-provider-statusline: ${message}`);
  process.exitCode = 1;
});
