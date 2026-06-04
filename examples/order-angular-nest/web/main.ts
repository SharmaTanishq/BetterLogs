import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { Component, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
  betterLogInterceptor,
  provideBetterLog,
  recordStep,
  withWorkflow,
} from "@betterlog/sdk-browser/angular";

@Component({
  selector: "app-root",
  standalone: true,
  template: `
    <h1>Order fulfillment (Angular)</h1>
    <p>Browser step → Nest gateway → inventory service</p>
    <button type="button" (click)="createOrder()">Create order</button>
    <pre>{{ output }}</pre>
  `,
})
class AppComponent {
  private readonly http = inject(HttpClient);
  output = "Ready.";

  async createOrder(): Promise<void> {
    const orderId = `web-${Math.floor(Math.random() * 10_000)}`;
    const gatewayUrl = import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:3001";
    const sku = "GOOD-SKU";

    try {
      this.output = `Starting workflow for ${orderId}…`;
      await withWorkflow(
        {
          name: "order.fulfillment",
          businessKeys: { order_id: orderId },
          metadata: { source: "angular-web" },
        },
        async () => {
          await recordStep(
            { name: "checkout.click", service: "storefront", input: { orderId, sku } },
            async () => {
              const result = await firstValueFrom(
                this.http.post<{ reserved: boolean }>(`${gatewayUrl}/orders`, { orderId, sku }),
              );
              return result;
            },
          );
        },
      );
      this.output = `Workflow complete for order ${orderId}. Check BetterLog dashboard.`;
    } catch (err) {
      this.output = `Failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([betterLogInterceptor])),
    provideBetterLog({
      serviceName: "storefront",
      serviceVersion: "0.0.1",
      apiUrl: import.meta.env.VITE_BETTERLOG_API_URL ?? "http://localhost:4000",
      publishableKey:
        import.meta.env.VITE_BETTERLOG_PUBLISHABLE_API_KEY ?? "blg_publishable_dev",
    }),
  ],
}).catch(console.error);
