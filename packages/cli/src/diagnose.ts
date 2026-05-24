/**
 * `betterlog diagnose <question>` command implementation.
 *
 * Resolves API URL + key from flags > env > built-in defaults, calls
 * POST /v1/diagnose, prints the result. All error reporting is funneled
 * back to index.ts via thrown CliErrors so exit codes stay consistent.
 */

import pc from "picocolors";
import { ApiError, diagnose as callDiagnose } from "./client.js";
import { printAnswer } from "./output.js";

const DEFAULT_API_URL = "https://betterlog-api.fly.dev";

export interface DiagnoseArgs {
  question: string;
  workflowId?: string;
  apiUrl?: string;
  apiKey?: string;
}

export class CliError extends Error {
  constructor(message: string, public readonly exitCode = 1) {
    super(message);
    this.name = "CliError";
  }
}

export async function runDiagnose(args: DiagnoseArgs): Promise<void> {
  const apiUrl = args.apiUrl ?? process.env.BETTERLOG_API_URL ?? DEFAULT_API_URL;
  const apiKey = args.apiKey ?? process.env.BETTERLOG_API_KEY;

  if (!apiKey) {
    throw new CliError(
      `${pc.red("error:")} no API key.\n` +
        `Set ${pc.bold("BETTERLOG_API_KEY")} in your environment, or pass ${pc.bold("--api-key <key>")}.\n` +
        `Get the production key with: flyctl ssh console -a betterlog-api -C 'printenv BETTERLOG_API_KEY'`,
    );
  }

  try {
    const res = await callDiagnose({ apiUrl, apiKey }, {
      question: args.question,
      ...(args.workflowId ? { workflow_id: args.workflowId } : {}),
    });
    printAnswer(res);
  } catch (err) {
    if (err instanceof ApiError) {
      switch (err.kind) {
        case "unauthorized":
          throw new CliError(
            `${pc.red("error:")} invalid API key (HTTP 401 from ${apiUrl}).\n` +
              `Set a valid ${pc.bold("BETTERLOG_API_KEY")} or pass ${pc.bold("--api-key <key>")}.`,
          );
        case "network":
          throw new CliError(`${pc.red("error:")} ${err.message}`);
        case "server":
          throw new CliError(
            `${pc.red("error:")} server returned ${err.status} from ${apiUrl}\n` +
              (err.body ? `${pc.dim(err.body.slice(0, 1000))}` : ""),
          );
        case "client":
          throw new CliError(
            `${pc.red("error:")} ${err.message} from ${apiUrl}\n` +
              (err.body ? `${pc.dim(err.body.slice(0, 1000))}` : ""),
          );
      }
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new CliError(`${pc.red("error:")} ${msg}`);
  }
}
