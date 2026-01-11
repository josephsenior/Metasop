import { Type, Sparkles, Network, Download, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const steps = [
  {
    icon: Type,
    title: "Describe Your App",
    description: "Simply describe your app idea in plain English. Our AI understands natural language and extracts all the key requirements.",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/10",
  },
  {
    icon: Sparkles,
    title: "AI Agents Collaborate",
    description: "Seven specialized AI agents work together: Product Manager defines requirements, Architect designs the system, DevOps plans infrastructure, Security ensures protection, Engineer implements details, UI Designer creates interfaces, and QA validates quality.",
    gradient: "from-cyan-500/10 to-teal-500/10",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500/10 dark:bg-cyan-500/10",
  },
  {
    icon: Network,
    title: "Get Diagram",
    description: "Receive a beautiful architecture diagram showing components, data flow, APIs, and relationships in seconds.",
    gradient: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/10 dark:bg-purple-500/10",
  },
  {
    icon: Download,
    title: "Export & Build",
    description: "Export as JSON, PNG, or SVG. Use the diagram to guide your development or share with your team.",
    gradient: "from-emerald-500/10 to-green-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/10",
  },
]

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="mb-4">
            How It Works
          </Badge>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground text-balance">
            From idea to architecture in 4 simple steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Our multi-agent system (Product Manager, Architect, DevOps, Security, Engineer, UI Designer, QA)
            works together to design your complete application architecture from requirements to deployment.
          </p>
        </div>

        <div className="mt-16 relative">
          {/* Enhanced connection line for desktop with arrows */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-px">
            {/* Main gradient line */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 via-purple-500 to-emerald-500 opacity-60" />
            
            {/* Animated flow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            
            {/* Arrow indicators between steps */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${(i + 1) * 25}%` }}
              >
                <div className="relative">
                  <ArrowRight className="h-5 w-5 text-cyan-500 drop-shadow-lg" />
                  <div className="absolute inset-0 bg-cyan-400/20 blur-md" />
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="relative overflow-hidden border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 group h-full">
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                  
                  <CardHeader className="pt-6 pb-4">
                  <div className="flex flex-col items-center text-center">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${step.iconBg} ${step.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="h-8 w-8" />
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-foreground">{step.title}</h3>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 pb-6">
                    <p className="text-sm text-muted-foreground leading-relaxed text-center">
                      {step.description}
                    </p>
                  </CardContent>
                  
                  {/* Enhanced arrow connector for mobile/tablet */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-cyan-500/30 shadow-md">
                        <ArrowRight className="h-5 w-5 text-cyan-500" />
                  </div>
                </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
