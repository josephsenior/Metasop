"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Book, Code, Zap, Download, Share2, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const docsSections = [
  {
    icon: Zap,
    title: "Getting Started",
    description: "Learn how to generate your first architecture diagram",
    href: "#getting-started",
    color: "blue",
  },
  {
    icon: Code,
    title: "API Reference",
    description: "Integrate ArchitectAI into your workflow with our API",
    href: "#api",
    color: "cyan",
  },
  {
    icon: Download,
    title: "Export Formats",
    description: "Learn about all available export formats (JSON, PNG, SVG)",
    href: "#exports",
    color: "blue",
  },
  {
    icon: Share2,
    title: "Sharing & Collaboration",
    description: "Share diagrams with your team and collaborate effectively",
    href: "#sharing",
    color: "cyan",
  },
  {
    icon: Settings,
    title: "Advanced Features",
    description: "Explore advanced patterns, custom components, and more",
    href: "#advanced",
    color: "blue",
  },
  {
    icon: Book,
    title: "Best Practices",
    description: "Tips and best practices for creating great architecture diagrams",
    href: "#best-practices",
    color: "cyan",
  },
]

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
              Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about using ArchitectAI to generate architecture diagrams.
            </p>
          </div>

          {/* Quick Start */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl mb-12">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
            
            <h2 className="text-2xl font-semibold text-foreground mb-4">Quick Start</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Getting started with ArchitectAI is simple. Just describe your app idea in plain English, and our AI-powered 
                multi-agent system will generate a comprehensive architecture diagram in seconds.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 border border-border mt-4">
                <p className="text-sm font-mono text-foreground mb-2">Example prompt:</p>
                <p className="text-sm text-muted-foreground italic">
                  "Create a social media app with user authentication, posts, comments, and real-time notifications"
                </p>
              </div>
              <p className="mt-4">
                Our system analyzes your description and generates a complete architecture including component hierarchy, 
                data flow, API endpoints, and state management patterns.
              </p>
            </div>
          </div>

          {/* Documentation Sections */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {docsSections.map((section, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-border bg-card/80 backdrop-blur-sm cursor-pointer"
              >
                <CardHeader>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg mb-3 ${
                    section.color === "blue" 
                      ? "bg-blue-600/10 text-blue-700 dark:text-blue-400" 
                      : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
                  }`}>
                    <section.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={section.href}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    Learn more →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Overview */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
            
            <h2 className="text-2xl font-semibold text-foreground mb-6">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">AI-Powered Planning</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our multi-agent system (PM, Architect, Engineer) works together to create comprehensive architecture plans 
                  that cover all aspects of your application.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Interactive Diagrams</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Beautiful, interactive diagrams showing component relationships, data flow, and application structure. 
                  Export as JSON, PNG, or SVG for direct integration.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Multiple Export Formats</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Export your diagrams as JSON, PNG (high-res), or SVG. Perfect for documentation, 
                  presentations, and team collaboration.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Code-Aware Architecture</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our AI understands modern patterns, frameworks, state management, and best practices to suggest 
                  production-ready architectures.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Ready to start generating architecture diagrams?
            </p>
            <Button variant="gradient" asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

