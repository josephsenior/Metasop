"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
// Label removed - unused
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth/auth-guard"
// DashboardHeader removed for full-screen design
import { diagramsApi } from "@/lib/api/diagrams"
import { useToast } from "@/components/ui/use-toast"
import {
  Sparkles,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
  Play,
  Save,
  Download
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"
import { GenerationProgress } from "@/components/ui/GenerationProgress"
import { ArtifactsPanel } from "@/components/artifacts/ArtifactsPanel"
import { exampleDiagram } from "@/lib/data/example-diagram"
import type { DiagramNode, DiagramEdge } from "@/types/diagram"
import { motion, AnimatePresence } from "framer-motion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Brain, Cpu, Zap } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function CreateDiagramPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Handle initial prompt from URL
  useEffect(() => {
    const queryPrompt = searchParams.get("prompt")
    if (queryPrompt && !isGenerating && !currentDiagram) {
      const decodedPrompt = decodeURIComponent(queryPrompt)
      setPrompt(decodedPrompt)

      // We need to wait for a tick so handleGenerate uses the latest prompt
      // Or just pass the prompt directly to a new function
    }
  }, [searchParams])

  // Separate effect to trigger generation once prompt is set from URL
  useEffect(() => {
    const queryPrompt = searchParams.get("prompt")
    if (queryPrompt && prompt === decodeURIComponent(queryPrompt) && !isGenerating && !currentDiagram) {
      handleGenerate()
    }
  }, [prompt]) // Trigger when prompt matches URL
  const [includeStateManagement] = useState(true)
  const [includeAPIs] = useState(true)
  const [includeDatabase] = useState(true)
  const [selectedModel, setSelectedModel] = useState("gemini-3-flash-preview")

  // UI State
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)
  const [currentDiagram, setCurrentDiagram] = useState<{
    nodes: DiagramNode[]
    edges: DiagramEdge[]
    id?: string
    title?: string
    description?: string
    isGuest?: boolean
    metadata?: any  // Contains metasop_artifacts, metasop_report, metasop_steps
  } | null>(null)

  // Progress tracking
  const [generationSteps, setGenerationSteps] = useState<Array<{
    step_id: string
    role: string
    status: "pending" | "running" | "success" | "failed"
  }>>([])

  // Agent thoughts and partial artifacts state
  const activeStepIdRef = useRef<string | null>(null)
  const [agentThoughts, setAgentThoughts] = useState<Record<string, string>>({})

  // Track step start times to ensure minimum display duration for running animation
  const stepStartTimesRef = useRef<Map<string, number>>(new Map())
  // Track pending timeouts to clean them up if component unmounts or generation is cancelled
  const pendingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const thoughtScrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll thoughts to bottom
  useEffect(() => {
    if (thoughtScrollRef.current) {
      thoughtScrollRef.current.scrollTop = thoughtScrollRef.current.scrollHeight
    }
  }, [agentThoughts])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      pendingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      pendingTimeoutsRef.current.clear()
      stepStartTimesRef.current.clear()
    }
  }, [])

  // Export functions
  // Export functions removed - unused

  // Load example diagram for prototyping (dev mode)
  const loadExampleDiagram = () => {
    setCurrentDiagram({
      nodes: exampleDiagram.nodes,
      edges: exampleDiagram.edges,
      title: exampleDiagram.title,
      description: exampleDiagram.description,
      isGuest: false,
    })
    setPrompt(exampleDiagram.description)
    toast({
      title: "Example diagram loaded!",
      description: "This is a full example diagram with all agent outputs for UI prototyping.",
      duration: 4000,
    })
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    if (prompt.length < 20) {
      toast({
        title: "Prompt too short",
        description: "Please provide at least 20 characters for better results",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setCurrentDiagram(null) // Clear previous diagram

    // Clear all pending timeouts and reset tracking
    pendingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    pendingTimeoutsRef.current.clear()
    stepStartTimesRef.current.clear()

    // Initialize progress steps based on enabled agents
    const initialSteps: Array<{ step_id: string; role: string; status: "pending" | "running" | "success" | "failed" }> = [
      { step_id: "pm_spec", role: "Product Manager", status: "pending" },
      { step_id: "arch_design", role: "Architect", status: "pending" },
      { step_id: "devops_infrastructure", role: "DevOps", status: "pending" },
      { step_id: "security_architecture", role: "Security", status: "pending" },
      { step_id: "engineer_impl", role: "Engineer", status: "pending" },
      { step_id: "ui_design", role: "UI Designer", status: "pending" },
      { step_id: "qa_verification", role: "QA", status: "pending" },
    ]
    setGenerationSteps(initialSteps)
    console.log("[Frontend] Generation started, initialized", initialSteps.length, "steps")

    try {
      // Don't set first step to running - wait for step_start event from stream
      // This ensures the animation only shows running when the agent actually starts

      const response = await fetch("/api/diagrams/generate?stream=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          options: {
            includeStateManagement,
            includeAPIs,
            includeDatabase,
            model: selectedModel,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")

        // Process all complete lines
        buffer = lines.pop() || "" // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const event = JSON.parse(line)
            console.log("[Frontend] Received event:", event.type, event.step_id || event.role)

            // Handle different event types
            if (event.type === "step_start") {
              console.log("[Frontend] Step starting:", event.step_id, event.role)
              stepStartTimesRef.current.set(event.step_id, Date.now())
              activeStepIdRef.current = event.step_id
              setGenerationSteps(prev => {
                const updated = prev.map(s =>
                  s.step_id === event.step_id ? { ...s, status: "running" as const } : s
                )
                console.log("[Frontend] Updated steps after step_start:", updated.map(s => `${s.step_id}:${s.status}`))
                return updated
              })
            } else if (event.type === "step_thought") {
              const thought = typeof event.thought === 'string' ? event.thought : "";
              console.log("[Frontend] Received step_thought:", event.step_id, thought.substring(0, 50))
              setAgentThoughts(prev => {
                const updated: Record<string, string> = {
                  ...prev,
                  [event.step_id]: (prev[event.step_id as string] || "") + thought
                }
                console.log("[Frontend] Updated agentThoughts, activeStepId:", activeStepIdRef.current, "has thoughts:", !!updated[activeStepIdRef.current || ''])
                return updated
              })
            } else if (event.type === "step_complete") {
              // CRITICAL: Only process step_complete if step was actually started (running)
              // If step is still pending, it means step_start never fired - mark as running first
              setGenerationSteps(prev => {
                const step = prev.find(s => s.step_id === event.step_id)
                if (!step) return prev // Step doesn't exist, ignore

                // If step is still pending, step_start never fired - mark as running first
                if (step.status === "pending") {
                  // Record start time
                  if (!stepStartTimesRef.current.has(event.step_id)) {
                    stepStartTimesRef.current.set(event.step_id, Date.now())
                  }

                  // Mark as running immediately
                  const updated = prev.map(s =>
                    s.step_id === event.step_id ? { ...s, status: "running" as const } : s
                  )

                  // Schedule success after minimum display time (always wait 800ms)
                  const timeoutId = setTimeout(() => {
                    setGenerationSteps(prevSteps => prevSteps.map(s =>
                      s.step_id === event.step_id && s.status === "running"
                        ? { ...s, status: "success" }
                        : s
                    ))
                    stepStartTimesRef.current.delete(event.step_id)
                    pendingTimeoutsRef.current.delete(event.step_id)
                  }, 800)

                  // Clear any existing timeout
                  const existingTimeout = pendingTimeoutsRef.current.get(event.step_id)
                  if (existingTimeout) {
                    clearTimeout(existingTimeout)
                  }
                  pendingTimeoutsRef.current.set(event.step_id, timeoutId)

                  return updated
                }

                // Step is already running - ensure minimum display time
                if (step.status === "running") {
                  const startTime = stepStartTimesRef.current.get(event.step_id) || Date.now()
                  const elapsed = Date.now() - startTime
                  const minDisplayTime = 800 // Minimum 800ms to show running state

                  // Clear any existing timeout
                  const existingTimeout = pendingTimeoutsRef.current.get(event.step_id)
                  if (existingTimeout) {
                    clearTimeout(existingTimeout)
                    pendingTimeoutsRef.current.delete(event.step_id)
                  }

                  if (elapsed < minDisplayTime) {
                    // Delay marking as success to ensure running animation is visible
                    const timeoutId = setTimeout(() => {
                      setGenerationSteps(prevSteps => prevSteps.map(s =>
                        s.step_id === event.step_id && s.status === "running"
                          ? { ...s, status: "success" }
                          : s
                      ))
                      stepStartTimesRef.current.delete(event.step_id)
                      pendingTimeoutsRef.current.delete(event.step_id)
                    }, minDisplayTime - elapsed)
                    pendingTimeoutsRef.current.set(event.step_id, timeoutId)
                    return prev // Keep as running for now
                  } else {
                    // Enough time has passed, mark as success immediately
                    stepStartTimesRef.current.delete(event.step_id)
                    return prev.map(s =>
                      s.step_id === event.step_id && s.status === "running"
                        ? { ...s, status: "success" }
                        : s
                    )
                  }
                }

                // Step is already success or failed - don't change it
                return prev
              })
            } else if (event.type === "step_failed") {
              setGenerationSteps(prev => prev.map(s =>
                s.step_id === event.step_id ? { ...s, status: "failed" } : s
              ))
              toast({
                title: "Step Failed",
                description: `Agent ${event.role} encountered an error: ${event.error}`,
                variant: "destructive"
              })
            } else if (event.type === "orchestration_complete") {
              console.log("[Frontend] Orchestration complete, diagram:", {
                id: event.diagram?.id,
                nodesCount: event.diagram?.nodes?.length || 0,
                edgesCount: event.diagram?.edges?.length || 0,
                hasMetadata: !!event.diagram?.metadata
              })

              const diagram = event.diagram
              const isGuestDiagram = diagram.id.startsWith("guest_") || event.is_guest || false

              if (!diagram.nodes || diagram.nodes.length === 0) {
                console.error("[Frontend] ERROR: Diagram has no nodes!", diagram)
                toast({
                  title: "Generation Warning",
                  description: "Diagram was generated but contains no nodes. Check console for details.",
                  variant: "destructive"
                })
              }

              setCurrentDiagram({
                nodes: diagram.nodes || [],
                edges: diagram.edges || [],
                id: diagram.id,
                title: diagram.title,
                description: diagram.description,
                isGuest: isGuestDiagram,
                metadata: diagram.metadata,  // Contains metasop_artifacts with all agent data
              })

              console.log("[Frontend] Diagram set, nodes:", diagram.nodes?.length || 0, "edges:", diagram.edges?.length || 0)

              if (diagram.id.startsWith("guest_") || isGuestDiagram) {
                const guestDiagrams = JSON.parse(localStorage.getItem("guest_diagrams") || "[]")
                guestDiagrams.push(diagram)
                if (guestDiagrams.length > 5) guestDiagrams.shift()
                localStorage.setItem("guest_diagrams", JSON.stringify(guestDiagrams))
              }

              if (isAuthenticated && !isGuestDiagram) {
                toast({
                  title: "Diagram saved automatically!",
                  description: "Your diagram has been saved. You can view it anytime from your dashboard.",
                  duration: 5000,
                })
              } else {
                toast({
                  title: "Diagram generated!",
                  description: "Your architecture diagram has been generated successfully.",
                })
              }

              // Automatically mark first steps as success if they weren't matched in stream
              // (Keep existing completion logic)

              // CRITICAL: Only mark steps as success if they were actually running
              // Never mark pending steps as success - they must go through running state first
              // This prevents steps from being marked as done without showing the running animation
              setGenerationSteps(prev => prev.map(s => {
                // Only mark as success if it was actually running (meaning it started and completed)
                // This ensures the running animation was visible before completion
                if (s.status === "running") {
                  return { ...s, status: "success" as const }
                }
                // Keep current status - don't change pending or failed steps
                // Pending steps that never started should remain pending
                return s
              }))
              setIsLeftPanelOpen(false)
            } else if (event.type === "orchestration_failed") {
              throw new Error(event.error || "Orchestration failed")
            }
          } catch (e) {
            console.error("Error parsing stream event:", e, line)
          }
        }
      }

    } catch (error: any) {
      // Mark current running step as failed
      setGenerationSteps((prev) =>
        prev.map((step) =>
          step.status === "running" ? { ...step, status: "failed" as const } : step
        )
      )
      toast({
        title: "Error",
        description: error.message || "Failed to generate diagram",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      // Keep steps visible for a moment to show completion
      setTimeout(() => {
        setGenerationSteps([])
      }, 5000)
    }
  }

  const handleSave = async () => {
    if (!currentDiagram || !currentDiagram.nodes || currentDiagram.nodes.length === 0) {
      toast({
        title: "No diagram to save",
        description: "Please generate a diagram first",
        variant: "destructive",
      })
      return
    }

    // If user is not authenticated, prompt them to sign up
    if (!isAuthenticated || currentDiagram.isGuest) {
      toast({
        title: "Sign up to save",
        description: "Please sign up to save your diagrams permanently",
        variant: "default",
      })
      router.push("/register?redirect=/dashboard/create")
      return
    }

    try {
      // If diagram already has an ID (was saved during generation), update it
      if (currentDiagram.id && !currentDiagram.id.startsWith("guest_")) {
        // Update existing diagram
        await diagramsApi.update(currentDiagram.id, {
          nodes: currentDiagram.nodes,
          edges: currentDiagram.edges,
          title: currentDiagram.title || prompt.substring(0, 50),
          description: currentDiagram.description || prompt,
        })

        toast({
          title: "Diagram updated!",
          description: "Your changes have been saved successfully.",
        })

        // Navigate to view page
        router.push(`/dashboard/diagrams/${currentDiagram.id}`)
      } else {
        // This shouldn't happen for authenticated users (diagrams are auto-saved during generation)
        // But handle it as a fallback - create new diagram
        console.warn("[Create Page] Diagram missing ID for authenticated user, creating new diagram")

        const savedDiagram = await diagramsApi.create({
          prompt: prompt || currentDiagram.description || "Architecture diagram",
          options: {
            includeStateManagement,
            includeAPIs,
            includeDatabase,
          },
        })

        // Update with nodes and edges
        await diagramsApi.update(savedDiagram.id, {
          nodes: currentDiagram.nodes,
          edges: currentDiagram.edges,
          title: currentDiagram.title || prompt.substring(0, 50),
          description: currentDiagram.description || prompt,
        })

        // Update local state with new ID
        setCurrentDiagram({
          ...currentDiagram,
          id: savedDiagram.id,
          isGuest: false,
        })

        toast({
          title: "Diagram saved!",
          description: "Your diagram has been saved successfully.",
        })

        // Navigate to view page
        router.push(`/dashboard/diagrams/${savedDiagram.id}`)
      }
    } catch (error: any) {
      console.error("[Create Page] Error saving diagram:", error)
      toast({
        title: "Error saving diagram",
        description: error.response?.data?.message || error.message || "Failed to save diagram. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadSpecs = () => {
    if (!currentDiagram) return

    try {
      const dataStr = JSON.stringify(currentDiagram, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `diagram-specs-${new Date().getTime()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Specs downloaded",
        description: "The diagram specifications have been exported successfully.",
      })
    } catch (err: any) {
      toast({
        title: "Download failed",
        description: err.message || "Failed to export diagram specs.",
        variant: "destructive",
      })
    }
  }

  return (
    <AuthGuard requireAuth={false}>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Top Toolbar */}
        <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 shrink-0 z-50">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link
              href={isAuthenticated ? "/dashboard" : "/"}
              className="flex items-center gap-1 sm:gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <h1 className="text-sm font-semibold text-foreground truncate">Create Diagram</h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {currentDiagram && (
              <>
                {isAuthenticated && currentDiagram.id && !currentDiagram.id.startsWith("guest_") ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/diagrams/${currentDiagram.id}`)}
                          className="gap-1 sm:gap-2"
                        >
                          <Save className="h-4 w-4" />
                          <span className="hidden sm:inline">View Saved</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Diagram is saved. Click to view <Kbd>V</Kbd>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSave}
                          className="gap-1 sm:gap-2"
                          disabled={!isAuthenticated || currentDiagram.isGuest}
                        >
                          <Save className="h-4 w-4" />
                          <span className="hidden sm:inline">
                            {isAuthenticated ? "Save Changes" : "Save"}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isAuthenticated
                          ? "Save changes to diagram"
                          : "Sign up to save diagrams"}
                        {" "}
                        <Kbd>S</Kbd>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            )}

            {currentDiagram && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadSpecs}
                      className="gap-1 sm:gap-2 border-dashed"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Download Specs</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Download diagram JSON specs <Kbd>D</Kbd>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar - Creation Panel */}
          <AnimatePresence>
            {isLeftPanelOpen && (
              <motion.div
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full sm:w-80 border-r border-border bg-card/95 backdrop-blur-sm flex flex-col shrink-0 z-40 shadow-lg"
              >
                <div className="p-4 border-b border-border flex items-center justify-between bg-linear-to-r from-blue-600/5 to-purple-600/5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-sm font-semibold text-foreground">Create Diagram</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLeftPanelOpen(false)}
                    className="h-7 w-7 p-0 hover:bg-accent"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Dev Mode - Load Example Diagram */}
                  {(process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEV_MODE === "true") && (
                    <Alert className="border-purple-600/30 bg-purple-600/10">
                      <Sparkles className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                      <AlertDescription className="text-xs">
                        <span className="font-medium">Dev Mode:</span> Load example diagram for UI prototyping without API calls.{" "}
                        <Button
                          variant="link"
                          size="sm"
                          onClick={loadExampleDiagram}
                          className="h-auto p-0 text-xs underline"
                        >
                          Load Example
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Dev Mode - Load Example Diagram */}
                  {(process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEV_MODE === "true") && (
                    <Alert className="border-purple-600/30 bg-purple-600/10 mb-4">
                      <Sparkles className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                      <AlertDescription className="text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-medium">Dev Mode:</span> Load example diagram for UI prototyping without API calls.
                          </div>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={loadExampleDiagram}
                            className="h-auto p-0 text-xs underline shrink-0"
                          >
                            Load Example
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Guest user notice */}
                  {!isAuthenticated && (
                    <Alert className="border-blue-600/30 bg-blue-600/10">
                      <AlertCircle className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                      <AlertDescription className="text-xs">
                        <span className="font-medium">Guest mode.</span> Create up to 2 diagrams.{" "}
                        <Link href="/register" className="underline hover:no-underline font-medium">
                          Sign up
                        </Link>{" "}
                        for unlimited access.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-sm font-semibold">Quick Start</h3>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        Recommended
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto py-2"
                        onClick={() => setPrompt("Create a microservices architecture for an e-commerce platform with search, cart, and payment services.")}
                      >
                        E-commerce Microservices
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto py-2"
                        onClick={() => setPrompt("Design a serverless data pipeline for real-time analytics using AWS Lambda, S3, and Kinesis.")}
                      >
                        Serverless Data Pipeline
                      </Button>
                    </div>
                    <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                        💡 Pro Tip
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Be specific about your tech stack and requirements for better results.
                      </p>
                    </div>
                  </div>



                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Button for Left Panel */}
          {!isLeftPanelOpen && (
            <button
              onClick={() => setIsLeftPanelOpen(true)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-card border border-border border-l-0 rounded-r-lg p-2 shadow-lg hover:bg-accent transition-colors"
              aria-label="Open creation panel"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {/* Center Canvas - React Flow */}
          <div className="flex-1 relative bg-background flex flex-col min-h-0">
            {/* Progress Bar at Top */}
            {isGenerating && generationSteps.length > 0 && (
              <div className="absolute top-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-md border-b border-border shadow-lg">
                <div className="p-4">
                  <GenerationProgress steps={generationSteps} />
                </div>
                {/* Helpful tips while generating */}
                <div className="px-4 pb-3 border-t border-border/50 pt-3 flex items-center justify-between">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <p>
                      <span className="font-medium text-foreground">Tip:</span> Our AI agents are working together. You can see their reasoning below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content Area - with padding bottom for chat input */}
            <div className="flex-1 overflow-hidden" style={{ paddingBottom: '100px' }}>
              {currentDiagram && currentDiagram.metadata?.metasop_artifacts ? (
                <div className="h-full" style={{ marginTop: isGenerating && generationSteps.length > 0 ? '180px' : '0' }}>
                  <ArtifactsPanel
                    diagramId={currentDiagram.id || ""}
                    artifacts={currentDiagram.metadata.metasop_artifacts}
                    steps={currentDiagram.metadata.metasop_steps}
                    className="h-full"
                  />
                </div>
              ) : currentDiagram && (!currentDiagram.nodes || currentDiagram.nodes.length === 0) ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-5 max-w-lg px-6"
                  >
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-yellow-500/10 dark:bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                      <AlertCircle className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Diagram Generated but Empty
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-1">
                        The diagram was created but no nodes were generated. This might happen if the prompt was too vague or the AI couldn't extract enough information.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        💡 Try being more specific about features, technologies, or architecture patterns.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button
                        onClick={() => handleGenerate()}
                        variant="default"
                        size="lg"
                        className="gap-2"
                      >
                        <Play className="h-4 w-4" />
                        Try Again
                      </Button>
                      <Button
                        onClick={() => setIsLeftPanelOpen(true)}
                        variant="outline"
                        size="lg"
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Edit Prompt
                      </Button>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-background">
                  <div className="text-center space-y-6 max-w-lg px-6">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="w-20 h-20 mx-auto rounded-2xl bg-linear-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-blue-600/30"
                    >
                      <Sparkles className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </motion.div>
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        Create Your Architecture Diagram
                      </h3>
                      <p className="text-base text-muted-foreground leading-relaxed mb-2">
                        Describe your application in plain English, and our AI-powered multi-agent system will generate a comprehensive architecture diagram for you.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ✨ No technical knowledge required • ⚡ Generated in minutes
                      </p>
                    </motion.div>
                  </div>
                </div>
              )}
            </div>

            {/* Simple Input Area - Fixed at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-40 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <Textarea
                    id="prompt"
                    placeholder="Describe your application..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[50px] max-h-[150px] resize-none text-sm pr-40 sm:pr-48"
                    disabled={isGenerating}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (prompt.trim().length >= 20 && !isGenerating) {
                          handleGenerate()
                        }
                      }
                    }}
                  />
                  <div className="absolute bottom-2 right-2 flex items-center gap-4">
                    {/* Model Selector */}
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-8 w-[130px] sm:w-[150px] bg-background/50 backdrop-blur-md border border-white/10 hover:bg-white/5 transition-all duration-300 gap-2 text-[10px] font-medium opacity-80 hover:opacity-100 shadow-sm rounded-lg">
                        <Brain className="h-3 w-3 text-blue-500" />
                        <SelectValue placeholder="Model" />
                      </SelectTrigger>
                      <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50">
                        <SelectItem value="gemini-3-flash-preview" className="text-[10px] cursor-pointer focus:bg-white/10 hover:bg-white/5">
                          <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3 text-amber-500" />
                            <span>Gemini 3 Flash</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="gemini-3-pro" className="text-[10px] cursor-pointer focus:bg-white/10 hover:bg-white/5">
                          <div className="flex items-center gap-2">
                            <Cpu className="h-3 w-3 text-purple-500" />
                            <span>Gemini 3 Pro</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground mr-1">
                        {prompt.length}/20
                      </span>
                      <Button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || prompt.length < 20 || isGenerating}
                        size="sm"
                        className="h-8 px-4 shrink-0 transition-all duration-300 flex items-center gap-2 bg-white text-black hover:bg-white/90 border-0 shadow-sm font-bold"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs">Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            <span className="text-xs">Generate</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
