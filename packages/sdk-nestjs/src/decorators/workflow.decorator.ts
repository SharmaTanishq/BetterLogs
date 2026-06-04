import { withWorkflow, type WithWorkflowOptions } from "@betterlog/sdk-node";

export interface WorkflowDecoratorOptions
  extends Omit<WithWorkflowOptions, "businessKeys"> {
  /**
   * Map of business key field names to arg paths, e.g.
   * `{ order_id: '0.orderId' }` reads args[0].orderId.
   */
  businessKeys?: Record<string, string>;
  /** Static business keys (merged with extracted keys). */
  staticBusinessKeys?: Record<string, string>;
}

function readArgPath(args: unknown[], path: string): unknown {
  const parts = path.split(".");
  let current: unknown = args;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    const index = Number(part);
    if (!Number.isNaN(index) && Array.isArray(current)) {
      current = current[index];
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function resolveBusinessKeys(
  options: WorkflowDecoratorOptions,
  args: unknown[],
): Record<string, string> {
  const out: Record<string, string> = { ...options.staticBusinessKeys };
  if (options.businessKeys) {
    for (const [key, path] of Object.entries(options.businessKeys)) {
      const value = readArgPath(args, path);
      if (value !== undefined && value !== null) {
        out[key] = String(value);
      }
    }
  }
  return out;
}

/** Method decorator — wraps the handler in `withWorkflow`. */
export function Workflow(options: WorkflowDecoratorOptions): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    if (typeof original !== "function") {
      throw new Error("@Workflow can only decorate methods");
    }

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const businessKeys = resolveBusinessKeys(options, args);
      return withWorkflow(
        {
          name: options.name,
          version: options.version,
          environment: options.environment,
          workflowId: options.workflowId,
          metadata: options.metadata,
          businessKeys,
        },
        async () => original.apply(this, args),
      );
    };

    return descriptor;
  };
}
