import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getTokenMetrics } from "../src/services/transcript";

const paths: string[] = [];
let cacheRoot: string;

beforeEach(async () => {
  cacheRoot = await fs.mkdtemp(path.join(os.tmpdir(), "statusline-cache-"));
  process.env.XDG_CACHE_HOME = cacheRoot;
  paths.push(cacheRoot);
});

afterEach(async () => {
  delete process.env.XDG_CACHE_HOME;
  await Promise.all(paths.splice(0).map((item) => fs.rm(item, { recursive: true, force: true })));
});

async function transcript(lines: unknown[]): Promise<string> {
  const file = path.join(os.tmpdir(), `transcript-${Date.now()}-${Math.random()}.jsonl`);
  paths.push(file);
  await fs.writeFile(file, `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`);
  return file;
}

describe("getTokenMetrics", () => {
  it("deduplicates streaming updates by message id", async () => {
    const file = await transcript([
      { message: { id: "msg-1", usage: { input_tokens: 100, output_tokens: 10 } } },
      { message: { id: "msg-1", usage: { input_tokens: 100, output_tokens: 30 } } },
      {
        message: {
          id: "msg-2",
          usage: {
            input_tokens: 50,
            output_tokens: 5,
            cache_read_input_tokens: 20,
            cache_creation_input_tokens: 10,
          },
        },
      },
    ]);

    await expect(getTokenMetrics(file)).resolves.toEqual({
      inputTokens: 150,
      outputTokens: 35,
      cacheReadTokens: 20,
      cacheWriteTokens: 10,
      totalTokens: 215,
    });
  });

  it("reads only appended records while preserving accumulated metrics", async () => {
    const file = await transcript([
      { message: { id: "msg-1", usage: { input_tokens: 100, output_tokens: 10 } } },
    ]);

    await expect(getTokenMetrics(file)).resolves.toMatchObject({
      inputTokens: 100,
      outputTokens: 10,
    });

    await fs.appendFile(file, `${JSON.stringify({
      message: { id: "msg-2", usage: { input_tokens: 25, output_tokens: 5 } },
    })}\n`);

    await expect(getTokenMetrics(file)).resolves.toMatchObject({
      inputTokens: 125,
      outputTokens: 15,
      totalTokens: 140,
    });
  });

  it("resets persisted state when the transcript is truncated", async () => {
    const file = await transcript([
      { message: { id: "old", usage: { input_tokens: 100, output_tokens: 10 } } },
    ]);
    await getTokenMetrics(file);

    await fs.writeFile(file, `${JSON.stringify({
      message: { id: "new", usage: { input_tokens: 7, output_tokens: 3 } },
    })}\n`);

    await expect(getTokenMetrics(file)).resolves.toEqual({
      inputTokens: 7,
      outputTokens: 3,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      totalTokens: 10,
    });
  });
});
