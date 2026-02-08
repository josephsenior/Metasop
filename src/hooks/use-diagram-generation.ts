"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { fetchDiagramApi } from "@/lib/api/diagram-fetch"
import { useToast } from "@/components/ui/use-toast"
import type { 
    MetaSOPArtifact, 
    MetaSOPEvent,
    BackendArtifactData,
    ProductManagerBackendArtifact,
    ArchitectBackendArtifact,
    SecurityBackendArtifact,
    DevOpsBackendArtifact,
    UIDesignerBackendArtifact,
    EngineerBackendArtifact,
    QABackendArtifact
} from "@/lib/metasop/types"

import { UploadedDocument, DiagramMetadata } from "@/types/diagram"

export interface GenerationStep {
    step_id: string
    role: string
    status: "pending" | "running" | "success" | "failed"
    error?: string
    partial_response?: string | BackendArtifactData
}

export interface ClarificationQuestion {
    id: string
    label: string
    options: string[]
}

export interface DiagramData {
    id?: string
    title?: string
    description?: string
    isGuest?: boolean
    metadata?: DiagramMetadata
}

function isMetaSopEventLike(value: unknown): value is { type: string } {
    return (
        !!value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof (value as { type?: unknown }).type === "string"
    )
}

function getStepCompletionSummary(stepId: string, artifact: MetaSOPArtifact | null): string {
    if (!artifact) {
        return "Done"
    }
    const { content } = artifact
    switch (stepId) {
        case "pm_spec": {
            if (!content) {
                return "Done"
            }
            const { user_stories: us, acceptance_criteria: ac } = content as ProductManagerBackendArtifact
            const n = Array.isArray(us) ? us.length : 0
            const m = Array.isArray(ac) ? ac.length : 0
            if (n || m) return `${n} user stories, ${m} acceptance criteria`
            return "Requirements defined"
        }
        case "arch_design": {
            if (!content) return "Done"
            const { apis, database_schema } = content as ArchitectBackendArtifact
            const tables = database_schema?.tables
            const a = Array.isArray(apis) ? apis.length : 0
            const t = Array.isArray(tables) ? tables.length : 0
            if (a || t) return `${a} APIs, ${t} tables`
            return "Architecture defined"
        }
        case "security_architecture": {
            if (!content) return "Threat model and controls defined"
            const { threat_model: threats, security_controls: controls } = content as SecurityBackendArtifact
            const t = Array.isArray(threats) ? threats.length : 0
            const c = Array.isArray(controls) ? controls.length : 0
            if (t || c) return `${t} threats, ${c} controls`
            return "Threat model and controls defined"
        }
        case "devops_infrastructure": {
            if (!content) return "CI/CD and infrastructure planned"
            const { cicd, infrastructure } = content as DevOpsBackendArtifact
            const stages = cicd?.pipeline_stages
            const services = infrastructure?.services
            const s = Array.isArray(stages) ? stages.length : 0
            const v = Array.isArray(services) ? services.length : 0
            if (s || v) return `${s} pipeline stages, ${v} services`
            return "CI/CD and infrastructure planned"
        }
        case "ui_design": {
            if (!content) return "Design system defined"
            const { website_layout, component_specs: specs } = content as UIDesignerBackendArtifact
            const pages = website_layout?.pages
            const p = Array.isArray(pages) ? pages.length : 0
            const c = Array.isArray(specs) ? specs.length : 0
            if (p || c) return `${p} pages, ${c} component specs`
            return "Design system and components defined"
        }
        case "engineer_impl": {
            if (!content) return "Implementation planned"
            const { dependencies: deps, file_structure: files } = content as EngineerBackendArtifact
            const d = Array.isArray(deps) ? deps.length : 0
            if (d) return `${d} dependencies, file structure`
            if (files) return "File structure and implementation planned"
            return "Implementation planned"
        }
        case "qa_verification": {
            if (!content) return "Test strategy defined"
            const { test_cases: cases } = content as QABackendArtifact
            const c = Array.isArray(cases) ? cases.length : 0
            if (c) return `${c} test cases`
            return "Test strategy and cases defined"
        }
        default:
            return "Done"
    }
}

const INITIAL_STEPS: GenerationStep[] = [
    { step_id: "pm_spec", role: "Product Manager", status: "pending" },
    { step_id: "arch_design", role: "Architect", status: "pending" },
    { step_id: "security_architecture", role: "Security", status: "pending" },
    { step_id: "devops_infrastructure", role: "DevOps", status: "pending" },
    { step_id: "ui_design", role: "UI Designer", status: "pending" },
    { step_id: "engineer_impl", role: "Engineer", status: "pending" },
    { step_id: "qa_verification", role: "QA", status: "pending" },
]

export function useDiagramGeneration() {
    const { toast } = useToast()

    // State
    const [prompt, setPrompt] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [isScoping, setIsScoping] = useState(false)
    const [guidedMode, setGuidedMode] = useState(false)
    const [selectedModel, setSelectedModel] = useState("gemini-3-flash-preview")
    const [isReasoningEnabled, setIsReasoningEnabled] = useState(false)

    const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[] | null>(null)
    const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({})
    const [showClarificationPanel, setShowClarificationPanel] = useState(false)

    const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
    const [isUploading, setIsUploading] = useState(false)

    const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([])
    const [stepSummaries, setStepSummaries] = useState<Record<string, string>>({})
    const [agentThoughts, setAgentThoughts] = useState<Record<string, string>>({})
    const [currentDiagram, setCurrentDiagram] = useState<DiagramData | null>(null)

    // Refs for stream handling
    const activeStepIdRef = useRef<string | null>(null)
    const stepStartTimesRef = useRef<Map<string, number>>(new Map())
    const pendingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

    // Initial load from storage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedPrompt = localStorage.getItem("metasop_prompt")
            if (savedPrompt) setPrompt(savedPrompt)

            const savedModel = localStorage.getItem("metasop_selected_model")
            if (savedModel) setSelectedModel(savedModel)

            const savedReasoning = localStorage.getItem("metasop_reasoning_enabled")
            if (savedReasoning !== null) setIsReasoningEnabled(savedReasoning === "true")

            const savedGuided = localStorage.getItem("metasop_guided_mode")
            if (savedGuided !== null) setGuidedMode(savedGuided === "true")
            
            const savedDocs = localStorage.getItem("metasop_uploaded_documents")
            if (savedDocs) {
                try {
                    setUploadedDocuments(JSON.parse(savedDocs))
                } catch (e) {
                    console.error("Failed to parse saved documents", e)
                }
            }
        }
    }, [])

    // Persist changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("metasop_prompt", prompt)
        }
    }, [prompt])

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

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("metasop_uploaded_documents", JSON.stringify(uploadedDocuments))
        }
    }, [uploadedDocuments])

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            pendingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
            pendingTimeoutsRef.current.clear()
            stepStartTimesRef.current.clear()
        }
    }, [])

    const handleFileUpload = async (file: File) => {
        setIsUploading(true)
        try {
            const reader = new FileReader()
            reader.onload = async (event) => {
                const content = String(event.target?.result ?? "")
                const newDoc = {
                    name: file.name,
                    type: file.name.split('.').pop() || 'txt',
                    content,
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

    const removeDocument = (index: number) => {
        setUploadedDocuments(prev => prev.filter((_, i) => i !== index))
    }

    const doStartGeneration = useCallback(async (answers?: Record<string, string>) => {
        const trimmedPrompt = prompt.trim()
        setIsGenerating(true)
        setCurrentDiagram(null)
        setStepSummaries({})
        setShowClarificationPanel(false)
        setClarificationQuestions(null)
        setClarificationAnswers({})
        setAgentThoughts({})

        pendingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
        pendingTimeoutsRef.current.clear()
        stepStartTimesRef.current.clear()

        setGenerationSteps(INITIAL_STEPS)

        try {
            const postBody = {
                prompt: trimmedPrompt,
                options: {
                    model: selectedModel,
                    reasoning: isReasoningEnabled,
                    includeStateManagement: true,
                    includeAPIs: true,
                    includeDatabase: true,
                },
                documents: uploadedDocuments,
                ...(answers && Object.keys(answers).length > 0 ? { clarificationAnswers: answers } : {}),
            }
            const response = await fetchDiagramApi("/api/diagrams/generate", {
                method: "POST",
                body: JSON.stringify(postBody),
            })

            const responseJson = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(responseJson?.message || `Failed to generate: ${response.statusText}`)
            }

            const jobId = responseJson?.data?.jobId
            const streamUrl = responseJson?.data?.streamUrl
            if (!jobId || !streamUrl) {
                throw new Error("Missing job information from server")
            }

            const streamResponse = await fetchDiagramApi(streamUrl, { method: "GET" })
            if (!streamResponse.ok) {
                throw new Error(`Failed to open stream: ${streamResponse.statusText}`)
            }

            const reader = streamResponse.body?.getReader()
            if (!reader) throw new Error("No response body")

            const decoder = new TextDecoder()
            let buffer = ""

            const handleEvent = (event: MetaSOPEvent) => {
                const { type, step_id } = event;
                
                setGenerationSteps(prev => {
                    const currentSteps = prev.length > 0 ? prev : INITIAL_STEPS;
                    
                    if (type === "step_start" && step_id) {
                        stepStartTimesRef.current.set(step_id, Date.now());
                        activeStepIdRef.current = step_id;
                        return currentSteps.map(s => s.step_id === step_id ? { ...s, status: "running" as const } : s);
                    } else if (type === "step_complete" && step_id) {
                        const step = currentSteps.find(s => s.step_id === step_id);
                        if (!step) return currentSteps;

                        // Force "running" first if it was still pending
                        let baseSteps = currentSteps;
                        if (step.status === "pending") {
                            baseSteps = currentSteps.map(s => s.step_id === step_id ? { ...s, status: "running" as const } : s);
                        }

                        const startTime = stepStartTimesRef.current.get(step_id) || Date.now();
                        const elapsed = Date.now() - startTime;
                        const minDisplayTime = 800;

                        if (elapsed < minDisplayTime) {
                            const timeoutId = setTimeout(() => {
                                setGenerationSteps(latest => latest.map(s => 
                                    s.step_id === step_id ? { ...s, status: "success" as const } : s
                                ));
                                stepStartTimesRef.current.delete(step_id);
                                pendingTimeoutsRef.current.delete(step_id);
                            }, minDisplayTime - elapsed);
                            pendingTimeoutsRef.current.set(step_id, timeoutId);
                            return baseSteps;
                        } else {
                            stepStartTimesRef.current.delete(step_id);
                            return baseSteps.map(s => s.step_id === step_id ? { ...s, status: "success" as const } : s);
                        }
                    } else if (type === "step_failed" && step_id) {
                        const { error } = event
                        return currentSteps.map(s => s.step_id === step_id ? { ...s, status: "failed" as const, error } : s);
                    } else if (type === "orchestration_complete") {
                        return currentSteps.map(s =>
                            (s.status === "running" || s.status === "pending") ? { ...s, status: "success" as const } : s
                        );
                    }

                    return currentSteps;
                });

                // Final orchestration cleanup
                if (type === "orchestration_complete" && event.diagram) {
                    const { diagram } = event
                    setCurrentDiagram({
                        id: diagram.id,
                        title: diagram.title,
                        description: diagram.description,
                        isGuest: !!(diagram.metadata?.is_guest || diagram.id?.startsWith("guest_") || false),
                        metadata: diagram.metadata,
                    });
                    setPrompt("");
                    setUploadedDocuments([]);
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem("metasop_prompt");
                        localStorage.removeItem("metasop_uploaded_documents");
                    }
                }
            }

            // Stream reading loop
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                
                // Handle potential \r\n and split by standard SSE double-newline
                const normalizedBuffer = buffer.replace(/\r\n/g, "\n");
                const parts = normalizedBuffer.split("\n\n");
                buffer = parts.pop() || "";

                for (const chunk of parts) {
                    const lines = chunk.split("\n");
                    const dataStr = lines
                        .filter(l => l.startsWith("data:"))
                        .map(l => l.replace(/^data:\s?/, ""))
                        .join("\n");
                    
                    if (dataStr && dataStr !== "[DONE]") {
                        try {
                            const parsed: unknown = JSON.parse(dataStr)
                            if (!isMetaSopEventLike(parsed)) continue

                            const event = parsed as MetaSOPEvent
                            const { type, step_id } = event
                            
                            // Capture summaries & thoughts outside the steps state updater to avoid double-rendering issues
                            if (type === "step_thought" && step_id) {
                                const thought = typeof event.thought === 'string' ? event.thought : "";
                                if (thought) {
                                    setAgentThoughts(prev => ({
                                        ...prev,
                                        [step_id]: (prev[step_id] || "") + thought
                                    }));
                                }
                            } else if (type === "step_complete" && step_id) {
                                const summary = getStepCompletionSummary(step_id, event.artifact ?? null);
                                if (summary) {
                                    setStepSummaries(prev => ({ ...prev, [step_id]: summary }));
                                }
                            } else if (type === "orchestration_failed") {
                                throw new Error(event.error || "Orchestration failed");
                            }

                            handleEvent(event);
                        } catch (e) {
                            if (e instanceof SyntaxError) {
                                console.error("[useGEN] JSON Parse Error:", e, dataStr);
                            } else {
                                throw e; // Re-throw to catch block for actual errors
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error("[useGEN] GENERATION ERROR:", error instanceof Error ? error.message : error)
            setGenerationSteps((prev) => prev.map((step) => step.status === "running" ? { ...step, status: "failed" as const } : step))
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to generate diagram",
                variant: "destructive",
            })
        } finally {
            setIsGenerating(false)
            // Auto hide steps after 5s
            setTimeout(() => {
                setGenerationSteps(prev => prev.some(s => s.status === "running" || s.status === "pending") ? prev : [])
            }, 5000)
        }
    }, [prompt, selectedModel, isReasoningEnabled, uploadedDocuments, toast])

    const handleGenerate = async () => {
        const trimmedPrompt = prompt.trim()
        if (!trimmedPrompt || trimmedPrompt.length < 20) {
            toast({
                title: "Prompt too short",
                description: "Please provide at least 20 characters for better results",
                variant: "destructive",
            })
            return
        }

        if (!guidedMode) {
            await doStartGeneration()
            return
        }

        setIsScoping(true)
        try {
            const scopeRes = await fetchDiagramApi("/api/diagrams/scope", {
                method: "POST",
                body: JSON.stringify({ prompt: trimmedPrompt }),
                headers: { "Content-Type": "application/json" },
            })
            const scopeJson = await scopeRes.json().catch(() => ({}))
            const data = scopeJson?.data
            if (!scopeRes.ok) {
                toast({ title: "Scoping failed", description: scopeJson?.message || scopeRes.statusText, variant: "destructive" })
                return
            }
            if (data?.proceed === true) {
                await doStartGeneration()
                return
            }
            if (data?.proceed === false && Array.isArray(data?.questions) && data.questions.length > 0) {
                setClarificationQuestions(data.questions)
                setClarificationAnswers({})
                setShowClarificationPanel(true)
                return
            }
            await doStartGeneration()
        } catch (e) {
            toast({ 
                title: "Scoping failed", 
                description: e instanceof Error ? e.message : "Could not check scope", 
                variant: "destructive" 
            })
        } finally {
            setIsScoping(false)
        }
    }

    return {
        // State
        prompt, setPrompt,
        isGenerating,
        isScoping,
        guidedMode, setGuidedMode,
        selectedModel, setSelectedModel,
        isReasoningEnabled, setIsReasoningEnabled,
        clarificationQuestions,
        clarificationAnswers, setClarificationAnswers,
        showClarificationPanel, setShowClarificationPanel,
        uploadedDocuments,
        isUploading,
        generationSteps,
        stepSummaries,
        agentThoughts,
        currentDiagram, setCurrentDiagram,

        // Actions
        handleGenerate,
        doStartGeneration,
        handleFileUpload,
        removeDocument
    }
}
