import type { StatusLineSegment } from "./types";
import { modelSegment } from "./segments/model";
import { contextSegment } from "./segments/context";
import { tokensSegment } from "./segments/tokens";
import { costSegment } from "./segments/cost";
import { providerSegment } from "./segments/provider";

export const defaultSegments: StatusLineSegment[] = [
  modelSegment,
  contextSegment,
  tokensSegment,
  costSegment,
  providerSegment,
];
