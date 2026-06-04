import { injectPropagationHeaders } from "@betterlog/sdk-node";

/** fetch wrapper that injects W3C trace + BetterLog baggage headers. */
export async function propagatingFetch(
  input: string | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = injectPropagationHeaders(
    Object.fromEntries(new Headers(init.headers).entries()),
  );
  return fetch(input, { ...init, headers });
}
