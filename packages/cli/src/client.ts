/**
 * Tiny fetch wrapper for the BetterLog diagnose API.
 *
 * No retries, no streaming, no fancy auth — just enough to:
 *  - send POST /v1/diagnose
 *  - distinguish network / 401 / 5xx / 4xx for nice error messages
 */

export interface ApiConfig {
  apiUrl: string;
  apiKey: string;
}

export interface DiagnoseRequest {
  question: string;
  workflow_id?: string;
}

export interface DiagnoseResponse {
  answer: string;
  tool_calls: Array<{ tool: string; input: unknown; output: unknown }>;
  step_count: number;
  finish_reason: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: "network" | "unauthorized" | "client" | "server",
    public readonly status?: number,
    public readonly body?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function diagnose(
  cfg: ApiConfig,
  body: DiagnoseRequest,
): Promise<DiagnoseResponse> {
  const url = new URL("/v1/diagnose", cfg.apiUrl).toString();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ApiError(`couldn't reach ${cfg.apiUrl}: ${msg}`, "network");
  }

  const text = await res.text();

  if (res.status === 401) {
    throw new ApiError("invalid API key", "unauthorized", 401, text);
  }
  if (res.status >= 500) {
    throw new ApiError(`server error ${res.status}`, "server", res.status, text);
  }
  if (!res.ok) {
    throw new ApiError(`client error ${res.status}`, "client", res.status, text);
  }

  try {
    return JSON.parse(text) as DiagnoseResponse;
  } catch {
    throw new ApiError(
      `server returned non-JSON 200 (first 200 bytes): ${text.slice(0, 200)}`,
      "server",
      res.status,
      text,
    );
  }
}
