import type { StatusLineSegment } from "../types";

export const costSegment: StatusLineSegment = {
  id: "cost",
  order: 400,
  enabled: ({ config, input }) =>
    config.showCost && input.cost?.total_cost_usd !== undefined,
  render: ({ input }) => `$${input.cost!.total_cost_usd!.toFixed(3)}`,
};
