/**
 * BetterLog SDK — OTel bootstrap.
 *
 * Initializes a NodeTracerProvider on first call to init(). Idempotent.
 * Exports OTLP/HTTP traces to `${BETTERLOG_API_URL}/v1/otlp/traces` with the
 * workspace API key in the Authorization header.
 *
 * Customers who already run an OTel SDK should NOT call init() — they
 * configure their own provider/exporter and just use the withWorkflow /
 * recordStep helpers, which read the active tracer via the global API.
 */

import { trace, type Tracer } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

const TRACER_NAME = "@betterlog/sdk-node";
const TRACER_VERSION = "0.0.0";

export interface InitOptions {
  /** Service name reported on every span. */
  serviceName: string;
  /** Service version. Optional but recommended. */
  serviceVersion?: string;
  /** Where to ship spans. Defaults to BETTERLOG_API_URL env. */
  apiUrl?: string;
  /** Workspace API key. Defaults to BETTERLOG_API_KEY env. */
  apiKey?: string;
}

let provider: NodeTracerProvider | undefined;

export function init(options: InitOptions): void {
  if (provider) return;

  const apiUrl = options.apiUrl ?? process.env.BETTERLOG_API_URL;
  const apiKey = options.apiKey ?? process.env.BETTERLOG_API_KEY;

  if (!apiUrl) {
    throw new Error("BetterLog SDK: apiUrl missing (set BETTERLOG_API_URL or pass apiUrl).");
  }
  if (!apiKey) {
    throw new Error("BetterLog SDK: apiKey missing (set BETTERLOG_API_KEY or pass apiKey).");
  }

  const exporter = new OTLPTraceExporter({
    url: `${apiUrl.replace(/\/$/, "")}/v1/otlp/traces`,
    headers: { authorization: `Bearer ${apiKey}` },
  });

  provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: options.serviceName,
      [ATTR_SERVICE_VERSION]: options.serviceVersion ?? "0.0.0",
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register();
}

export async function shutdown(): Promise<void> {
  if (!provider) return;
  await provider.shutdown();
  provider = undefined;
}

export function getTracer(): Tracer {
  return trace.getTracer(TRACER_NAME, TRACER_VERSION);
}
