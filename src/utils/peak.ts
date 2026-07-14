import type { BuiltInProviderName } from "../types";

const CHINA_TIME_ZONE = "Asia/Shanghai";
const MINUTES_PER_DAY = 24 * 60;

type MinuteWindow = {
  start: number;
  end: number;
};

const OFF_PEAK_WINDOWS: Partial<Record<BuiltInProviderName, MinuteWindow>> = {
  // DeepSeek discounted period: 00:30-08:30 China Standard Time.
  deepseek: { start: 30, end: 8 * 60 + 30 },
  // GLM Coding Plan off-peak period: 00:00-08:00 China Standard Time.
  glm: { start: 0, end: 8 * 60 },
};

function minutesInChina(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHINA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Number(values.hour) * 60 + Number(values.minute);
}

function isWithinWindow(minutes: number, window: MinuteWindow): boolean {
  const normalized = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  if (window.start <= window.end) {
    return normalized >= window.start && normalized < window.end;
  }

  return normalized >= window.start || normalized < window.end;
}

export function isProviderPeakTime(
  provider: BuiltInProviderName,
  date: Date = new Date(),
): boolean {
  const offPeakWindow = OFF_PEAK_WINDOWS[provider];
  if (!offPeakWindow) return false;

  return !isWithinWindow(minutesInChina(date), offPeakWindow);
}

export function peakMarker(
  provider: BuiltInProviderName,
  date: Date = new Date(),
): string | undefined {
  return isProviderPeakTime(provider, date) ? "⚡ peak" : undefined;
}
