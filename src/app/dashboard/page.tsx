"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { useAuth } from "@/contexts/auth-context"
import { FloatingCreateButton } from "@/components/layout/floating-create-button"
import { diagramsApi } from "@/lib/api/diagrams"
import type { Diagram } from "@/types/diagram"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, FileText, Clock, TrendingUp, Sparkles, Zap, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { StatusBadge } from "@/components/ui/status-badge"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  useAuth() // guest-only: auth context for compatibility
  const { toast } = useToast()
  const [greeting, setGreeting] = useState("")
  const [recentDiagrams, setRecentDiagrams] = useState<Diagram[]>([])
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    avgGeneration: "0s",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 18) setGreeting("Good afternoon")
    else setGreeting("Good evening")
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      // Fetch more diagrams for accurate stats calculation
      const result = await diagramsApi.getAll({ limit: 50 })
      
      // Get recent diagrams (just take the first 3)
      setRecentDiagrams(result.diagrams.slice(0, 3))

      // Calculate stats
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      // Calculate This Month count correctly
      const thisMonthCount = result.diagrams.filter(
        (d) => new Date(d.createdAt) >= startOfMonth
      ).length

      // Calculate Average Generation Time across all diagrams for more stability
      const validGenerations = result.diagrams
        .filter((d) => d.status === "completed")
        .map((d) => {
          const start = new Date(d.createdAt).getTime()
          // Prefer metadata.generated_at if it exists, otherwise use updatedAt
          const metadata = d.metadata as any
          const endStr = metadata?.generated_at || d.updatedAt
          const end = new Date(endStr).getTime()
          const diff = end - start
          
          // Filter out negative values and extreme outliers (> 30 minutes)
          // Real generations usually take 45s to 3m.
          const MAX_WAIT_MS = 30 * 60 * 1000
          if (diff > 0 && diff < MAX_WAIT_MS) {
            return diff
          }
          return null
        })
        .filter((diff): diff is number => diff !== null)

      const avgTimeSeconds = validGenerations.length > 0
        ? (validGenerations.reduce((acc, diff) => acc + diff, 0) / validGenerations.length) / 1000
        : 0

      // Format average generation time nicely (s or m)
      let displayAvg = "0s"
      if (avgTimeSeconds > 0) {
        if (avgTimeSeconds < 60) {
          displayAvg = `${avgTimeSeconds.toFixed(1)}s`
        } else {
          const mins = avgTimeSeconds / 60
          displayAvg = `${mins.toFixed(1)}m`
        }
      }

      setStats({
        total: result.total,
        thisMonth: thisMonthCount,
        avgGeneration: displayAvg,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const userName = "there" // guest-only: no user name

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  const avgGenTimeValue = stats.avgGeneration.includes('m') 
    ? parseFloat(stats.avgGeneration) * 60 
    : parseFloat(stats.avgGeneration)
  
  // A reasonable "fast" baseline for complex architecting is < 60s
  const isFasterThanAverage = avgGenTimeValue > 0 && avgGenTimeValue < 60

  const statsData = [
    { label: "Total Diagrams", value: stats.total.toString(), icon: FileText, change: `+${stats.thisMonth} this month`, trend: "up" as const },
    { label: "This Month", value: stats.thisMonth.toString(), icon: TrendingUp, change: "Keep creating!", trend: "up" as const },
    { 
      label: "Avg. Generation", 
      value: stats.avgGeneration, 
      icon: Clock, 
      change: avgGenTimeValue === 0 ? "No data yet" : isFasterThanAverage ? "Faster than average" : "On par with average", 
      trend: isFasterThanAverage ? "down" as const : "up" as const 
    },
  ]

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-background">
        <DashboardHeader />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Session notice */}
        <Alert className="border-blue-600/30 bg-blue-600/10 mb-8">
          <AlertCircle className="h-4 w-4 text-blue-700 dark:text-blue-400" />
          <AlertDescription className="text-sm">
            <span className="font-medium">Local storage.</span> Your diagrams are saved to your device and persist across sessions.
          </AlertDescription>
        </Alert>

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                {greeting}, {userName.split(" ")[0]}! 👋
              </h1>
              <p className="text-muted-foreground">Create and manage your architectural diagrams</p>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="mb-8">
          <Link href="/dashboard/create">
            <Button size="lg" variant="gradient">
              <Plus className="h-5 w-5" />
              Create Diagram
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="border-border bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))
          ) : (
            statsData.map((stat, index) => (
            <Card key={index} className="border-border bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <div className={`p-2 rounded-lg ${
                  stat.trend === "up" ? "bg-green-500/10 text-green-700 dark:text-green-400" :
                  stat.trend === "down" ? "bg-blue-500/10 text-blue-700 dark:text-blue-400" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <p className={`text-xs flex items-center gap-1 ${
                  stat.trend === "up" ? "text-green-700 dark:text-green-400" :
                  stat.trend === "down" ? "text-blue-700 dark:text-blue-400" :
                  "text-muted-foreground"
                }`}>
                  {stat.change}
                </p>
              </CardContent>
            </Card>
            ))
          )}
        </div>

        {/* Recent Diagrams */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Recent Diagrams</CardTitle>
                <CardDescription>Your recently created architecture diagrams</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : recentDiagrams.length > 0 ? (
                  <div className="space-y-4">
                    {recentDiagrams.map((diagram) => (
                      <Link
                        key={diagram.id}
                        href={`/dashboard/diagrams/${diagram.id}`}
                        className="block p-4 rounded-lg border border-border hover:bg-accent hover:border-blue-600/20 dark:hover:border-blue-400/20 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                              {diagram.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{diagram.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                {formatTimeAgo(diagram.updatedAt)}
                              </span>
                              <StatusBadge status={diagram.status as "completed" | "processing" | "failed" | "pending"} />
                            </div>
                          </div>
                          <Sparkles className="h-5 w-5 text-muted-foreground group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Empty>
                    <EmptyMedia variant="icon">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>No diagrams yet</EmptyTitle>
                      <EmptyDescription>Get started by creating your first architecture diagram</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button size="sm" variant="gradient" asChild>
                        <Link href="/dashboard/create">
                          <Plus className="h-4 w-4" />
                          Create Your First Diagram
                        </Link>
                      </Button>
                    </EmptyContent>
                  </Empty>
                )}
                <div className="mt-6">
                  <Link href="/dashboard/diagrams">
                    <Button variant="outline" className="w-full border-border hover:bg-accent hover:text-accent-foreground">
                      View All Diagrams
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Tips & Actions */}
          <div className="space-y-6">
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/create">
                  <Button variant="outline" className="w-full justify-start gap-2 border-border hover:bg-accent hover:text-accent-foreground">
                    <Zap className="h-4 w-4" />
                    Create Diagram
                  </Button>
                </Link>
                <Link href="/dashboard/diagrams">
                  <Button variant="outline" className="w-full justify-start gap-2 border-border hover:bg-accent hover:text-accent-foreground">
                    <FileText className="h-4 w-4" />
                    View All Diagrams
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
                <CardDescription>Get the most out of Blueprinta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-blue-600/10 border border-blue-600/20">
                  <p className="text-sm text-foreground font-medium mb-1">Be Specific</p>
                  <p className="text-xs text-muted-foreground">
                    Include details about features, tech stack, and requirements for better results.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-sm text-foreground font-medium mb-1">Export Options</p>
                  <p className="text-xs text-muted-foreground">
                    Export diagrams as JSON, PNG, or SVG for documentation and presentations.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-600/10 border border-blue-600/20">
                  <p className="text-sm text-foreground font-medium mb-1">Iterate & Refine</p>
                  <p className="text-xs text-muted-foreground">
                    Generate multiple versions and refine your architecture with Blueprinta.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <FloatingCreateButton />
      </div>
    </AuthGuard>
  )
}

