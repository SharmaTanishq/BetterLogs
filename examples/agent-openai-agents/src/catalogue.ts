/**
 * Tiny in-memory product catalogue + fake review/inventory data.
 *
 * The data is intentionally small and deterministic so the LLM's reasoning
 * is reproducible across runs — the point of these examples is to exercise
 * the SDK + diagnose loop, not to be a realistic product database.
 *
 * One SKU (BROKEN_SKU) deterministically throws on inventory lookup. The
 * agent wrapper in src/index.ts decides whether to surface that SKU to the
 * agent (default: yes — exercises the failure path; MODE=success: no).
 */
export const BROKEN_SKU = "LAPTOP-X-9000";

export interface Product {
  sku: string;
  name: string;
  priceCents: number;
  cpu: string;
  ramGb: number;
  storageGb: number;
  gpu: string;
  weightKg: number;
}

export interface Review {
  sku: string;
  source: string;
  ratingOutOfTen: number;
  excerpt: string;
}

const PRODUCTS: Product[] = [
  {
    sku: "LAPTOP-A-2024",
    name: "Aurora Studio 16",
    priceCents: 189_900,
    cpu: "Apple M3 Pro",
    ramGb: 32,
    storageGb: 1024,
    gpu: "M3 Pro 18-core",
    weightKg: 2.1,
  },
  {
    sku: "LAPTOP-B-2024",
    name: "Boreal Pro 15",
    priceCents: 174_900,
    cpu: "AMD Ryzen 9 7945HX",
    ramGb: 32,
    storageGb: 1024,
    gpu: "RTX 4070 Mobile",
    weightKg: 2.4,
  },
  {
    sku: "LAPTOP-C-2024",
    name: "Cirrus Air 14",
    priceCents: 134_900,
    cpu: "Intel Core Ultra 7",
    ramGb: 16,
    storageGb: 512,
    gpu: "Arc Graphics",
    weightKg: 1.4,
  },
  {
    sku: BROKEN_SKU,
    name: "Xenith X-9000",
    priceCents: 199_900,
    cpu: "Intel Core i9-14900HX",
    ramGb: 64,
    storageGb: 2048,
    gpu: "RTX 4080 Mobile",
    weightKg: 2.6,
  },
];

const REVIEWS: Review[] = [
  {
    sku: "LAPTOP-A-2024",
    source: "techreview.example",
    ratingOutOfTen: 9.1,
    excerpt: "Best-in-class battery life; ProRes export speeds rival a desktop tower.",
  },
  {
    sku: "LAPTOP-A-2024",
    source: "videopro.example",
    ratingOutOfTen: 8.7,
    excerpt: "Final Cut Pro flies. Color grading panel is uniformly accurate.",
  },
  {
    sku: "LAPTOP-B-2024",
    source: "techreview.example",
    ratingOutOfTen: 8.4,
    excerpt: "Brutal performance for the price; fans run loud under sustained load.",
  },
  {
    sku: "LAPTOP-B-2024",
    source: "videopro.example",
    ratingOutOfTen: 8.1,
    excerpt: "Premiere export benchmarks among the fastest in this price bracket.",
  },
  {
    sku: "LAPTOP-C-2024",
    source: "techreview.example",
    ratingOutOfTen: 7.8,
    excerpt: "Excellent everyday machine; struggles with 4K timeline scrubbing.",
  },
  {
    sku: BROKEN_SKU,
    source: "techreview.example",
    ratingOutOfTen: 9.4,
    excerpt: "Workstation-class. Heaviest of the bunch but every spec is maxed out.",
  },
];

const INVENTORY: Record<string, number> = {
  "LAPTOP-A-2024": 12,
  "LAPTOP-B-2024": 7,
  "LAPTOP-C-2024": 23,
};

export function searchProducts(query: string, includeBrokenSku: boolean): Product[] {
  const q = query.toLowerCase();
  const visible = includeBrokenSku ? PRODUCTS : PRODUCTS.filter((p) => p.sku !== BROKEN_SKU);

  const scored = visible.map((p) => {
    const haystack = `${p.name} ${p.cpu} ${p.gpu} ${p.sku}`.toLowerCase();
    let score = 0;
    for (const term of q.split(/\s+/)) {
      if (term && haystack.includes(term)) score += 1;
    }
    return { p, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.p.priceCents - b.p.priceCents)
    .slice(0, 4)
    .map((s) => s.p);
}

export function getProductBySku(sku: string): Product | undefined {
  return PRODUCTS.find((p) => p.sku === sku);
}

export function getReviewsForSku(sku: string): Review[] {
  return REVIEWS.filter((r) => r.sku === sku);
}

export function getInventory(sku: string): number {
  if (sku === BROKEN_SKU) {
    throw new InventoryLookupError(
      `Inventory subsystem returned 503 for sku=${sku}`,
      "INVENTORY_LOOKUP_FAILED",
      { sku, upstream: "back40-inventory", attemptedAt: new Date().toISOString() },
    );
  }
  const stock = INVENTORY[sku];
  if (stock === undefined) {
    throw new Error(`Unknown sku: ${sku}`);
  }
  return stock;
}

export class InventoryLookupError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details: Record<string, unknown>,
  ) {
    super(message);
    this.name = "InventoryLookupError";
  }
}
