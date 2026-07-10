import type { AppConfig, ClaudeStatusInput } from "../types";
import type { StatusLineContext } from "./types";
import { resolveModelName, resolveProvider } from "../services/provider-resolver";
import { readClaudeProviderSettings } from "../services/settings";
import { getTokenMetrics } from "../services/transcript";

export async function createStatusLineContext(
  input: ClaudeStatusInput,
  config: AppConfig,
): Promise<StatusLineContext> {
  const settings = await readClaudeProviderSettings();
  const model = resolveModelName(input, settings);
  const provider = resolveProvider(input, settings, config);
  const metrics = await getTokenMetrics(input.transcript_path);

  return {
    input,
    config,
    settings,
    model,
    provider,
    metrics,
  };
}
