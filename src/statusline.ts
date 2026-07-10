import type { AppConfig, ClaudeStatusInput } from "./types";
import type {
  StatusLineRendererOptions,
  StatusLineSegment,
} from "./statusline/types";
import { createStatusLineContext } from "./statusline/context";
import { defaultSegments } from "./statusline/default-segments";
import { StatusLineRenderer } from "./statusline/renderer";

export {
  StatusLineRenderer,
  createStatusLineContext,
  defaultSegments,
};
export type {
  StatusLineContext,
  StatusLineRendererOptions,
  StatusLineSegment,
} from "./statusline/types";

export function createDefaultStatusLineRenderer(
  options: Omit<StatusLineRendererOptions, "segments"> & {
    segments?: StatusLineSegment[];
  } = {},
): StatusLineRenderer {
  return new StatusLineRenderer({
    separator: options.separator,
    segments: options.segments ?? defaultSegments,
  });
}

/**
 * Backward-compatible convenience API.
 * Advanced users can construct a StatusLineRenderer and register/replace/remove
 * segments without changing this orchestration layer.
 */
export async function renderStatusLine(
  input: ClaudeStatusInput,
  config: AppConfig,
  renderer: StatusLineRenderer = createDefaultStatusLineRenderer(),
): Promise<string> {
  const context = await createStatusLineContext(input, config);
  return renderer.render(context);
}
