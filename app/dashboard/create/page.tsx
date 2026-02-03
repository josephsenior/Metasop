"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
  Paperclip,
  User,
  Layers,
  Server,
  Shield,
  Palette,
  Code,
  CheckCircle2,
  MoreHorizontal,
  MoreVertical,
  PanelLeft,
  PanelRight,
  MessageSquare,
  Brain,
  Cpu,
  Zap,
  Search,
  Tag,
  HelpCircle,
  Plus,
  Monitor,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { generateAgentContextMarkdown } from "@/lib/metasop/utils/export-context"
import { fetchDiagramApi } from "@/lib/api/diagram-fetch"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"
import { GenerationProgress } from "@/components/ui/GenerationProgress"
import { ArtifactsPanel } from "@/components/artifacts/ArtifactsPanel"
import { motion, AnimatePresence } from "framer-motion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { promptTemplates, templateCategories } from "@/lib/data/prompt-templates"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { VoiceInputButton } from "@/components/ui/voice-input-button"

import { ProjectChatPanel } from "@/components/chat/ProjectChatPanel"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const dynamic = 'force-dynamic'

/** Hero-style diagram: grid positions (col, row) -> (x, y). Order: PM, ARCH, Security, DevOps, UI, Engineer, QA. Larger spacing = longer edges. */
const PIPELINE_GRID = { W: 380, H: 400, GRID_X: [50, 190, 330], GRID_Y: [50, 195, 340], bend: 72 }
// QA edge: smooth curve Engineer (right) → QA (bottom-left); control points stay in bounds (no negative x)
const QA_EDGE_MID_Y = (PIPELINE_GRID.GRID_Y[1] + PIPELINE_GRID.GRID_Y[2]) / 2
const PIPELINE_STEP_IDS = ["pm_spec", "arch_design", "security_architecture", "devops_infrastructure", "ui_design", "engineer_impl", "qa_verification"] as const
// Middle row (indices 3,4,5) strictly left→right: DevOps, UI, Engineer — path and visual order match
const PIPELINE_POSITIONS: { col: number; row: number }[] = [
  { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 },
  { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 },
  { col: 0, row: 2 },
]
const PIPELINE_POINTS = PIPELINE_POSITIONS.map(({ col, row }) => ({
  x: PIPELINE_GRID.GRID_X[col],
  y: PIPELINE_GRID.GRID_Y[row],
}))

const AGENT_NODE_CONFIG: Record<string, { label: string; icon: typeof User; borderClass: string; color: string; bg: string }> = {
  pm_spec: { label: "PM", icon: User, borderClass: "border-purple-500/70", color: "text-purple-400", bg: "bg-purple-500/10" },
  arch_design: { label: "ARCH", icon: Layers, borderClass: "border-blue-500/70", color: "text-blue-400", bg: "bg-blue-500/10" },
  devops_infrastructure: { label: "DEVOPS", icon: Server, borderClass: "border-emerald-500/70", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  security_architecture: { label: "SEC", icon: Shield, borderClass: "border-red-500/70", color: "text-red-400", bg: "bg-red-500/10" },
  ui_design: { label: "UI", icon: Palette, borderClass: "border-pink-500/70", color: "text-pink-400", bg: "bg-pink-500/10" },
  engineer_impl: { label: "ENG", icon: Code, borderClass: "border-orange-500/70", color: "text-orange-400", bg: "bg-orange-500/10" },
  qa_verification: { label: "QA", icon: CheckCircle2, borderClass: "border-cyan-500/70", color: "text-cyan-400", bg: "bg-cyan-500/10" },
}

/** Short narrative under each node while that step is running (e.g. "Defining user stories…"). */
const STEP_NARRATIVES: Record<string, string> = {
  pm_spec: "Defining user stories and scope…",
  arch_design: "Designing APIs and database schema…",
  security_architecture: "Defining threat model and controls…",
  devops_infrastructure: "Planning CI/CD and infrastructure…",
  ui_design: "Defining design tokens and components…",
  engineer_impl: "Planning file structure and implementation…",
  qa_verification: "Defining test strategy and cases…",
}

function getStepCompletionSummary(stepId: string, artifact: any): string {
  const content = artifact?.content ?? artifact
  switch (stepId) {
    case "pm_spec": {
      if (!content) return "Done"
      const us = content.user_stories
      const ac = content.acceptance_criteria
      const n = Array.isArray(us) ? us.length : 0
      const m = Array.isArray(ac) ? ac.length : 0
      if (n || m) return `${n} user stories, ${m} acceptance criteria`
      return "Requirements defined"
    }
    case "arch_design": {
      if (!content) return "Done"
      const apis = content.apis
      const tables = content.database_schema?.tables
      const a = Array.isArray(apis) ? apis.length : 0
      const t = Array.isArray(tables) ? tables.length : 0
      if (a || t) return `${a} APIs, ${t} tables`
      return "Architecture defined"
    }
    case "security_architecture": {
      if (!content) return "Threat model and controls defined"
      const threats = content.threat_model
      const controls = content.security_controls
      const t = Array.isArray(threats) ? threats.length : 0
      const c = Array.isArray(controls) ? controls.length : 0
      if (t || c) return `${t} threats, ${c} controls`
      return "Threat model and controls defined"
    }
    case "devops_infrastructure": {
      if (!content) return "CI/CD and infrastructure planned"
      const stages = content.cicd?.pipeline_stages
      const services = content.infrastructure?.services
      const s = Array.isArray(stages) ? stages.length : 0
      const v = Array.isArray(services) ? services.length : 0
      if (s || v) return `${s} pipeline stages, ${v} services`
      return "CI/CD and infrastructure planned"
    }
    case "ui_design": {
      if (!content) return "Design system defined"
      const pages = content.website_layout?.pages
      const specs = content.component_specs
      const p = Array.isArray(pages) ? pages.length : 0
      const c = Array.isArray(specs) ? specs.length : 0
      if (p || c) return `${p} pages, ${c} component specs`
      return "Design system and components defined"
    }
    case "engineer_impl": {
      if (!content) return "Implementation planned"
      const deps = content.dependencies
      const files = content.file_structure
      const d = Array.isArray(deps) ? deps.length : 0
      if (d) return `${d} dependencies, file structure`
      if (files) return "File structure and implementation planned"
      return "Implementation planned"
    }
    case "qa_verification": {
      if (!content) return "Test strategy defined"
      const cases = content.test_cases
      const c = Array.isArray(cases) ? cases.length : 0
      if (c) return `${c} test cases`
      return "Test strategy and cases defined"
    }
    default:
      return "Done"
  }
}

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
    }
  }, [searchParams])

  // Handle diagram ID from URL (for editing/viewing)
  useEffect(() => {
    const diagramId = searchParams.get("id")
    if (diagramId && !currentDiagram && !isGenerating) {
      const loadDiagram = async () => {
        try {
          const data = await diagramsApi.getById(diagramId)
          if (data) {
            setCurrentDiagram({
              id: data.id,
              title: data.title,
              description: data.description,
              isGuest: data.metadata?.is_guest,
              metadata: data.metadata
            })
            // Also set prompt for context
            if (data.metadata?.prompt) {
              setPrompt(data.metadata.prompt)
            }
          }
        } catch (error) {
          console.error("Failed to load diagram:", error)
          toast({
            title: "Error loading diagram",
            description: "Could not load the requested diagram.",
            variant: "destructive"
          })
        }
      }
      loadDiagram()
    }
  }, [searchParams])

  const [includeStateManagement] = useState(true)
  const [includeAPIs] = useState(true)
  const [includeDatabase] = useState(true)
  const [selectedModel, setSelectedModel] = useState("gemini-3-flash-preview")
  const [isReasoningEnabled, setIsReasoningEnabled] = useState(false)
  const [guidedMode, setGuidedMode] = useState(false)

  // Load persisted state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem("metasop_selected_model")
      if (savedModel) setSelectedModel(savedModel)

      const savedReasoning = localStorage.getItem("metasop_reasoning_enabled")
      if (savedReasoning !== null) setIsReasoningEnabled(savedReasoning === "true")

      const savedGuided = localStorage.getItem("metasop_guided_mode")
      if (savedGuided !== null) setGuidedMode(savedGuided === "true")
    }
  }, [])

  // Persist state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("metasop_selected_model", selectedModel)
    }
  }, [selectedModel])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("metasop_reasoning_enabled", String(isReasoningEnabled))
    }
  }, [isReasoningEnabled])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("metasop_guided_mode", String(guidedMode))
    }
  }, [guidedMode])

  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  // Guided clarification: when guided mode is ON and agent asks questions before generation
  const [clarificationQuestions, setClarificationQuestions] = useState<Array<{ id: string; label: string; options: string[] }> | null>(null)
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({})
  const [showClarificationPanel, setShowClarificationPanel] = useState(false)
  const [isScoping, setIsScoping] = useState(false)

  // Document upload state
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // UI State
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)
  const [activeArtifactTab, setActiveArtifactTab] = useState("summary")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [currentDiagram, setCurrentDiagram] = useState<{
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
    error?: string
    partial_response?: unknown
  }>>([])
  /** Per-step completion summaries for diagram pipeline (e.g. step_id -> "5 APIs, 3 tables"). */
  const [stepSummaries, setStepSummaries] = useState<Record<string, string>>({})

  // Agent thoughts and partial artifacts state
  const activeStepIdRef = useRef<string | null>(null)
  const [agentThoughts, setAgentThoughts] = useState<Record<string, string>>({})

  // Track step start times to ensure minimum display duration for running animation
  const stepStartTimesRef = useRef<Map<string, number>>(new Map())
  // Track pending timeouts to clean them up if component unmounts or generation is cancelled
  const pendingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const thoughtScrollRef = useRef<HTMLDivElement>(null)
  const clarificationPanelRef = useRef<HTMLDivElement>(null)

  // Auto-scroll thoughts to bottom
  useEffect(() => {
    if (thoughtScrollRef.current) {
      thoughtScrollRef.current.scrollTop = thoughtScrollRef.current.scrollHeight
    }
  }, [agentThoughts])

  // Scroll clarification panel into view when it appears (guided mode questions)
  useEffect(() => {
    if (showClarificationPanel && clarificationPanelRef.current) {
      clarificationPanelRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [showClarificationPanel])

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
    } catch {
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
    // Guided mode OFF: skip scope and generate directly (original behavior)
    if (!guidedMode) {
      await doStartGeneration(undefined)
      return
    }
    // Guided mode ON: call scope; agent may return questions or proceed
    setIsScoping(true)
    try {
      const scopeRes = await fetchDiagramApi("/api/diagrams/scope", {
        method: "POST",
        body: JSON.stringify({ prompt: prompt.trim() }),
        headers: { "Content-Type": "application/json" },
      })
      const scopeJson = await scopeRes.json().catch(() => ({}))
      const data = scopeJson?.data
      if (!scopeRes.ok) {
        toast({ title: "Scoping failed", description: scopeJson?.message || scopeRes.statusText, variant: "destructive" })
        return
      }
      if (data?.proceed === true) {
        await doStartGeneration(undefined)
        return
      }
      if (data?.needClarification === true && Array.isArray(data?.questions) && data.questions.length > 0) {
        setClarificationQuestions(data.questions)
        setClarificationAnswers({})
        setShowClarificationPanel(true)
        toast({
          title: "A few questions first",
          description: "Answer above or click Skip to start generation.",
        })
        return
      }
      await doStartGeneration(undefined)
    } catch (e: any) {
      toast({ title: "Scoping failed", description: e?.message || "Could not check scope", variant: "destructive" })
    } finally {
      setIsScoping(false)
    }
  }

  /** Start generation (optionally with clarification answers). Called after scope says proceed or after user answers. */
  const doStartGeneration = async (answers?: Record<string, string>) => {
    setIsGenerating(true)
    setCurrentDiagram(null)
    setStepSummaries({})
    setShowClarificationPanel(false)
    setClarificationQuestions(null)
    setClarificationAnswers({})

    pendingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    pendingTimeoutsRef.current.clear()
    stepStartTimesRef.current.clear()

    const initialSteps: Array<{ step_id: string; role: string; status: "pending" | "running" | "success" | "failed" }> = [
      { step_id: "pm_spec", role: "Product Manager", status: "pending" },
      { step_id: "arch_design", role: "Architect", status: "pending" },
      { step_id: "security_architecture", role: "Security", status: "pending" },
      { step_id: "devops_infrastructure", role: "DevOps", status: "pending" },
      { step_id: "ui_design", role: "UI Designer", status: "pending" },
      { step_id: "engineer_impl", role: "Engineer", status: "pending" },
      { step_id: "qa_verification", role: "QA", status: "pending" },
    ]
    setGenerationSteps(initialSteps)
    setStepSummaries({})

    try {
      const response = await fetchDiagramApi("/api/diagrams/generate?stream=true", {
        method: "POST",
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
          ...(answers && Object.keys(answers).length > 0 ? { clarificationAnswers: answers } : {}),
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
              const summary = getStepCompletionSummary(event.step_id, event.artifact)
              setStepSummaries(prev => ({ ...prev, [event.step_id]: summary }))
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
                s.step_id === event.step_id
                  ? { ...s, status: "failed", error: event.error, partial_response: event.partial_response }
                  : s
              ))

              // Log full artifact content for debugging root cause analysis
              if (event.artifact) {
                const artifactContent = event.artifact.content || event.artifact;
                console.group(`🔴 [Step Failed] ${event.role} (${event.step_id})`);
                console.error("Validation Errors:", event.error);
                console.error("Full Artifact Content:", artifactContent);
                console.error("Full Artifact (JSON):", JSON.stringify(event.artifact, null, 2));
                console.groupEnd();
              } else {
                console.error(`[Step Failed] ${event.role} (${event.step_id}):`, event.error);
              }
              const isTimeout = event.error?.toLowerCase().includes("timeout");
              const hasPartial = isTimeout && event.partial_response != null;
              toast({
                title: "Step Failed",
                description: hasPartial
                  ? `Agent ${event.role} timed out. Partial response is shown under the step (hover/expand).`
                  : `Agent ${event.role} encountered an error: ${event.error}${event.artifact ? " (Check browser console for full artifact content)" : ""}`,
                variant: "destructive",
                duration: 10000,
              })
            } else if (event.type === "orchestration_complete") {
              console.log("[Frontend] Orchestration complete, diagram:", {
                id: event.diagram?.id,
                hasMetadata: !!event.diagram?.metadata,
                hasArtifacts: !!event.diagram?.metadata?.metasop_artifacts
              })

              const diagram = event.diagram
              if (!diagram) {
                console.error("[Frontend] ERROR: orchestration_complete event missing diagram!", event)
                toast({
                  title: "Generation Error",
                  description: "Diagram data was not received. Please try again.",
                  variant: "destructive"
                })
                return
              }

              const isGuestDiagram = diagram.metadata?.is_guest || diagram.id?.startsWith("guest_") || false

              if (!diagram.metadata?.metasop_artifacts) {
                console.error("[Frontend] ERROR: Diagram has no artifacts!", diagram)
                toast({
                  title: "Generation Warning",
                  description: "Diagram was generated but contains no artifacts. Check console for details.",
                  variant: "destructive"
                })
              }

              setCurrentDiagram({
                id: diagram.id,
                title: diagram.title,
                description: diagram.description,
                isGuest: isGuestDiagram,
                metadata: diagram.metadata,  // Contains metasop_artifacts with all agent data
              })

              console.log("[Frontend] Diagram set, has artifacts:", !!diagram.metadata?.metasop_artifacts)

              toast({
                title: "Diagram generated!",
                description: "Your architecture diagram has been generated successfully. Don't forget to save it if you want to keep it.",
              })

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
    if (!currentDiagram || !currentDiagram.metadata?.metasop_artifacts) {
      toast({
        title: "No diagram to save",
        description: "Please generate a diagram first",
        variant: "destructive",
      })
      return
    }

    try {
      // If diagram already has a permanent ID (not temp_), update it
      // Note: guest_ IDs are considered "permanent" within the session
      if (currentDiagram.id && !currentDiagram.id.startsWith("temp_")) {
        // Update existing diagram
        await diagramsApi.update(currentDiagram.id, {
          title: currentDiagram.title || prompt.substring(0, 50),
          description: currentDiagram.description || prompt,
          metadata: {
            ...currentDiagram.metadata,
            is_guest: !isAuthenticated,
          }, // Preserve agent artifacts and add guest flag
        })

        toast({
          title: "Saved",
          description: "Your changes are saved for this session.",
        })

        // router.push(`/dashboard/diagrams/${currentDiagram.id}`)
      } else {
        // Create new diagram (since autosave is removed, even authenticated users start with a temp ID)
        const savedDiagram = await diagramsApi.create({
          prompt: prompt || currentDiagram.description || "Architecture diagram",
          options: {
            includeStateManagement,
            includeAPIs,
            includeDatabase,
          },
        })

        // Update with metadata
        await diagramsApi.update(savedDiagram.id, {
          title: currentDiagram.title || prompt.substring(0, 50),
          description: currentDiagram.description || prompt,
          metadata: {
            ...currentDiagram.metadata,
            is_guest: !isAuthenticated,
          }, // Preserve agent artifacts and add guest flag
        })

        // Update local state with new ID
        setCurrentDiagram({
          ...currentDiagram,
          id: savedDiagram.id,
          isGuest: !isAuthenticated,
        })

        toast({
          title: "Saved",
          description: "Your diagram is saved for this session.",
        })

        // Redirect removed to allow staying on the page
        // router.push(`/dashboard/diagrams/${savedDiagram.id}`)
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

  const sidebarContent = (
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

      <ScrollArea className="w-full whitespace-nowrap" type="hover">
        <div className="flex gap-1.5 pb-2 no-scrollbar">
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
      </ScrollArea>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 pl-8 text-[11px] bg-background/50 border-border/50 focus-visible:ring-blue-500/30"
        />
      </div>

      <div className="grid grid-cols-1 gap-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {promptTemplates
          .filter(t => (activeCategory === "All" || t.category === activeCategory) &&
            (t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.description.toLowerCase().includes(searchQuery.toLowerCase()))).map((template) => (
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
          <p className="text-[11px] text-blue-700 dark:text-blue-300 font-bold">Pro Tip</p>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Templates provide a solid foundation. Refine your diagram with instructions at the bottom.
        </p>
      </div>
    </div>
  )

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

          <div className="flex items-center gap-1.5 shrink-0">
            {currentDiagram && (
              <TooltipProvider>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/20 rounded-xl border border-border/40 backdrop-blur-md">
                  {/* Left Panel Toggle (Menu) */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isLeftPanelOpen ? "default" : "ghost"}
                        size="icon"
                        className={cn(
                          "h-8 w-8 rounded-lg transition-all",
                          isLeftPanelOpen ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" : "text-foreground hover:bg-muted"
                        )}
                        onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
                      >
                        <PanelLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isLeftPanelOpen ? "Close Menu" : "Open Menu"}
                    </TooltipContent>
                  </Tooltip>

                  {/* Chat Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isChatOpen ? "default" : "ghost"}
                        size="icon"
                        className={cn(
                          "h-8 w-8 rounded-lg transition-all relative",
                          isChatOpen ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" : "text-foreground hover:bg-muted"
                        )}
                        onClick={() => setIsChatOpen(!isChatOpen)}
                      >
                        <div className="relative">
                          <PanelRight className="h-4 w-4" />
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-background animate-pulse" />
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isChatOpen ? "Close Chat" : "Open Chat"}
                    </TooltipContent>
                  </Tooltip>

                  <div className="w-px h-4 bg-border/50 mx-0.5" />

                  {/* Save Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-foreground hover:bg-muted transition-all"
                        onClick={handleSave}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {currentDiagram?.id && !currentDiagram.id.startsWith("temp_") ? "Update Diagram" : "Save Diagram"}
                    </TooltipContent>
                  </Tooltip>

                  <div className="w-px h-4 bg-border/50 mx-0.5" />

                  {/* Create New Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-foreground hover:bg-muted transition-all"
                        onClick={() => {
                          router.push('/dashboard/create')
                          window.location.reload()
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Create New Diagram
                    </TooltipContent>
                  </Tooltip>

                  <div className="w-px h-4 bg-border/50 mx-0.5" />

                  {/* More Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-lg text-foreground hover:bg-muted/50 transition-all">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-card/98 backdrop-blur-xl border-border/50 shadow-xl rounded-xl p-1.5 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2">

                      {/* Primary Action: Save/View */}
                      {currentDiagram.id && !currentDiagram.id.startsWith("temp_") ? (
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/diagrams/${currentDiagram.id}`)}
                          className="group flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-blue-500/10 hover:text-blue-600 focus:bg-blue-500/10 focus:text-blue-600 focus:outline-hidden transition-colors"
                        >
                          <Save className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                          <span>{isAuthenticated ? "View Saved Version" : "View in Session"}</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={handleSave}
                          className="group flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-blue-500/10 hover:text-blue-600 focus:bg-blue-500/10 focus:text-blue-600 focus:outline-hidden transition-colors"
                        >
                          <Save className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                          <span>{isAuthenticated ? "Save to Account" : "Save to Session"}</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator className="bg-border/50 my-1.5" />

                      {/* Secondary Actions */}
                      <DropdownMenuItem
                        onClick={handleExportContext}
                        className="group flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted focus:bg-muted focus:outline-hidden transition-colors"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                        <span>Export Context</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-border/50 my-1.5" />

                      {/* Downloads */}
                      <div className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Downloads
                      </div>

                      <DropdownMenuItem
                        onClick={() => {
                          const guestSessionId = document.cookie
                            .split('; ')
                            .find(row => row.startsWith('guest_session_id='))
                            ?.split('=')[1];

                          const query = guestSessionId ? `?guestSessionId=${guestSessionId}` : '';
                          window.location.href = `/api/diagrams/${currentDiagram.id}/export/pptx${query}`;
                        }}
                        disabled={!currentDiagram.id}
                        className="group flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted focus:bg-muted focus:outline-hidden transition-colors"
                      >
                        <Monitor className="h-4 w-4 text-muted-foreground group-hover:text-orange-600 transition-colors" />
                        <span>PowerPoint (.pptx)</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={handleDownloadSpecs}
                        className="group flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted focus:bg-muted focus:outline-hidden transition-colors"
                      >
                        <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span>Download JSON Specs</span>
                      </DropdownMenuItem>

                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TooltipProvider>
            )}
          </div>

        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Left Sidebar - Creation Panel */}
            {isLeftPanelOpen && (
              <>
                <ResizablePanel defaultSize={20} minSize={15} maxSize={40} className="hidden lg:block relative">
                  <div className="h-full border-r border-border bg-card/98 backdrop-blur-xl flex flex-col shrink-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                      {sidebarContent}
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle className="hidden lg:flex" />

                {/* Mobile Fallback (Unchanged logic for small screens) */}
                <AnimatePresence>
                  <motion.div
                    key="mobile-sidebar-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-background/40 backdrop-blur-[2px] z-40 lg:hidden"
                    onClick={() => setIsLeftPanelOpen(false)}
                  />
                  <motion.div
                    key="mobile-sidebar-panel"
                    initial={{ x: "-100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "-100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                    className="fixed inset-y-0 left-0 w-full sm:w-80 border-r border-border bg-card/98 backdrop-blur-xl flex flex-col shrink-0 z-50 shadow-2xl lg:hidden"
                  >
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                      {sidebarContent}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </>
            )}

            {/* Main Area: Combined Diagram and Chat */}
            <ResizablePanel defaultSize={isLeftPanelOpen ? 80 : 100} className="flex flex-col relative bg-background min-h-0">
              {/* Progress Bar at Top */}
              {isGenerating && generationSteps.length > 0 && (
                <div className="absolute top-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-md border-b border-border shadow-lg">
                  <div className="p-4">
                    <GenerationProgress steps={generationSteps} />
                  </div>
                </div>
              )}

              {/* Guided clarification panel - rendered here to avoid overflow-hidden clipping */}
              {showClarificationPanel && clarificationQuestions && clarificationQuestions.length > 0 && (
                <div
                  ref={clarificationPanelRef}
                  className="absolute bottom-28 left-0 right-0 z-50 p-4 pointer-events-auto"
                >
                  <div className="max-w-2xl mx-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-blue-500/30 bg-card/98 backdrop-blur-md shadow-xl p-5 space-y-5"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        A few questions to tailor the result
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pick one option per question — your choices will be sent to the agent before generation.
                      </p>
                      <div className="space-y-4">
                        {clarificationQuestions.map((q) => (
                          <div key={q.id} className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">{q.label}</Label>
                            <div className="flex flex-wrap gap-2">
                              {q.options.map((opt) => {
                                const isSelected = clarificationAnswers[q.id] === opt
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setClarificationAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                                    className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm transition-colors ${isSelected
                                      ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300"
                                      : "border-border/60 bg-muted/50 text-muted-foreground hover:border-border hover:bg-muted"
                                      }`}
                                  >
                                    {opt}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => doStartGeneration(undefined)}
                        >
                          Skip
                        </Button>
                        <Button
                          size="sm"
                          className="gap-2 bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            const allAnswered = clarificationQuestions.every((q) => clarificationAnswers[q.id]?.trim())
                            if (allAnswered) {
                              doStartGeneration(clarificationAnswers)
                            } else {
                              toast({
                                title: "Answer all questions",
                                description: "Pick one option per question, or click Skip to generate without them.",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <Play className="h-3.5 w-3.5" />
                          Continue to generate
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Center Area: Artifacts or Generation flow */}
              <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
                <div className="flex-1 overflow-hidden" style={{ paddingTop: isGenerating && generationSteps.length > 0 ? '72px' : '0' }}>
                  {currentDiagram && currentDiagram.metadata?.metasop_artifacts ? (
                    <div className="h-full pb-6">
                      <ArtifactsPanel
                        diagramId={currentDiagram.id || ""}
                        artifacts={currentDiagram.metadata.metasop_artifacts}
                        steps={currentDiagram.metadata.metasop_steps}
                        className="h-full"
                        activeTab={activeArtifactTab}
                        onTabChange={setActiveArtifactTab}
                      />
                    </div>
                  ) : currentDiagram && !currentDiagram.metadata?.metasop_artifacts ? (
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
                            The diagram was created but no artifacts were generated. This might happen if the prompt was too vague or the AI couldn't extract enough information.
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
                  ) : isGenerating && generationSteps.length > 0 ? (
                    (() => {
                      const { W, H, bend } = PIPELINE_GRID
                      const p = PIPELINE_POINTS
                      const completedCount = generationSteps.filter(s => s.status === "success").length
                      const hasRunning = generationSteps.some(s => s.status === "running")
                      const visibleCount = Math.min(completedCount + (hasRunning ? 1 : 0), 7)
                      const visibleStepIds = PIPELINE_STEP_IDS.slice(0, visibleCount)
                      const visibleSteps = visibleStepIds.map(id => generationSteps.find(s => s.step_id === id)!).filter(Boolean)
                      const pathParts: string[] = []
                      if (visibleCount >= 1) pathParts.push(`M ${p[0].x} ${p[0].y}`)
                      if (visibleCount >= 2) pathParts.push(`L ${p[1].x} ${p[1].y}`)
                      if (visibleCount >= 3) pathParts.push(`L ${p[2].x} ${p[2].y}`)
                      if (visibleCount >= 4) pathParts.push(`C ${p[2].x + bend} ${p[2].y}, ${p[3].x + bend} ${p[3].y}, ${p[3].x} ${p[3].y}`)
                      if (visibleCount >= 5) pathParts.push(`L ${p[4].x} ${p[4].y}`)
                      if (visibleCount >= 6) pathParts.push(`L ${p[5].x} ${p[5].y}`)
                      if (visibleCount >= 7) pathParts.push(`C ${p[5].x} ${QA_EDGE_MID_Y}, ${p[6].x} ${QA_EDGE_MID_Y}, ${p[6].x} ${p[6].y}`)
                      const pathProgressive = pathParts.join(" ")
                      const pathTraceUpToVisible = pathProgressive
                      const scale = 1.1
                      const displayW = W * scale
                      const displayH = H * scale
                      return (
                        <div className="flex flex-col items-center -mt-2">
                          <p className="text-sm font-medium text-muted-foreground text-center mb-1 mt-6">
                            Step {completedCount + (hasRunning ? 1 : 0)} of 7
                          </p>
                          <div
                            className="relative overflow-visible"
                            style={{ width: displayW, height: displayH, transform: `scale(${scale})`, transformOrigin: "center top" }}
                          >
                            <div className="relative" style={{ width: W, height: H }}>
                              <svg
                                width={W}
                                height={H}
                                viewBox={`0 0 ${W} ${H}`}
                                className="absolute inset-0 pointer-events-none overflow-visible z-10"
                              >
                                <defs>
                                  <linearGradient id="create-flow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#a855f7" />
                                    <stop offset="50%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#22d3ee" />
                                  </linearGradient>
                                  <filter id="create-neon-blur">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                  </filter>
                                </defs>
                                <path d={pathTraceUpToVisible} fill="none" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2" strokeLinecap="round" className="text-foreground" />
                                <motion.path
                                  key={pathProgressive}
                                  d={pathProgressive}
                                  fill="none"
                                  stroke="url(#create-flow-grad)"
                                  strokeWidth={visibleCount === 1 ? 4.5 : 3.5}
                                  strokeLinecap="round"
                                  strokeDasharray="4, 16"
                                  initial={{ strokeDashoffset: 0 }}
                                  animate={{ strokeDashoffset: [-40, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                  filter="url(#create-neon-blur)"
                                />
                              </svg>
                              {visibleSteps.map((step, i) => {
                                const pt = PIPELINE_POINTS[i]
                                const config = AGENT_NODE_CONFIG[step.step_id]
                                const isRunning = step.status === "running"
                                const isSuccess = step.status === "success"
                                const isFailed = step.status === "failed"
                                const summary = stepSummaries[step.step_id]
                                const Icon = config?.icon ?? FileText
                                return (
                                  <div
                                    key={step.step_id}
                                    className="absolute z-20 flex items-center justify-center"
                                    style={{ left: pt.x - 28, top: pt.y - 28, width: 112, height: 100 }}
                                  >
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                      className="relative flex flex-col items-center"
                                    >
                                      <motion.div
                                        animate={isRunning ? { opacity: [0.7, 1, 0.7] } : {}}
                                        transition={{ duration: 1.2, repeat: isRunning ? Infinity : 0 }}
                                        className={cn(
                                          "w-14 h-14 rounded-2xl border-2 backdrop-blur-xl flex items-center justify-center shadow-xl",
                                          config?.bg,
                                          config?.borderClass,
                                          isSuccess && "border-opacity-100",
                                          isRunning && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
                                          isFailed && "border-red-500 bg-red-500/20"
                                        )}
                                      >
                                        <Icon className={cn("h-7 w-7 shrink-0", config?.color, isRunning && "drop-shadow-sm")} />
                                      </motion.div>
                                      <div className="mt-1 w-28 text-center shrink-0">
                                        <span className="text-[10px] font-black tracking-tight text-foreground uppercase">
                                          {config?.label ?? step.role}
                                        </span>
                                      </div>
                                      <div className="mt-1 w-36 min-h-10 flex items-center justify-center">
                                        {isSuccess ? (
                                          summary ? (
                                            <motion.p
                                              initial={{ opacity: 0, y: 4 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-3 px-1 font-medium"
                                              title={summary}
                                            >
                                              {summary}
                                            </motion.p>
                                          ) : (
                                            <span className="text-[10px] text-muted-foreground">Done</span>
                                          )
                                        ) : isRunning ? (
                                          <motion.p
                                            animate={{ opacity: [0.7, 1, 0.7] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            className="text-[10px] text-primary text-center leading-tight line-clamp-2 px-1 font-medium"
                                          >
                                            {STEP_NARRATIVES[step.step_id] ?? `${step.role} working…`}
                                          </motion.p>
                                        ) : isFailed ? (
                                          (() => {
                                            const isTimeout = step.error?.toLowerCase().includes("timeout");
                                            const partial = step.partial_response;
                                            const hasPartial = isTimeout && partial != null;
                                            const raw = hasPartial ? (typeof partial === "string" ? partial : JSON.stringify(partial, null, 2)) : "";
                                            const partialStr = raw.slice(0, 800) + (raw.length > 800 ? "…" : "");
                                            return hasPartial && partialStr ? (
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <span className="text-[10px] text-red-500 font-medium cursor-help">Timed out (hover)</span>
                                                  </TooltipTrigger>
                                                  <TooltipContent side="top" className="max-w-sm max-h-64 overflow-auto text-xs font-mono whitespace-pre-wrap wrap-break-word p-2">
                                                    <p className="font-semibold text-foreground mb-1">Partial response (timeout):</p>
                                                    <pre className="text-muted-foreground">{partialStr}</pre>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            ) : (
                                              <span className="text-[10px] text-red-500 font-medium" title={step.error}>Failed</span>
                                            );
                                          })()
                                        ) : null}
                                      </div>
                                    </motion.div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })()
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

                {/* Input Area (Absolute positioned within center panel) */}
                {(!currentDiagram || isLeftPanelOpen) && (
                  <div className="absolute bottom-0 left-0 right-0 z-40 p-4">
                    <div className="max-w-3xl mx-auto">
                      <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
                        <Textarea
                          id="prompt"
                          placeholder="Describe your application in plain English…"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="min-h-[52px] max-h-[140px] resize-none text-sm rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 pt-3 pb-2 placeholder:text-muted-foreground/70"
                          disabled={isGenerating || isScoping}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              if (prompt.trim().length >= 20 && !isGenerating && !isScoping) {
                                handleGenerate()
                              }
                            }
                          }}
                        />
                        <div className="flex items-center justify-between gap-4 px-3 py-2 border-t border-border/50 bg-muted/30">
                          <div className="flex items-center gap-3 min-w-0">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
                                    <Switch
                                      id="guided-mode"
                                      checked={guidedMode}
                                      onCheckedChange={setGuidedMode}
                                      className="scale-90 data-[state=checked]:bg-blue-600"
                                    />
                                    <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span className="text-xs font-medium hidden sm:inline">Guided</span>
                                  </label>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[220px]">
                                  <p className="text-xs">
                                    {guidedMode
                                      ? "On: AI may ask questions before generating."
                                      : "Off: Generate directly from your prompt."}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Select value={selectedModel} onValueChange={setSelectedModel}>
                              <SelectTrigger className="h-7 min-w-[168px] w-auto border-0 bg-transparent focus:ring-0 shadow-none text-xs font-medium text-muted-foreground hover:text-foreground">
                                <SelectValue placeholder="Model" />
                              </SelectTrigger>
                              <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50">
                                <SelectItem value="gemini-3-flash-preview" className="text-xs cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <Zap className="h-3 w-3 text-amber-500" />
                                    Gemini 3 Flash
                                  </div>
                                </SelectItem>
                                <SelectItem value="gemini-3-pro-preview" className="text-xs cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <Cpu className="h-3 w-3 text-purple-500" />
                                    Gemini 3 Pro
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
                                    <Switch
                                      id="reasoning-mode"
                                      checked={isReasoningEnabled}
                                      onCheckedChange={setIsReasoningEnabled}
                                      className="scale-90 data-[state=checked]:bg-blue-600"
                                    />
                                    <Brain className={cn("h-3.5 w-3.5 shrink-0", isReasoningEnabled && "text-blue-500")} />
                                    <span className="text-xs font-medium hidden sm:inline">Thinking</span>
                                  </label>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[200px]">
                                  <p className="text-xs">Extended reasoning (slower, more thorough).</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {uploadedDocuments.length > 0 && (
                              <Badge variant="secondary" className="text-[10px] py-0.5 px-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0">
                                {uploadedDocuments.length}
                              </Badge>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isGenerating || isUploading}
                                  >
                                    {isUploading ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Paperclip className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Attach documents</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept=".txt,.md,.json,.csv,.pdf"
                              onChange={handleFileChange}
                            />
                            <VoiceInputButton
                              onTranscription={(text) => setPrompt(prev => prev + (prev ? " " : "") + text)}
                              disabled={isGenerating || isScoping}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                            />
                            <span
                              className={cn(
                                "text-[10px] tabular-nums w-6 text-right",
                                prompt.length < 20 ? "text-muted-foreground" : "text-green-600 dark:text-green-400"
                              )}
                              title="Minimum 20 characters"
                            >
                              {prompt.length}/20
                            </span>
                            <Button
                              onClick={handleGenerate}
                              disabled={!prompt.trim() || prompt.length < 20 || isGenerating || isScoping}
                              size="sm"
                              className="h-7 px-3 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-md"
                            >
                              {isScoping || isGenerating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                              )}
                              <span className="hidden sm:inline">
                                {isScoping ? "Checking…" : isGenerating ? "Generating…" : "Generate"}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>

            {/* Right Sidebar - Chat Panel (Desktop Resizable) */}
            {currentDiagram && currentDiagram.metadata?.metasop_artifacts && isChatOpen && (
              <>
                <ResizableHandle withHandle className="hidden lg:flex w-1 bg-border/60 hover:bg-primary/60 transition-all duration-200" />
                <ResizablePanel defaultSize={22} minSize={18} maxSize={40} collapsible className="hidden lg:block">
                  <div className="h-full border-l border-border/80 bg-linear-to-br from-card/60 via-card/50 to-background/40 backdrop-blur-md relative z-40 shadow-lg">
                    <ProjectChatPanel
                      diagramId={currentDiagram.id || ""}
                      artifacts={currentDiagram.metadata.metasop_artifacts}
                      activeTab={activeArtifactTab}
                      onRefineComplete={(result) => {
                        if (result?.artifacts && currentDiagram) {
                          setCurrentDiagram({
                            ...currentDiagram,
                            metadata: {
                              ...currentDiagram.metadata,
                              metasop_artifacts: result.artifacts,
                            },
                          })
                        }
                      }}
                    />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>

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
                    onRefineComplete={(result) => {
                      if (result?.artifacts && currentDiagram) {
                        setCurrentDiagram({
                          ...currentDiagram,
                          metadata: {
                            ...currentDiagram.metadata,
                            metasop_artifacts: result.artifacts,
                          },
                        })
                      }
                    }}
                  />
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
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
