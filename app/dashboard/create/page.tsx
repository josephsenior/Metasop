"use client"

import { useState, useEffect, useRef, Suspense } from "react"
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
  Download,
  FileText,
  Paperclip
} from "lucide-react"
import { generateAgentContextMarkdown } from "@/lib/metasop/utils/export-context"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"
import { GenerationProgress } from "@/components/ui/GenerationProgress"
import { ArtifactsPanel } from "@/components/artifacts/ArtifactsPanel"
import type { DiagramNode, DiagramEdge } from "@/types/diagram"
import { motion, AnimatePresence } from "framer-motion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Brain, Cpu, Zap, Search, Tag, Palette } from "lucide-react"
import { promptTemplates, templateCategories } from "@/lib/data/prompt-templates"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { VoiceInputButton } from "@/components/ui/voice-input-button"

import { ProjectChatPanel } from "@/components/chat/ProjectChatPanel"
import { MessageSquare } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export const dynamic = 'force-dynamic'

function CreateDiagramContent() {
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

  const [includeStateManagement] = useState(true)
  const [includeAPIs] = useState(true)
  const [includeDatabase] = useState(true)
  const [selectedModel, setSelectedModel] = useState("gemini-3-flash-preview")
  const [isReasoningEnabled, setIsReasoningEnabled] = useState(false)
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  // Document upload state
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // UI State
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)
  const [activeArtifactTab, setActiveArtifactTab] = useState("summary")
  const [isChatOpen] = useState(true)
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const content = event.target?.result as string
        const newDoc = {
          name: file.name,
          type: file.name.split('.').pop() || 'txt',
          content: content,
        }
        
        setUploadedDocuments(prev => [...prev, newDoc])
        toast({
          title: "Document Added",
          description: `${file.name} will be used as context for generation.`,
        })
        setIsUploading(false)
      }
      reader.readAsText(file)
    } catch (error: any) {
      setIsUploading(false)
      toast({
        title: "File Error",
        description: "Failed to read the file.",
        variant: "destructive",
      })
    }
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
            reasoning: isReasoningEnabled,
          },
          documents: uploadedDocuments,
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

  const handleExportContext = () => {
    if (!currentDiagram) return

    try {
      const markdown = generateAgentContextMarkdown(currentDiagram)
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `agent-context-${currentDiagram.title?.toLowerCase().replace(/\s+/g, '-') || 'project'}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Agent Context exported",
        description: "Document optimized for AI coding assistants has been downloaded.",
      })
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err.message || "Failed to export agent context.",
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
              <div className="flex items-center gap-1.5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportContext}
                        className="gap-1 sm:gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-400/10"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Export Context</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Export for AI Coding Assistants <Kbd>E</Kbd>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

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
              </div>
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

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-sm font-semibold">Templates</h3>
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                        {promptTemplates.length} Available
                      </Badge>
                    </div>

                    {/* Category Filter */}
                    <ScrollArea className="w-full whitespace-nowrap pb-4" type="always">
                      <div className="flex gap-1.5">
                        {templateCategories.map((category) => (
                          <Button
                            key={category}
                            variant={activeCategory === category ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveCategory(category)}
                            className={`h-7 px-3 text-[10px] rounded-full transition-all duration-300 ${activeCategory === category
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                              : "hover:bg-blue-50 hover:text-blue-600 border-border/50"
                              }`}
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>

                    {/* Search Templates */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-[11px] bg-background/50 border-border/50 focus-visible:ring-blue-500/30"
                      />
                    </div>

                    {/* Template List */}
                    <div className="grid grid-cols-1 gap-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                      {promptTemplates
                        .filter(t => (activeCategory === "All" || t.category === activeCategory) &&
                          (t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.description.toLowerCase().includes(searchQuery.toLowerCase())))
                        .map((template) => (
                          <motion.button
                            key={template.id}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setPrompt(template.prompt)}
                            className="group text-left p-3 rounded-xl border border-border/50 bg-card hover:border-blue-500/30 hover:bg-linear-to-br hover:from-blue-500/2 hover:to-purple-500/2 transition-all duration-300 shadow-sm hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <h4 className="text-[11px] font-bold text-foreground group-hover:text-blue-600 transition-colors">
                                {template.title}
                              </h4>
                              <div className="p-1 rounded-md bg-muted/50 group-hover:bg-blue-500/10 group-hover:text-blue-600 transition-colors">
                                <Tag className="h-3 w-3" />
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-2 group-hover:text-muted-foreground/80 transition-colors">
                              {template.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {template.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground group-hover:bg-blue-500/5 group-hover:text-blue-600/70 transition-colors">
                                  {tag}
                                </span>
                              ))}
                              {template.tags.length > 3 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground/50">
                                  +{template.tags.length - 3}
                                </span>
                              )}
                            </div>
                          </motion.button>
                        ))}
                    </div>

                    <div className="p-3 rounded-xl border border-blue-500/20 bg-linear-to-br from-blue-500/5 to-purple-500/5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Brain className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <p className="text-[11px] text-blue-700 dark:text-blue-300 font-bold">
                          Pro Tip
                        </p>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Templates provide a solid foundation. You can always refine the generated diagram by giving specific instructions at the bottom.
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
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-hidden" style={{ paddingTop: isGenerating && generationSteps.length > 0 ? '180px' : '0' }}>
                  {currentDiagram && currentDiagram.metadata?.metasop_artifacts ? (
                    <div className="h-full">
                      <ArtifactsPanel
                        diagramId={currentDiagram.id || ""}
                        artifacts={currentDiagram.metadata.metasop_artifacts}
                        steps={currentDiagram.metadata.metasop_steps}
                        className="h-full"
                        activeTab={activeArtifactTab}
                        onTabChange={setActiveArtifactTab}
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

                {/* Simple Input Area - Only show if NO diagram or left panel open */}
                {(!currentDiagram || isLeftPanelOpen) && (
                  <div className="absolute bottom-0 left-0 right-0 z-40 p-4">
                    <div className="max-w-4xl mx-auto">
                      <div className="relative">
                        <Textarea
                          id="prompt"
                          placeholder="Describe your application..."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="min-h-[50px] max-h-[150px] resize-none text-sm pl-60 sm:pl-72 pr-40 sm:pr-48 shadow-xl"
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
                        {/* Model Selector - Left Side */}
                        <div className="absolute bottom-2 left-2 z-50 flex items-center bg-background/50 backdrop-blur-md border border-white/10 rounded-lg shadow-sm hover:bg-white/5 transition-all duration-300 divide-x divide-white/10">
                          {/* Model Selector Section */}
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="h-8 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 gap-2 text-[10px] font-medium opacity-80 hover:opacity-100 rounded-none rounded-l-lg px-3">
                              <SelectValue placeholder="Model" />
                            </SelectTrigger>
                            <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50">
                              <SelectItem value="gemini-3-flash-preview" className="text-[10px] cursor-pointer focus:bg-white/10 hover:bg-white/5">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-3 w-3 text-amber-500" />
                                  <span>Gemini 3 Flash</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="gemini-3-pro-preview" className="text-[10px] cursor-pointer focus:bg-white/10 hover:bg-white/5">
                                <div className="flex items-center gap-2">
                                  <Cpu className="h-3 w-3 text-purple-500" />
                                  <span>Gemini 3 Pro</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Thinking Toggle Section */}
                          <div className="flex items-center gap-2 px-3 h-8">
                            <Switch
                              id="reasoning-mode"
                              checked={isReasoningEnabled}
                              onCheckedChange={setIsReasoningEnabled}
                              className="scale-75 data-[state=checked]:bg-blue-600"
                            />
                            <Label
                              htmlFor="reasoning-mode"
                              className="text-[10px] font-medium text-muted-foreground cursor-pointer select-none flex items-center gap-1.5"
                            >
                              Thinking
                              {isReasoningEnabled && (
                                <Brain className="h-3 w-3 text-blue-500 animate-pulse" />
                              )}
                            </Label>
                          </div>
                        </div>

                        <div className="absolute bottom-2 right-2 flex items-center gap-3">
                          {uploadedDocuments.length > 0 && (
                            <div className="flex items-center gap-1.5 mr-2">
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] py-0 h-6">
                                {uploadedDocuments.length} docs
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => setUploadedDocuments([])}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-lg border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isGenerating || isUploading}
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Paperclip className="h-4 w-4" />
                            )}
                          </Button>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".txt,.md,.json,.csv,.pdf"
                            onChange={handleFileChange}
                          />
                          <VoiceInputButton 
                            onTranscription={(text) => setPrompt(prev => prev + (prev ? " " : "") + text)}
                            disabled={isGenerating}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-lg border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                          />
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
                )}
              </div>

              {/* Desktop Chat Panel */}
              {currentDiagram && currentDiagram.metadata?.metasop_artifacts && isChatOpen && (
                <div className="hidden lg:block w-96 shrink-0 border-l border-border bg-card/50 backdrop-blur-sm h-full relative z-40">
                  <ProjectChatPanel
                    diagramId={currentDiagram.id || ""}
                    artifacts={currentDiagram.metadata.metasop_artifacts}
                    activeTab={activeArtifactTab}
                  />
                </div>
              )}
            </div>

            {/* Mobile Chat Sheet */}
            {currentDiagram && currentDiagram.metadata?.metasop_artifacts && (
              <div className="lg:hidden fixed bottom-6 right-6 z-50">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 text-white">
                      <MessageSquare className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="p-0 w-[90%] sm:w-[400px]">
                    <ProjectChatPanel
                      diagramId={currentDiagram.id || ""}
                      artifacts={currentDiagram.metadata.metasop_artifacts}
                      activeTab={activeArtifactTab}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard >
  )
}

export default function CreateDiagramPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <CreateDiagramContent />
    </Suspense>
  )
}
