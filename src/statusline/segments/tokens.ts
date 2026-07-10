import type { StatusLineSegment } from "../types";
import { compactNumber } from "../../utils/format";

export const tokensSegment: StatusLineSegment = {
  id: "tokens",
  order: 300,
  render: ({ metrics }) => [
    `in ${compactNumber(metrics.inputTokens)}`,
    `out ${compactNumber(metrics.outputTokens)}`,
    `cache ${compactNumber(metrics.cacheReadTokens)}/${compactNumber(metrics.cacheWriteTokens)}`,
  ].join(" · "),
};
