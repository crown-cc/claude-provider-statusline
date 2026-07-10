import type { StatusLineSegment } from "../types";
import { compactNumber, formatPercent } from "../../utils/format";

export const contextSegment: StatusLineSegment = {
  id: "context",
  order: 200,
  render: ({ input }) => {
    const context = input.context_window;

    if (!context) {
      return "ctx —";
    }

    const current = context.current_usage;
    const used =
      (current?.input_tokens ?? 0) +
      (current?.cache_creation_input_tokens ?? 0) +
      (current?.cache_read_input_tokens ?? 0);

    const max = context.context_window_size;

    let usedPercentage = context.used_percentage;

    if (usedPercentage == null && max !== undefined && max > 0) {
      usedPercentage = (used / max) * 100;
    }

    if (max !== undefined && max > 0 && usedPercentage !== undefined) {
      return `ctx ${compactNumber(used)}/${compactNumber(max)} ${formatPercent(usedPercentage)}`;
    }

    if (usedPercentage !== undefined) {
      return `ctx ${formatPercent(usedPercentage)}`;
    }

    return `ctx ${compactNumber(used)}`;
  },
};
