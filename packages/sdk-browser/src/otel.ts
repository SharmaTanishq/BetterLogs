import { trace, type Tracer } from "@opentelemetry/api";
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { WorkflowAwareSpanProcessor } from "./workflowAwareSpanProcessor.js";

const TRACER_NAME = "@betterlog/sdk-browser";
const TRACER_VERSION = "0.1.0";

export interface InitOptions {
  serviceName: string;
  serviceVersion?: string;
  /** BetterLog API base URL, e.g. https://api.example.com */
  apiUrl: string;
  /** Publishable ingest-only key (never the workspace secret). */
  publishableKey: string;
}

let provider: WebTracerProvider | undefined;

export function init(options: InitOptions): void {
  if (provider) return;

  const { apiUrl, publishableKey } = options;
  if (!apiUrl) {
    throw new Error("BetterLog browser SDK: apiUrl is required.");
  }
  if (!publishableKey) {
    throw new Error("BetterLog browser SDK: publishableKey is required.");
  }

  const exporter = new OTLPTraceExporter({
    url: `${apiUrl.replace(/\/$/, "")}/v1/otlp/traces`,
    headers: { authorization: `Bearer ${publishableKey}` },
  });

  provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: options.serviceName,
      [ATTR_SERVICE_VERSION]: options.serviceVersion ?? "0.0.0",
    }),
    spanProcessors: [new WorkflowAwareSpanProcessor(new BatchSpanProcessor(exporter))],
  });

  provider.register({
    propagator: new CompositePropagator({
      propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
    }),
  });
}

export async function shutdown(): Promise<void> {
  if (!provider) return;
  await provider.shutdown();
  provider = undefined;
}

export function getTracer(): Tracer {
  return trace.getTracer(TRACER_NAME, TRACER_VERSION);
}
