import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { ProblemSection } from "@/components/problem";
import { HowItWorks } from "@/components/how-it-works";
import { AgentsSection } from "@/components/agents-section";
import { FinalCta } from "@/components/final-cta";
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <main className="paper-grain relative min-h-dvh bg-[var(--color-cream)]">
      <Nav />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <AgentsSection />
      <FinalCta />
      <Footer />
    </main>
  );
}
