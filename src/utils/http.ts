export async function fetchJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    const text = await response.text();
    let body: unknown;

    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`HTTP ${response.status}: invalid JSON response`);
    }

    if (!response.ok) {
      const record = body as Record<string, unknown>;
      const message =
        (record.error as { message?: string } | undefined)?.message
        ?? String(record.message ?? record.msg ?? "");

      throw new Error(
        `HTTP ${response.status}${message ? `: ${message}` : ""}`,
      );
    }

    return body as T;
  } finally {
    clearTimeout(timer);
  }
}
