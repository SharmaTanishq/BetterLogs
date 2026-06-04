import { type DynamicModule, Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { init, type InitOptions } from "@betterlog/sdk-node";
import { WorkflowContextInterceptor } from "./interceptors/workflow-context.interceptor.js";

export interface BetterLogModuleOptions extends InitOptions {
  /** When true (default), auto rehydrate remote workflows from inbound headers. */
  enableInboundPropagation?: boolean;
}

@Module({})
export class BetterLogModule {
  static forRoot(options: BetterLogModuleOptions): DynamicModule {
    const { enableInboundPropagation = true, ...initOptions } = options;

    init(initOptions);

    const providers =
      enableInboundPropagation === false
        ? []
        : [{ provide: APP_INTERCEPTOR, useClass: WorkflowContextInterceptor }];

    return {
      module: BetterLogModule,
      global: true,
      providers,
      exports: [],
    };
  }
}
