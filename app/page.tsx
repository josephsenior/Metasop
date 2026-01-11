import { Header } from "@/components/layout/header"
import { Hero } from "@/components/features/hero"
import { Stats } from "@/components/features/stats"
import { Features } from "@/components/features/features"
import { HowItWorks } from "@/components/features/how-it-works"
import { Agents } from "@/components/agents"
import { Examples } from "@/components/features/examples"
import { Testimonials } from "@/components/features/testimonials"
import { Pricing } from "@/components/features/pricing"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/layout/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Stats />
      <HowItWorks />
      <Agents />
      <Features />
      <Examples />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
