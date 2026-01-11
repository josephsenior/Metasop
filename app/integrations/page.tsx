"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Zap, Code, GitBranch, Webhook, Box } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const integrations = [
  {
    icon: Code,
    title: "REST API",
    description: "Integrate ArchitectAI into your workflow with our comprehensive REST API",
    status: "Available",
    color: "blue",
  },
  {
    icon: GitBranch,
    title: "GitHub",
    description: "Generate diagrams directly from your GitHub repositories and PRs",
    status: "Coming Soon",
    color: "cyan",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Receive real-time notifications when diagrams are generated or updated",
    status: "Available",
    color: "blue",
  },
  {
    icon: Box,
    title: "VS Code Extension",
    description: "Generate and view architecture diagrams directly in your editor",
    status: "Coming Soon",
    color: "cyan",
  },
  {
    icon: Zap,
    title: "Slack",
    description: "Share diagrams and get notifications in your Slack workspace",
    status: "Coming Soon",
    color: "blue",
  },
  {
    icon: Webhook,
    title: "CI/CD Integration",
    description: "Automatically generate diagrams as part of your deployment pipeline",
    status: "Coming Soon",
    color: "cyan",
  },
]

export default function IntegrationsPage() {
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
              Integrations
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect ArchitectAI with your favorite tools and workflows to streamline your development process.
            </p>
          </div>

          {/* Integrations Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {integrations.map((integration, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-border bg-card/80 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg mb-3 ${integration.color === "blue"
                      ? "bg-blue-600/10 text-blue-700 dark:text-blue-400"
                      : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
                    }`}>
                    <integration.icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{integration.title}</CardTitle>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${integration.status === "Available"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                      }`}>
                      {integration.status}
                    </span>
                  </div>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {integration.status === "Available" ? (
                    <Link
                      href="/api-reference"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      View docs →
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">Coming soon</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* API Section */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />

            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-400 shrink-0">
                <Code className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">Build Your Own Integration</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our REST API makes it easy to integrate ArchitectAI into any tool or workflow.
                  Generate diagrams programmatically, receive webhooks, and automate your architecture planning.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="gradient" asChild>
                    <Link href="/api-reference">View API Docs</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/help">Get Support</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

