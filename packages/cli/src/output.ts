/**
 * Pretty-print helpers for the CLI.
 *
 * Wraps text at WIDTH cols for the answer block, leaves tool input/output
 * as one-line JSON so engineers can copy individual tool calls into
 * follow-up greps. Colors via picocolors; we never depend on chalk.
 */

import pc from "picocolors";
import type { DiagnoseResponse } from "./client.js";

const WIDTH = 100;

export function printAnswer(res: DiagnoseResponse): void {
  process.stdout.write(`${pc.bold(wrap(res.answer, WIDTH))}\n`);

  if (res.tool_calls.length > 0) {
    process.stdout.write(`\n${pc.dim(`Tool calls (${res.tool_calls.length}):`)}\n`);
    for (const call of res.tool_calls) {
      const input = safeJson(call.input);
      const output = safeJson(call.output);
      process.stdout.write(
        `  ${pc.cyan(call.tool)} ` +
          `${pc.dim("in:")} ${truncate(input, 200)} ` +
          `${pc.dim("out:")} ${truncate(output, 200)}\n`,
      );
    }
  }

  process.stdout.write(
    `\n${pc.dim(`steps: ${res.step_count}  finish: ${res.finish_reason}`)}\n`,
  );
}

function wrap(text: string, width: number): string {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (para.length <= width) {
      lines.push(para);
      continue;
    }
    const words = para.split(/\s+/);
    let line = "";
    for (const w of words) {
      if (line.length === 0) {
        line = w;
      } else if (line.length + 1 + w.length <= width) {
        line += " " + w;
      } else {
        lines.push(line);
        line = w;
      }
    }
    if (line.length > 0) lines.push(line);
  }
  return lines.join("\n");
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
