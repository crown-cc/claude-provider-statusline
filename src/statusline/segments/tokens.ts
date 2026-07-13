import type { StatusLineSegment } from "../types";
import { compactNumber } from "../../utils/format";

export const tokensSegment: StatusLineSegment = {
  id: "tokens",
  order: 300,
  render: ({ metrics }) => {
    const inputTokens = metrics.inputTokens
      + metrics.cacheWriteTokens
      + metrics.cacheReadTokens;
    const cachePercent =
      inputTokens > 0 ? (metrics.cacheReadTokens / inputTokens) * 100 : 0;

    return [
      `tokens ${compactNumber(inputTokens)}↑ ${compactNumber(metrics.outputTokens)}↓`,
      `cache ${cachePercent.toFixed(1)}%`,
    ].join(" │ ");
  },
};
