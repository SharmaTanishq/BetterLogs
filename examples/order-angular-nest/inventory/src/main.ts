import "reflect-metadata";
import { Body, Controller, Module, Post } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { BetterLogModule, Step } from "@betterlog/sdk-nestjs";
import { shutdown } from "@betterlog/sdk-node";

@Controller("inventory")
class InventoryController {
  @Post("reserve")
  @Step({ name: "inventory.reserve", service: "inventory-service" })
  async reserve(@Body() body: { orderId: string; sku: string }) {
    await sleep(50);

    if (process.env.FAIL_AT === "inventory" || body.sku === "BAD-SKU") {
      throw Object.assign(new Error("SKU mapping missing"), {
        code: "SKU_MAPPING_MISSING",
      });
    }

    return {
      orderId: body.orderId,
      sku: body.sku,
      reserved: true,
      reservedAt: new Date().toISOString(),
    };
  }
}

@Module({
  imports: [
    BetterLogModule.forRoot({
      serviceName: "inventory-service",
      serviceVersion: "0.0.1",
    }),
  ],
  controllers: [InventoryController],
})
class AppModule {}

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.INVENTORY_PORT ?? 3002);
  await app.listen(port);
  console.log(`Inventory service listening on http://localhost:${port}`);

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
