"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { fetchDiagramApi } from "@/lib/api/diagram-fetch"
import { useToast } from "@/components/ui/use-toast"

export interface GenerationStep {
    step_id: string
    role: string
    status: "pending" | "running" | "success" | "failed"
    error?: string
    partial_response?: unknown
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
    metadata?: any
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

    const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])
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
            const savedModel = localStorage.getItem("metasop_selected_model")
            if (savedModel) setSelectedModel(savedModel)

            const savedReasoning = localStorage.getItem("metasop_reasoning_enabled")
            if (savedReasoning !== null) setIsReasoningEnabled(savedReasoning === "true")

            const savedGuided = localStorage.getItem("metasop_guided_mode")
            if (savedGuided !== null) setGuidedMode(savedGuided === "true")
        }
    }, [])

    // Persist changes
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

    const removeDocument = (index: number) => {
        setUploadedDocuments(prev => prev.filter((_, i) => i !== index))
    }

    const doStartGeneration = useCallback(async (answers?: Record<string, string>) => {
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

        const initialSteps: GenerationStep[] = [
            { step_id: "pm_spec", role: "Product Manager", status: "pending" },
            { step_id: "arch_design", role: "Architect", status: "pending" },
            { step_id: "security_architecture", role: "Security", status: "pending" },
            { step_id: "devops_infrastructure", role: "DevOps", status: "pending" },
            { step_id: "ui_design", role: "UI Designer", status: "pending" },
            { step_id: "engineer_impl", role: "Engineer", status: "pending" },
            { step_id: "qa_verification", role: "QA", status: "pending" },
        ]
        setGenerationSteps(initialSteps)

        try {
            const response = await fetchDiagramApi("/api/diagrams/generate", {
                method: "POST",
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    options: {
                        model: selectedModel,
                        reasoning: isReasoningEnabled,
                        includeStateManagement: true,
                        includeAPIs: true,
                        includeDatabase: true,
                    },
                    documents: uploadedDocuments,
                    ...(answers && Object.keys(answers).length > 0 ? { clarificationAnswers: answers } : {}),
                }),
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

            const handleEvent = (event: any) => {
                if (event.type === "step_start") {
                    stepStartTimesRef.current.set(event.step_id, Date.now())
                    activeStepIdRef.current = event.step_id
                    setGenerationSteps(prev =>
                        prev.map(s => s.step_id === event.step_id ? { ...s, status: "running" as const } : s)
                    )
                } else if (event.type === "step_thought") {
                    const thought = typeof event.thought === 'string' ? event.thought : ""
                    setAgentThoughts(prev => ({
                        ...prev,
                        [event.step_id]: (prev[event.step_id as string] || "") + thought
                    }))
                } else if (event.type === "step_complete") {
                    const summary = getStepCompletionSummary(event.step_id, event.artifact)
                    setStepSummaries(prev => ({ ...prev, [event.step_id]: summary }))

                    setGenerationSteps(prev => {
                        const step = prev.find(s => s.step_id === event.step_id)
                        if (!step) return prev

                        if (step.status === "pending") {
                            if (!stepStartTimesRef.current.has(event.step_id)) {
                                stepStartTimesRef.current.set(event.step_id, Date.now())
                            }

                            const timeoutId = setTimeout(() => {
                                setGenerationSteps(prevSteps => prevSteps.map(s =>
                                    s.step_id === event.step_id && s.status === "running"
                                        ? { ...s, status: "success" }
                                        : s
                                ))
                                stepStartTimesRef.current.delete(event.step_id)
                                pendingTimeoutsRef.current.delete(event.step_id)
                            }, 800)

                            pendingTimeoutsRef.current.set(event.step_id, timeoutId)
                            return prev.map(s => s.step_id === event.step_id ? { ...s, status: "running" as const } : s)
                        }

                        if (step.status === "running") {
                            const startTime = stepStartTimesRef.current.get(event.step_id) || Date.now()
                            const elapsed = Date.now() - startTime
                            const minDisplayTime = 800

                            const existingTimeout = pendingTimeoutsRef.current.get(event.step_id)
                            if (existingTimeout) {
                                clearTimeout(existingTimeout)
                                pendingTimeoutsRef.current.delete(event.step_id)
                            }

                            if (elapsed < minDisplayTime) {
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
                                return prev
                            } else {
                                stepStartTimesRef.current.delete(event.step_id)
                                return prev.map(s => s.step_id === event.step_id && s.status === "running" ? { ...s, status: "success" } : s)
                            }
                        }
                        return prev
                    })
                } else if (event.type === "step_failed") {
                    setGenerationSteps(prev => prev.map(s =>
                        s.step_id === event.step_id
                            ? { ...s, status: "failed", error: event.error, partial_response: event.partial_response }
                            : s
                    ))
                } else if (event.type === "orchestration_complete") {
                    const diagram = event.diagram
                    if (diagram) {
                        setCurrentDiagram({
                            id: diagram.id,
                            title: diagram.title,
                            description: diagram.description,
                            isGuest: diagram.metadata?.is_guest || diagram.id?.startsWith("guest_") || false,
                            metadata: diagram.metadata,
                        })
                    }
                    setGenerationSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "success" as const } : s))
                } else if (event.type === "orchestration_failed") {
                    throw new Error(event.error || "Orchestration failed")
                }
            }

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                let splitIndex = buffer.indexOf("\n\n")
                while (splitIndex !== -1) {
                    const chunk = buffer.slice(0, splitIndex)
                    buffer = buffer.slice(splitIndex + 2)

                    const lines = chunk.split("\n")
                    const dataLines = lines.filter(line => line.startsWith("data:"))
                    if (dataLines.length > 0) {
                        const dataStr = dataLines.map(line => line.replace(/^data:\s?/, "")).join("\n")
                        if (dataStr && dataStr !== "[DONE]") {
                            try {
                                const event = JSON.parse(dataStr)
                                handleEvent(event)
                            } catch (e) {
                                console.error("Error parsing stream event:", e, dataStr)
                            }
                        }
                    }

                    splitIndex = buffer.indexOf("\n\n")
                }
            }
        } catch (error: any) {
            setGenerationSteps((prev) => prev.map((step) => step.status === "running" ? { ...step, status: "failed" as const } : step))
            toast({
                title: "Error",
                description: error.message || "Failed to generate diagram",
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
        if (!prompt.trim() || prompt.length < 20) {
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
                await doStartGeneration()
                return
            }
            if (data?.needClarification === true && Array.isArray(data?.questions) && data.questions.length > 0) {
                setClarificationQuestions(data.questions)
                setClarificationAnswers({})
                setShowClarificationPanel(true)
                return
            }
            await doStartGeneration()
        } catch (e: any) {
            toast({ title: "Scoping failed", description: e?.message || "Could not check scope", variant: "destructive" })
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
