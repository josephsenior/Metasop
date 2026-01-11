import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Perfect for side projects and individual developers getting started.",
    features: [
      "3 diagrams per month",
      "Basic architecture patterns",
      "PNG export (watermarked)",
      "Community support",
      "No credit card required",
    ],
    cta: "Get Started Free",
    popular: false,
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For developers and teams building production applications.",
    features: [
      "Unlimited diagrams",
      "Advanced architecture patterns",
      "High-res exports (PNG, SVG, JSON)",
      "Code snippet suggestions",
      "Priority processing",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: true,
    gradient: "from-purple-500/10 to-pink-500/10",
  },
  {
    name: "Teams",
    price: "$49",
    period: "per month",
    description: "For teams that need collaboration and custom components.",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Custom component libraries",
      "API access",
      "Shared diagram library",
      "Priority support",
    ],
    cta: "Contact Sales",
    popular: false,
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="mb-4">
            Pricing
          </Badge>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground text-balance">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free, upgrade when you need to. No hidden fees.
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`group relative overflow-hidden transition-all duration-300 ${
                plan.popular 
                  ? "border-blue-600/50 dark:border-blue-400/50 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 dark:hover:shadow-blue-500/30 ring-2 ring-blue-600/10 dark:ring-blue-400/10" 
                  : "border-border/50 hover:border-border hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20"
              }`}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="gradient-primary text-white border-0 shadow-md">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                  className={`w-full ${plan.popular ? "gradient-primary hover:opacity-90 text-white border-0 shadow-md" : "border-border hover:bg-accent hover:text-accent-foreground"}`} 
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
