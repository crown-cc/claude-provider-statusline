import type {
  AppConfig,
  ClaudeProviderSettings,
  ClaudeStatusInput,
  ProviderName,
} from "../types";

function matches(value: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    try {
      return new RegExp(pattern, "i").test(value);
    } catch {
      return value.toLowerCase().includes(pattern.toLowerCase());
    }
  });
}

export function resolveModelName(
  input: ClaudeStatusInput,
  settings: ClaudeProviderSettings,
): { id: string; displayName: string } {
  if (typeof input.model === "string") {
    return {
      id: input.model,
      displayName: input.model,
    };
  }

  const id = input.model?.id ?? settings.model ?? "unknown";
  const displayName = input.model?.display_name ?? id;

  return { id, displayName };
}

export function resolveProvider(
  input: ClaudeStatusInput,
  settings: ClaudeProviderSettings,
  config: AppConfig,
): ProviderName {
  const model = resolveModelName(input, settings);
  const value = [
    settings.baseUrl,
    model.id,
    model.displayName,
  ].filter(Boolean).join(" ");

  if (matches(value, config.providerDetection.deepseek)) return "deepseek";
  if (matches(value, config.providerDetection.glm)) return "glm";
  return "unknown";
}
