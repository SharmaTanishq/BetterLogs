import type { HttpHandlerFn, HttpInterceptorFn } from "@angular/common/http";
import { type HttpRequest } from "@angular/common/http";
import { injectPropagationHeaders } from "../baggage.js";
import { init, type InitOptions } from "../otel.js";

/** Functional Angular interceptor — injects W3C trace + BetterLog baggage on outbound HTTP. */
export const betterLogInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const headers = injectPropagationHeaders(
    Object.fromEntries(req.headers.keys().map((k) => [k, req.headers.get(k) ?? ""])),
  );
  const cloned = req.clone({ setHeaders: headers });
  return next(cloned);
};

export { init, shutdown, type InitOptions } from "../otel.js";
export { withWorkflow, type WithWorkflowOptions } from "../withWorkflow.js";
export { recordStep, type RecordStepOptions } from "../recordStep.js";

export type BetterLogBrowserConfig = InitOptions;

/** Angular provider factory — call in `bootstrapApplication` providers array. */
export function provideBetterLog(config: BetterLogBrowserConfig): [] {
  init(config);
  return [];
}
