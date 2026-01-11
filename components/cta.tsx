import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Zap, Globe } from "lucide-react"

export function CTA() {
  return (
    <section className="relative py-12 md:py-16 bg-secondary/50 dark:bg-secondary/30 text-foreground overflow-hidden border-y border-border/50">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-purple-500/5 dark:from-blue-500/10 dark:via-cyan-500/10 dark:to-purple-500/10" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(6,182,212,0.06),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_50%,rgba(6,182,212,0.1),transparent_50%)]" />
      
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
            <Badge variant="outline" className="bg-background/50 border-border">
              Join 10,000+ developers
            </Badge>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                10 seconds
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                50,000+ diagrams
              </span>
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance mb-3 text-foreground">
            Ready to generate your architecture diagram?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-xl mx-auto">
            Join thousands of developers using our AI to visualize their apps before coding. Generate your first diagram free in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              size="lg" 
              className="gap-2 gradient-primary hover:opacity-90 text-white border-0 shadow-lg"
              asChild
            >
              <Link href="/dashboard/create">
                Generate Free Diagram
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border hover:bg-accent"
              asChild
            >
              <Link href="/dashboard/diagrams">
                View Examples
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
