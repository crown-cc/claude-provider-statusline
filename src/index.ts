export { DEFAULT_CONFIG, ensureConfig, loadConfig } from "./config";
export { queryDeepSeek } from "./providers/deepseek";
export { queryGlm } from "./providers/glm";
export {
  getProviderQuery,
  registerProvider,
  unregisterProvider,
} from "./providers/registry";
export {
  createDefaultStatusLineRenderer,
  renderStatusLine,
  StatusLineRenderer,
} from "./statusline";
export type {
  StatusLineContext,
  StatusLineRendererOptions,
  StatusLineSegment,
} from "./statusline";
export type * from "./types";

export * from "./services/doctor";
