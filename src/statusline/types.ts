import type {
  AppConfig,
  ClaudeProviderSettings,
  ClaudeStatusInput,
  ProviderName,
  TokenMetrics,
} from "../types";

export interface ResolvedModel {
  id: string;
  displayName: string;
}

export interface StatusLineContext {
  input: ClaudeStatusInput;
  config: AppConfig;
  settings: ClaudeProviderSettings;
  model: ResolvedModel;
  provider: ProviderName;
  metrics: TokenMetrics;
}

export interface StatusLineSegment {
  /** Stable identifier used for configuration, ordering and overrides. */
  id: string;
  /** Lower values render first. */
  order: number;
  /** Optional predicate. Omitted means always enabled. */
  enabled?: (context: StatusLineContext) => boolean | Promise<boolean>;
  /** Return null/empty string to omit the segment. */
  render: (context: StatusLineContext) => string | null | Promise<string | null>;
}

export interface StatusLineRendererOptions {
  separator?: string;
  segments?: StatusLineSegment[];
}
