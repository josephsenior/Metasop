"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, Target, Users, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back to home link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              About <span className="gradient-primary-text">ArchitectAI</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're on a mission to help developers visualize and plan their applications faster than ever before.
            </p>
          </div>

          {/* Mission Section */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl mb-12">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
            
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-400 shrink-0">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  ArchitectAI was born from a simple observation: developers spend too much time planning and not enough time building. 
                  We believe that visualizing your application architecture should be as easy as describing it. Our AI-powered multi-agent 
                  system transforms your ideas into professional architecture diagrams in seconds, saving hours of planning time 
                  and helping teams align before writing a single line of code.
                </p>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6 hover:shadow-lg transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-400 mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Speed</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Generate professional architecture diagrams in seconds, not hours. Focus on building, not planning.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6 hover:shadow-lg transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Intelligence</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Powered by advanced AI that understands modern patterns, best practices, and architectural principles.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6 hover:shadow-lg transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-400 mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Collaboration</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Share diagrams with your team, export in multiple formats, and align everyone before development starts.
              </p>
            </div>
          </div>

          {/* Story Section */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
            
            <h2 className="text-2xl font-semibold text-foreground mb-4">Our Story</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                ArchitectAI started as an internal tool to solve our own problem: we needed a faster way to plan applications 
                before diving into code. After seeing how much time it saved us, we realized other developers could benefit from this too.
              </p>
              <p>
                We built a sophisticated multi-agent system that combines the expertise of a Product Manager, Architect, and Engineer 
                to create comprehensive architecture diagrams. What used to take hours of whiteboarding and documentation now takes seconds.
              </p>
              <p>
                Today, ArchitectAI is used by thousands of developers worldwide to visualize their applications, align their teams, 
                and ship features faster. We're constantly improving our AI models and adding new features based on community feedback.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Join Us</h2>
            <p className="text-muted-foreground mb-6">
              Ready to transform how you plan applications?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" asChild>
                <Link href="/register">Get Started Free</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/#pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

