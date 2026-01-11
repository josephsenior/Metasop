"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowRight, Sparkles, LayoutGrid } from "lucide-react"
import { HeroAgentDiagram } from "./hero-agent-diagram"

export function Hero() {
  const router = useRouter()
  const [heroPrompt, setHeroPrompt] = useState("")

  const handleStartGenerating = () => {
    if (!heroPrompt.trim()) return
    router.push(`/dashboard/create?prompt=${encodeURIComponent(heroPrompt.trim())}`)
  }

  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 via-cyan-500/5 to-blue-600/10 animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.1),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="max-w-2xl text-left">
            {/* Badge */}
            <Badge variant="outline" className="mb-6 inline-flex items-center gap-2 bg-blue-600/10 dark:bg-blue-600/10 border-blue-600/30 dark:border-blue-600/30">
              <Sparkles className="h-3 w-3 text-blue-700 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-400">Used by 10,000+ developers</span>
            </Badge>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground text-balance text-left max-w-2xl">
              Describe Your App → Get Professional{" "}
              <span className="gradient-primary-text">
                Architecture Diagrams
              </span>{" "}
              in Seconds
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Transform your app ideas into visual architecture diagrams using AI-powered multi-agent planning.
              Save hours of planning time and visualize before you code.
            </p>

            {/* Main Interaction - Prompt Input */}
            <div className="mt-10 space-y-4">
              <div className="relative max-w-xl group">
                <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000 group-focus-within:duration-200"></div>
                <div className="relative flex items-center">
                  <Input
                    placeholder="Describe your app idea (e.g. 'A SaaS for crypto traders')..."
                    className="h-14 sm:h-16 pl-6 pr-32 sm:pr-40 text-base rounded-2xl border-border/50 bg-card/80 backdrop-blur-xl focus-visible:ring-blue-500/20 shadow-xl"
                    value={heroPrompt}
                    onChange={(e) => setHeroPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleStartGenerating()
                      }
                    }}
                  />
                  <Button
                    className="absolute right-1.5 h-11 sm:h-13 px-6 rounded-xl gradient-primary border-0 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    onClick={handleStartGenerating}
                    disabled={!heroPrompt.trim()}
                  >
                    Generate
                    <ArrowRight className="h-4 w-4 ml-2 hidden sm:inline" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                <Link
                  href="/dashboard/diagrams"
                  className="text-sm font-semibold text-muted-foreground hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                >
                  <LayoutGrid className="h-4 w-4" />
                  View Examples
                </Link>
                <Link
                  href="/dashboard/create"
                  className="text-sm font-semibold text-muted-foreground hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Try Blank Canvas
                </Link>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">✨ No credit card required • ⚡ Generate in 10 seconds</p>
          </div>

          <div className="relative lg:pl-8 w-full">
            {/* Glassmorphic card with animated diagram generation */}
            <div className="relative rounded-2xl border border-border/40 bg-card/60 backdrop-blur-3xl p-4 md:p-6 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-chart-4/60" />
                <div className="h-3 w-3 rounded-full bg-chart-2/60" />
              </div>
              <div className="space-y-4">
                {/* Animated Multi-Agent Diagram */}
                <HeroAgentDiagram />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Generated in</span>
                  <span className="font-semibold text-foreground">~3 seconds</span>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -z-10 -top-4 -right-4 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl" />
            <div className="absolute -z-10 -bottom-4 -left-4 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
