export type BuiltInProviderName = "deepseek" | "glm" | "unknown";
export type ProviderName = BuiltInProviderName | (string & {});

export interface ClaudeStatusInput {
  model?: {
    id?: string;
    display_name?: string;
  } | string;
  transcript_path?: string;
  context_window?: {
    context_window_size?: number;
    used_percentage?: number;
    current_usage?: TokenUsage;
  };
  cost?: {
    total_cost_usd?: number;
  };
}

export interface TokenUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
}

export interface ClaudeProviderSettings {
  settingsPath: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}

export interface ProviderContext {
  apiKey: string;
  baseUrl?: string;
  timeoutMs: number;
}

export interface ProviderResult {
  provider: ProviderName;
  text: string;
}

export interface GlmLimit {
  type?: string;
  unit?: number | string;
  nextResetTime?: number | string;
  next_reset_time?: number | string;
  percentage?: number;
  usedPercentage?: number;
  used_percentage?: number;
  currentValue?: number;
  current_value?: number;
  used?: number;
  usage?: number;
  limit?: number;
  total?: number;
  maxValue?: number;
  max_value?: number;
  windowDurationMs?: number;
  window_duration_ms?: number;
  durationMs?: number;
  duration_ms?: number;
  timeWindowMs?: number;
  time_window_ms?: number;
  startTime?: number | string;
  start_time?: number | string;
  windowStart?: number | string;
  window_start?: number | string;
  endTime?: number | string;
  end_time?: number | string;
  windowEnd?: number | string;
  window_end?: number | string;
  resetTime?: number | string;
  reset_time?: number | string;
  resetsAt?: number | string;
  resets_at?: number | string;
  [key: string]: unknown;
}

export interface AppConfig {
  cacheSeconds: number;
  timeoutMs: number;
  showCost: boolean;
  performance: {
    providerLockSeconds: number;
    failureBackoffSeconds: number[];
  };
  providerDetection: {
    deepseek: string[];
    glm: string[];
  };
}
