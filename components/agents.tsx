import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  UserCheck,
  Building,
  Server,
  Shield,
  Code,
  Palette,
  CheckCircle,
  Sparkles
} from "lucide-react"

const agents = [
  {
    icon: UserCheck,
    title: "Product Manager",
    description: "Analyzes requirements, defines features, creates user stories, and establishes project scope and priorities.",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/10",
    specialties: ["Requirements Analysis", "Feature Definition", "User Stories", "Project Planning"]
  },
  {
    icon: Building,
    title: "Architect",
    description: "Designs system architecture, defines component relationships, establishes data flow, and creates technical specifications.",
    gradient: "from-cyan-500/10 to-teal-500/10",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500/10 dark:bg-cyan-500/10",
    specialties: ["System Design", "Component Architecture", "Data Flow", "Technical Specs"]
  },
  {
    icon: Server,
    title: "DevOps Engineer",
    description: "Configures infrastructure, builds CI/CD pipelines, manages deployments, and ensures scalable cloud architecture.",
    gradient: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/10 dark:bg-purple-500/10",
    specialties: ["Infrastructure", "CI/CD Pipelines", "Cloud Deployment", "Monitoring"]
  },
  {
    icon: Shield,
    title: "Security Engineer",
    description: "Implements security architecture, threat modeling, encryption strategies, and ensures compliance with security standards.",
    gradient: "from-red-500/10 to-orange-500/10",
    iconColor: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-500/10 dark:bg-red-500/10",
    specialties: ["Threat Modeling", "Encryption", "Access Control", "Compliance"]
  },
  {
    icon: Code,
    title: "Software Engineer",
    description: "Develops implementation details, writes code specifications, defines APIs, and creates technical documentation.",
    gradient: "from-emerald-500/10 to-green-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/10",
    specialties: ["Code Architecture", "API Design", "Implementation", "Documentation"]
  },
  {
    icon: Palette,
    title: "UI Designer",
    description: "Creates user interface designs, defines design systems, establishes visual hierarchy, and ensures user experience excellence.",
    gradient: "from-pink-500/10 to-rose-500/10",
    iconColor: "text-pink-600 dark:text-pink-400",
    iconBg: "bg-pink-500/10 dark:bg-pink-500/10",
    specialties: ["UI Design", "Design Systems", "User Experience", "Visual Hierarchy"]
  },
  {
    icon: CheckCircle,
    title: "QA Engineer",
    description: "Develops testing strategies, defines test cases, implements quality assurance processes, and ensures software reliability.",
    gradient: "from-amber-500/10 to-yellow-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/10",
    specialties: ["Test Strategy", "Quality Assurance", "Test Cases", "Reliability"]
  }
]

export function Agents() {
  return (
    <section id="agents" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-2" />
            AI Agent Team
          </Badge>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground text-balance">
            Meet Your AI Architecture Team
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Seven specialized AI agents work together to transform your ideas into complete,
            production-ready application architectures. Each agent brings deep expertise in their domain.
          </p>
        </div>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map((agent, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

              <CardHeader className="relative pb-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${agent.iconBg} ${agent.iconColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <agent.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-foreground transition-colors">
                  {agent.title}
                </h3>
              </CardHeader>

              <CardContent className="relative pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {agent.description}
                </p>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1.5">
                  {agent.specialties.map((specialty, specialtyIndex) => (
                    <Badge
                      key={specialtyIndex}
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Each agent specializes in their domain, ensuring your application architecture covers
            all aspects from product strategy to deployment and security. They collaborate seamlessly
            to deliver comprehensive, production-ready solutions.
          </p>
        </div>
      </div>
    </section>
  )
}