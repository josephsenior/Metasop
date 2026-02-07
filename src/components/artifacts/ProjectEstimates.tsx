"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp,
  Server,
  Code,
  Shield,
  Palette,
  CheckCircle,
  BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { EstimatesGenerator } from "@/lib/artifacts/estimates-generator"

interface ProjectEstimatesProps {
  diagram?: any
  artifacts?: any
  className?: string
}

export default function ProjectEstimates({ diagram, artifacts, className }: ProjectEstimatesProps) {
  const generator = new EstimatesGenerator(diagram || artifacts)
  const devEstimate = generator.calculateDevelopmentEstimate()
  const costEstimate = generator.calculateCostEstimate(devEstimate)
  const complexity = generator.calculateComplexity()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 rounded-xl p-6 border border-primary/10">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Project Execution Estimates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Derived from architecture analysis and artifact complexity.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn(
            "px-3 py-1 text-xs font-bold uppercase",
            complexity.level === "simple" ? "text-green-600 border-green-200 bg-green-50" :
            complexity.level === "moderate" ? "text-blue-600 border-blue-200 bg-blue-50" :
            complexity.level === "complex" ? "text-orange-600 border-orange-200 bg-orange-50" :
            "text-red-600 border-red-200 bg-red-50"
          )}>
            Complexity: {complexity.level}
          </Badge>
          <div className="text-xs font-mono bg-background px-2 py-1 rounded border shadow-sm">
            Score: {complexity.score}/10
          </div>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Development Time Card */}
        <motion.div variants={item}>
          <Card className="h-full border-blue-100 dark:border-blue-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-600">
                <Clock className="h-4 w-4" />
                Workload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devEstimate.totalHours} hrs</div>
              <p className="text-[10px] text-muted-foreground mt-1">Total estimated effort</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Days:</span>
                  <span className="font-semibold">{devEstimate.totalDays}</span>
                </div>
                <div className="w-full bg-blue-100 dark:bg-blue-900/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Recommendation Card */}
        <motion.div variants={item}>
          <Card className="h-full border-purple-100 dark:border-purple-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-purple-600">
                <Users className="h-4 w-4" />
                Team Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devEstimate.recommendedTeamSize} Devs</div>
              <p className="text-[10px] text-muted-foreground mt-1">Recommended for parallelization</p>
              <div className="mt-4 flex -space-x-2">
                {[...Array(devEstimate.recommendedTeamSize)].map((_, i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-purple-100 border-2 border-background flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Timeline Card */}
        <motion.div variants={item}>
          <Card className="h-full border-green-100 dark:border-green-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-600">
                <Calendar className="h-4 w-4" />
                Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devEstimate.timeline} Weeks</div>
              <p className="text-[10px] text-muted-foreground mt-1">Estimated time-to-market</p>
              <div className="mt-4 bg-green-50 dark:bg-green-900/10 p-2 rounded text-[10px] font-medium text-green-700 dark:text-green-400">
                 Fastest delivery with {devEstimate.recommendedTeamSize} devs
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cost Summary Card */}
        <motion.div variants={item}>
          <Card className="h-full border-orange-100 dark:border-orange-900/30 bg-orange-50/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-600">
                <DollarSign className="h-4 w-4" />
                Budget (Year 1)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">${costEstimate.totalFirstYear.toLocaleString()}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Dev + Ops + 3rd Party</p>
              <div className="mt-3 inline-flex items-center gap-1 text-[10px] text-orange-600 font-bold bg-orange-100 px-1.5 py-0.5 rounded">
                <TrendingUp className="h-3 w-3" />
                ESTIMATED
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Effort Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Effort Breakdown (Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Planning & Requirements", hours: devEstimate.breakdown.planning, icon: BarChart3, color: "bg-blue-500" },
                { label: "Architecture & Design", hours: devEstimate.breakdown.architecture, icon: Shield, color: "bg-purple-500" },
                { label: "Implementation & Coding", hours: devEstimate.breakdown.development, icon: Code, color: "bg-orange-500" },
                { label: "UI/UX Design", hours: devEstimate.breakdown.uiDesign, icon: Palette, color: "bg-pink-500" },
                { label: "QA & Verification", hours: devEstimate.breakdown.testing, icon: CheckCircle, color: "bg-teal-500" },
                { label: "Deployment & Infra", hours: devEstimate.breakdown.deployment, icon: Server, color: "bg-green-500" },
              ].map((phase, i) => {
                const percentage = Math.round((phase.hours / devEstimate.totalHours) * 100)
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <phase.icon className="h-3 w-3 text-muted-foreground" />
                        <span>{phase.label}</span>
                      </div>
                      <div className="font-mono">
                        <span className="font-bold">{phase.hours}h</span>
                        <span className="text-muted-foreground ml-1">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                        className={cn("h-full rounded-full", phase.color)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Operational Costs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-3">Development</div>
              <div className="flex justify-between items-end">
                <div className="text-xs text-muted-foreground">Investment</div>
                <div className="text-lg font-bold">${costEstimate.development.total.toLocaleString()}</div>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Rate: ${costEstimate.development.hourlyRate}/hr</span>
                <span>One-time cost</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-3">Cloud Infrastructure</div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Monthly Average</span>
                  <span className="font-bold">${costEstimate.infrastructure.monthly}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Third-party SaaS</span>
                  <span className="font-bold">${costEstimate.thirdParty.monthly}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-3">Provider Estimates (Yearly)</div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-2 rounded text-center border border-blue-100 dark:border-blue-900/30">
                  <div className="text-[8px] font-bold text-blue-600 uppercase">AWS</div>
                  <div className="text-[10px] font-bold mt-1">${costEstimate.breakdown.aws}</div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-2 rounded text-center border border-indigo-100 dark:border-indigo-900/30">
                  <div className="text-[8px] font-bold text-indigo-600 uppercase">Azure</div>
                  <div className="text-[10px] font-bold mt-1">${costEstimate.breakdown.azure}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded text-center border border-red-100 dark:border-red-900/30">
                  <div className="text-[8px] font-bold text-red-600 uppercase">GCP</div>
                  <div className="text-[10px] font-bold mt-1">${costEstimate.breakdown.gcp}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
