import type {
  ProviderContext,
  ProviderName,
  ProviderResult,
} from "../types";
import { queryDeepSeek } from "./deepseek";
import { queryGlm } from "./glm";

export type ProviderQuery = (
  context: ProviderContext,
) => Promise<ProviderResult>;

const registry = new Map<ProviderName, ProviderQuery>([
  ["deepseek", queryDeepSeek],
  ["glm", queryGlm],
]);

export function registerProvider(
  name: ProviderName,
  query: ProviderQuery,
): void {
  registry.set(name, query);
}

export function getProviderQuery(
  name: ProviderName,
): ProviderQuery | undefined {
  return registry.get(name);
}

export function unregisterProvider(provider: ProviderName): boolean {
  return registry.delete(provider);
}
