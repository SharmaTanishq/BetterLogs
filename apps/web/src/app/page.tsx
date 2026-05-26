import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { WorkflowSection } from "@/components/workflow-canvas";
import { TwoViewsSection } from "@/components/two-views";
import { HowItWorks } from "@/components/how-it-works";
import { BuiltForBoth } from "@/components/agents-section";
import { FinalCta } from "@/components/final-cta";
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <main className="relative min-h-dvh bg-[var(--color-background)]">
      <Nav />
      <Hero />
      <WorkflowSection />
      <TwoViewsSection />
      <HowItWorks />
      <BuiltForBoth />
      <FinalCta />
      <Footer />
    </main>
  );
}
