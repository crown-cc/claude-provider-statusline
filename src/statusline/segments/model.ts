import type { StatusLineSegment } from "../types";

export const modelSegment: StatusLineSegment = {
  id: "model",
  order: 100,
  render: ({ model }) => model.displayName,
};
