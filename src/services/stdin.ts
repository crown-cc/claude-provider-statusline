import type { ClaudeStatusInput } from "../types";

export async function readStatusInput(): Promise<ClaudeStatusInput> {
  return new Promise((resolve) => {
    let raw = "";

    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      raw += chunk;
    });

    process.stdin.on("end", () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw) as ClaudeStatusInput);
      } catch {
        resolve({});
      }
    });

    process.stdin.resume();
  });
}
