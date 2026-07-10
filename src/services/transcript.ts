import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getCachePath } from "../config";
import type { TokenMetrics, TokenUsage } from "../types";

interface TranscriptRecord {
  uuid?: string;
  requestId?: string;
  request_id?: string;
  timestamp?: string;
  message?: {
    id?: string;
    model?: string;
    usage?: TokenUsage;
  };
  usage?: TokenUsage;
}

interface TranscriptState {
  transcriptPath: string;
  device?: number;
  inode?: number;
  offset: number;
  remainder: string;
  usages: Record<string, Required<TokenUsage>>;
}

function emptyMetrics(): TokenMetrics {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalTokens: 0,
  };
}

function normalizeUsage(usage: TokenUsage | undefined): Required<TokenUsage> {
  return {
    input_tokens: usage?.input_tokens ?? 0,
    output_tokens: usage?.output_tokens ?? 0,
    cache_creation_input_tokens: usage?.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: usage?.cache_read_input_tokens ?? 0,
  };
}

function usageScore(usage: Required<TokenUsage>): number {
  return usage.input_tokens
    + usage.output_tokens
    + usage.cache_creation_input_tokens
    + usage.cache_read_input_tokens;
}

function recordKey(record: TranscriptRecord, absoluteLineOffset: number): string {
  return record.message?.id
    ?? record.uuid
    ?? record.requestId
    ?? record.request_id
    ?? `${record.timestamp ?? "line"}:${record.message?.model ?? "unknown"}:${absoluteLineOffset}`;
}

function statePath(transcriptPath: string): string {
  const hash = crypto.createHash("sha256").update(transcriptPath).digest("hex").slice(0, 24);
  return path.join(path.dirname(getCachePath()), "transcripts", `${hash}.json`);
}

async function readState(transcriptPath: string): Promise<TranscriptState | undefined> {
  try {
    const state = JSON.parse(await fs.readFile(statePath(transcriptPath), "utf8")) as TranscriptState;
    return state.transcriptPath === transcriptPath ? state : undefined;
  } catch {
    return undefined;
  }
}

async function writeState(state: TranscriptState): Promise<void> {
  const file = statePath(state.transcriptPath);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(state)}\n`, { mode: 0o600 });
  await fs.rename(temporary, file);
}

function metricsFromUsages(usages: Record<string, Required<TokenUsage>>): TokenMetrics {
  const metrics = emptyMetrics();

  for (const usage of Object.values(usages)) {
    metrics.inputTokens += usage.input_tokens;
    metrics.outputTokens += usage.output_tokens;
    metrics.cacheReadTokens += usage.cache_read_input_tokens;
    metrics.cacheWriteTokens += usage.cache_creation_input_tokens;
  }

  metrics.totalTokens = metrics.inputTokens
    + metrics.outputTokens
    + metrics.cacheReadTokens
    + metrics.cacheWriteTokens;

  return metrics;
}

function applyLine(
  rawLine: string,
  usages: Record<string, Required<TokenUsage>>,
  lineOffset: number,
): void {
  const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
  if (!line.trim()) return;

  let record: TranscriptRecord;
  try {
    record = JSON.parse(line) as TranscriptRecord;
  } catch {
    return;
  }

  const usage = normalizeUsage(record.message?.usage ?? record.usage);
  if (usageScore(usage) === 0) return;

  const key = recordKey(record, lineOffset);
  const previous = usages[key];
  if (!previous || usageScore(usage) > usageScore(previous)) {
    usages[key] = usage;
  }
}

function parseCompleteLines(
  text: string,
  usages: Record<string, Required<TokenUsage>>,
  baseOffset: number,
): string {
  const lines = text.split("\n");
  const remainder = lines.pop() ?? "";
  let consumedBytes = 0;

  for (const rawLine of lines) {
    applyLine(rawLine, usages, baseOffset + consumedBytes);
    consumedBytes += Buffer.byteLength(`${rawLine}\n`, "utf8");
  }

  // Claude normally writes JSONL with a trailing newline, but accepting a complete
  // final JSON object keeps metrics correct while the writer has not flushed "\n" yet.
  applyLine(remainder, usages, baseOffset + consumedBytes);
  return remainder;
}

export async function getTokenMetrics(
  transcriptPath: string | undefined,
): Promise<TokenMetrics> {
  if (!transcriptPath) return emptyMetrics();

  let stat: Awaited<ReturnType<typeof fs.stat>>;
  try {
    stat = await fs.stat(transcriptPath);
  } catch {
    return emptyMetrics();
  }

  let state = await readState(transcriptPath);
  const reset = !state
    || state.offset > stat.size
    || (state.inode !== undefined && state.inode !== stat.ino)
    || (state.device !== undefined && state.device !== stat.dev);

  if (reset) {
    state = {
      transcriptPath,
      device: stat.dev,
      inode: stat.ino,
      offset: 0,
      remainder: "",
      usages: {},
    };
  }

  const currentState = state as TranscriptState;

  if (currentState.offset === stat.size) {
    return metricsFromUsages(currentState.usages);
  }

  let handle: Awaited<ReturnType<typeof fs.open>> | undefined;
  try {
    handle = await fs.open(transcriptPath, "r");
    const length = stat.size - currentState.offset;
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, currentState.offset);

    const priorRemainderBytes = Buffer.byteLength(currentState.remainder, "utf8");
    const combined = currentState.remainder + buffer.toString("utf8");
    currentState.remainder = parseCompleteLines(
      combined,
      currentState.usages,
      Math.max(0, currentState.offset - priorRemainderBytes),
    );
    currentState.offset = stat.size;
    currentState.device = stat.dev;
    currentState.inode = stat.ino;
    await writeState(currentState);

    return metricsFromUsages(currentState.usages);
  } catch {
    return metricsFromUsages(currentState.usages);
  } finally {
    await handle?.close().catch(() => undefined);
  }
}
