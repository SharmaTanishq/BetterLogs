import { recordStep, type RecordStepOptions } from "@betterlog/sdk-node";

export type StepDecoratorOptions = RecordStepOptions;

/** Method decorator — wraps the handler in `recordStep`. */
export function Step(options: StepDecoratorOptions): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    if (typeof original !== "function") {
      throw new Error("@Step can only decorate methods");
    }

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const input = args.length === 1 ? args[0] : args.length > 0 ? args : undefined;
      return recordStep({ ...options, input }, async () => original.apply(this, args));
    };

    return descriptor;
  };
}
