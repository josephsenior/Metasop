"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, Bug, Zap, Plus } from "lucide-react"

const changelogEntries = [
  {
    date: "2024-01-20",
    version: "1.2.0",
    type: "feature",
    title: "Enhanced AI Models",
    description: "Improved diagram generation accuracy with updated AI models. Better understanding of modern patterns and component relationships.",
    icon: Sparkles,
  },
  {
    date: "2024-01-15",
    version: "1.1.5",
    type: "improvement",
    title: "Export Performance",
    description: "Faster PNG and SVG export generation. Reduced export time by 40% for large diagrams.",
    icon: Zap,
  },
  {
    date: "2024-01-10",
    version: "1.1.0",
    type: "feature",
    title: "Dark Mode Support",
    description: "Added full dark mode support across all pages. Automatic theme detection based on system preferences.",
    icon: Plus,
  },
  {
    date: "2024-01-05",
    version: "1.0.8",
    type: "fix",
    title: "Bug Fixes",
    description: "Fixed diagram rendering issues on mobile devices. Resolved export formatting problems for certain diagram types.",
    icon: Bug,
  },
  {
    date: "2024-01-01",
    version: "1.0.5",
    type: "feature",
    title: "API Access",
    description: "Launched REST API for Teams and Enterprise plans. Full programmatic access to diagram generation.",
    icon: Plus,
  },
]

const getTypeColor = (type: string) => {
  switch (type) {
    case "feature":
      return "bg-blue-600/10 text-blue-700 dark:text-blue-400"
    case "improvement":
      return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
    case "fix":
      return "bg-green-500/10 text-green-600 dark:text-green-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case "feature":
      return "New Feature"
    case "improvement":
      return "Improvement"
    case "fix":
      return "Bug Fix"
    default:
      return type
  }
}

export default function ChangelogPage() {
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
              Changelog
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stay up to date with the latest features, improvements, and fixes.
            </p>
          </div>

          {/* Changelog Timeline */}
          <div className="space-y-8">
            {changelogEntries.map((entry, index) => (
              <div
                key={index}
                className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
                
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${getTypeColor(entry.type)}`}>
                    <entry.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-1">{entry.title}</h3>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm text-muted-foreground">{entry.date}</span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                            v{entry.version}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(entry.type)}`}>
                            {getTypeLabel(entry.type)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{entry.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Subscribe Section */}
          <div className="mt-12 text-center">
            <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
              
              <h2 className="text-2xl font-semibold text-foreground mb-4">Stay Updated</h2>
              <p className="text-muted-foreground mb-6">
                Get notified about new features and updates. Subscribe to our changelog.
              </p>
              <Button variant="gradient">Subscribe to Updates</Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

