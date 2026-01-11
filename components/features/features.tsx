import { Sparkles, Network, Download, Code2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Planning",
    description:
      "Multi-agent system analyzes your prompt and generates comprehensive architecture. Our AI understands modern patterns and best practices to create production-ready diagrams.",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/10",
  },
  {
    icon: Network,
    title: "Visual Architecture Diagrams",
    description:
      "Beautiful interactive diagrams showing component hierarchy, data flow, and relationships. Export as JSON, PNG, or SVG for your documentation.",
    gradient: "from-cyan-500/10 to-teal-500/10",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500/10 dark:bg-cyan-500/10",
  },
  {
    icon: Download,
    title: "Export & Share",
    description:
      "Export diagrams in multiple formats (JSON, PNG, SVG) or share via link. Perfect for team collaboration, documentation, and presentations.",
    gradient: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/10 dark:bg-purple-500/10",
  },
  {
    icon: Code2,
    title: "Code-Aware Architecture",
    description:
      "Understands modern patterns, frameworks, state management, and component relationships. Suggests best practices and identifies potential issues before you code.",
    gradient: "from-emerald-500/10 to-green-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/10",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32 bg-secondary/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Badge variant="outline" className="mb-4">
            Features
          </Badge>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground text-balance">
            Everything you need to architect your apps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            From a simple description to a complete architecture diagram in seconds. Our AI-powered multi-agent system 
            plans your application structure, component hierarchy, and data flow automatically.
          </p>
        </div>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group relative overflow-hidden border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              
              <CardHeader className="relative">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.iconBg} ${feature.iconColor} mb-2 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-6 w-6" />
              </div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-foreground transition-colors">
                  {feature.title}
                </h3>
              </CardHeader>
              
              <CardContent className="relative">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
