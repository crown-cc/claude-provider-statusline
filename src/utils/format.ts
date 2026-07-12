export function compactNumber(value: number): string {
  if (!Number.isFinite(value)) return "?";
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}b`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(Math.round(value));
}

export function formatMoney(value: string | number, currency: string): string {
  const numeric = Number(value);
  const formatted = Number.isFinite(numeric)
    ? new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numeric)
    : String(value);

  const symbol = currency === "USD" ? "$" : currency === "CNY" ? "¥" : `${currency} `;
  return `${symbol}${formatted}`;
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function formatPercent(value: number | undefined): string {
  return value === undefined || !Number.isFinite(value)
    ? "?"
    : `${clampPercent(value).toFixed(0)}%`;
}
