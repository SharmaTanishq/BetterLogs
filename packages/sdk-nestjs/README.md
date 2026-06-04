# @betterlog/sdk-nestjs

NestJS integration for BetterLog: `@Workflow` / `@Step` decorators, inbound baggage propagation, and `propagatingFetch`.

## Usage

```typescript
import { Module } from "@nestjs/common";
import { BetterLogModule, Step, Workflow } from "@betterlog/sdk-nestjs";

@Module({
  imports: [
    BetterLogModule.forRoot({
      serviceName: "order-gateway",
      apiUrl: process.env.BETTERLOG_API_URL,
      apiKey: process.env.BETTERLOG_API_KEY,
    }),
  ],
})
export class AppModule {}
```

See `examples/order-angular-nest` for a full cross-service demo.
