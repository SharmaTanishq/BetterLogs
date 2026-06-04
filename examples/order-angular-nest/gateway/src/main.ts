import "reflect-metadata";
import { Body, Controller, Module, Post } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { BetterLogModule, propagatingFetch } from "@betterlog/sdk-nestjs";
import { getActiveWorkflow, recordStep, shutdown, withWorkflow } from "@betterlog/sdk-node";

@Controller("orders")
class OrdersController {
  @Post()
  async createOrder(@Body() body: { orderId: string; sku: string }) {
    const active = getActiveWorkflow();
    if (active) {
      return this.fulfill(body);
    }

    return withWorkflow(
      {
        name: "order.fulfillment",
        version: "1.0.0",
        businessKeys: { order_id: body.orderId },
      },
      async () => this.fulfill(body),
    );
  }

  private async fulfill(body: { orderId: string; sku: string }) {
    await recordStep(
      { name: "gateway.validate", service: "order-gateway", input: body },
      async () => {
        await sleep(30);
        return { valid: true };
      },
    );

    const inventoryUrl =
      process.env.INVENTORY_SERVICE_URL ?? "http://localhost:3002/inventory/reserve";
    const response = await propagatingFetch(inventoryUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = (await response.json()) as { message?: string };
      throw new Error(err.message ?? `inventory failed: ${response.status}`);
    }

    return response.json();
  }
}

@Module({
  imports: [
    BetterLogModule.forRoot({
      serviceName: "order-gateway",
      serviceVersion: "0.0.1",
    }),
  ],
  controllers: [OrdersController],
})
class AppModule {}

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? "http://localhost:4200").split(","),
    allowedHeaders: ["content-type", "traceparent", "tracestate", "baggage", "authorization"],
  });
  const port = Number(process.env.GATEWAY_PORT ?? 3001);
  await app.listen(port);
  console.log(`Order gateway listening on http://localhost:${port}`);

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      void shutdown().then(() => process.exit(0));
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
