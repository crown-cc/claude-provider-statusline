import type { StatusLineSegment } from "../types";
import { compactNumber } from "../../utils/format";

export const tokensSegment: StatusLineSegment = {
  id: "tokens",
  order: 300,
  render: ({ metrics }) => {
    const usageTokens = metrics.inputTokens + metrics.outputTokens;
    const cacheBase = metrics.inputTokens + metrics.cacheReadTokens;
    const cachePercent = cacheBase > 0 ? (metrics.cacheReadTokens / cacheBase) * 100 : 0;

    return [
      `usage ${compactNumber(usageTokens)} (${compactNumber(
        metrics.inputTokens,
      )}↑ ${compactNumber(metrics.outputTokens)}↓)`,
      `cache ${cachePercent.toFixed(1)}%`,
    ].join(" │ ");
  },
};
