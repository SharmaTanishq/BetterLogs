/**
 * Minimal Zod schemas for the OTLP/HTTP JSON trace export request.
 *
 * Only the fields we actually use are typed. Unknown fields are passed
 * through harmlessly because we don't use .strict().
 *
 * Spec: https://opentelemetry.io/docs/specs/otlp/#otlphttp
 */

import { z } from "zod";

const AnyValue: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    stringValue: z.string().optional(),
    boolValue: z.boolean().optional(),
    intValue: z.union([z.string(), z.number()]).optional(),
    doubleValue: z.number().optional(),
    arrayValue: z.object({ values: z.array(AnyValue).optional() }).optional(),
    kvlistValue: z
      .object({
        values: z
          .array(z.object({ key: z.string(), value: AnyValue }))
          .optional(),
      })
      .optional(),
    bytesValue: z.string().optional(),
  }),
);

const KeyValue = z.object({
  key: z.string(),
  value: AnyValue.optional(),
});

const Status = z.object({
  code: z.number().optional(),
  message: z.string().optional(),
});

const Span = z.object({
  traceId: z.string(),
  spanId: z.string(),
  parentSpanId: z.string().optional(),
  name: z.string(),
  kind: z.number().optional(),
  startTimeUnixNano: z.union([z.string(), z.number()]),
  endTimeUnixNano: z.union([z.string(), z.number()]).optional(),
  attributes: z.array(KeyValue).optional(),
  events: z.array(z.unknown()).optional(),
  status: Status.optional(),
});

const ScopeSpans = z.object({
  scope: z.object({ name: z.string().optional(), version: z.string().optional() }).optional(),
  spans: z.array(Span).optional(),
});

const Resource = z.object({
  attributes: z.array(KeyValue).optional(),
});

const ResourceSpans = z.object({
  resource: Resource.optional(),
  scopeSpans: z.array(ScopeSpans).optional(),
});

export const ExportTraceRequest = z.object({
  resourceSpans: z.array(ResourceSpans).optional(),
});

export type ExportTraceRequest = z.infer<typeof ExportTraceRequest>;
export type OtlpSpan = z.infer<typeof Span>;
export type OtlpKeyValue = z.infer<typeof KeyValue>;
