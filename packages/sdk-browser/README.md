# @betterlog/sdk-browser

Browser SDK for BetterLog — `withWorkflow`, `recordStep`, and Angular `HttpInterceptor` integration.

Uses a **publishable ingest-only key** (`BETTERLOG_PUBLISHABLE_API_KEY`), never the workspace secret.

## Angular

```typescript
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { bootstrapApplication } from "@angular/platform-browser";
import {
  betterLogInterceptor,
  provideBetterLog,
} from "@betterlog/sdk-browser/angular";

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([betterLogInterceptor])),
    provideBetterLog({
      serviceName: "storefront",
      apiUrl: "http://localhost:4000",
      publishableKey: "blg_publishable_dev",
    }),
  ],
});
```

See `examples/order-angular-nest` for the full demo.
