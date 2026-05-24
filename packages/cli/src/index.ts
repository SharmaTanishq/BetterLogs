/**
 * `betterlog` CLI entry point. Argv parsing is hand-rolled because the surface
 * is one command — pulling in commander/yargs for `diagnose` would be silly.
 *
 * If the command surface grows beyond ~3 subcommands, switch to commander.
 */

import pc from "picocolors";
import { CliError, runDiagnose, type DiagnoseArgs } from "./diagnose.js";

const VERSION = "0.1.0";

const USAGE = `betterlog ${VERSION}
Diagnose questions about your workflows from the shell.

Usage:
  betterlog diagnose "<question>" [--workflow-id <id>] [--api-url <url>] [--api-key <key>]
  betterlog --help
  betterlog --version

Environment:
  BETTERLOG_API_URL  base URL of the betterlog-api (default: https://betterlog-api.fly.dev)
  BETTERLOG_API_KEY  workspace API key (required)

Examples:
  betterlog diagnose "Have we seen failures like this before?"
  betterlog diagnose "What happened to order #1234?" --workflow-id wf_01HXY...
`;

async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h" || args[0] === "help") {
    process.stdout.write(USAGE);
    return 0;
  }

  if (args[0] === "--version" || args[0] === "-v") {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  const command = args[0];

  if (command === "diagnose") {
    const parsed = parseDiagnoseArgs(args.slice(1));
    await runDiagnose(parsed);
    return 0;
  }

  process.stderr.write(`${pc.red("error:")} unknown command '${command}'\n\n${USAGE}`);
  return 2;
}

function parseDiagnoseArgs(args: string[]): DiagnoseArgs {
  let question: string | undefined;
  let workflowId: string | undefined;
  let apiUrl: string | undefined;
  let apiKey: string | undefined;

  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--workflow-id" || a === "--workflow_id") {
      workflowId = required(args[i + 1], a);
      i += 1;
    } else if (a === "--api-url") {
      apiUrl = required(args[i + 1], a);
      i += 1;
    } else if (a === "--api-key") {
      apiKey = required(args[i + 1], a);
      i += 1;
    } else if (a === "--help" || a === "-h") {
      process.stdout.write(USAGE);
      process.exit(0);
    } else if (a !== undefined && a.startsWith("-")) {
      throw new CliError(`${pc.red("error:")} unknown flag '${a}'\n\n${USAGE}`, 2);
    } else {
      if (question != null) {
        throw new CliError(
          `${pc.red("error:")} diagnose takes one question (got '${question}' and '${a}'). Quote multi-word questions.\n\n${USAGE}`,
          2,
        );
      }
      question = a;
    }
  }

  if (!question) {
    throw new CliError(
      `${pc.red("error:")} diagnose needs a question.\n\n${USAGE}`,
      2,
    );
  }

  return { question, ...(workflowId ? { workflowId } : {}), ...(apiUrl ? { apiUrl } : {}), ...(apiKey ? { apiKey } : {}) };
}

function required(v: string | undefined, flag: string): string {
  if (v === undefined || v.startsWith("-")) {
    throw new CliError(`${pc.red("error:")} ${flag} requires a value`, 2);
  }
  return v;
}

main(process.argv)
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    if (err instanceof CliError) {
      process.stderr.write(`${err.message}\n`);
      process.exit(err.exitCode);
    }
    const msg = err instanceof Error ? err.stack ?? err.message : String(err);
    process.stderr.write(`${pc.red("fatal:")} ${msg}\n`);
    process.exit(1);
  });
