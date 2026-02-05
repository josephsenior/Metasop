"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VoiceInputButton } from "@/components/ui/voice-input-button"
import {
    Bot,
    User,
    Send,
    Sparkles,
    Loader2,
    MessageSquare,
    Paperclip
} from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchDiagramApi } from "@/lib/api/diagram-fetch"
import { useToast } from "@/components/ui/use-toast"
import { generateAgentContextMarkdown, getOptimizedSteps } from "@/lib/metasop/utils/export-context"
import { v4 as uuidv4 } from "uuid"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    type?: "info" | "refinement" | "system"
    detail?: string
    timestamp: Date
}

interface ProjectChatPanelProps {
    diagramId?: string
    artifacts: any
    activeTab?: string
    initialHistory?: Message[]
    onRefineComplete?: (result?: any) => void
    onClose?: () => void
}

export function ProjectChatPanel({
    diagramId,
    artifacts,
    activeTab = "all",
    initialHistory = [],
    onRefineComplete
}: ProjectChatPanelProps) {
    const { toast } = useToast()
    const [messages, setMessages] = useState<Message[]>(() => {
        if (initialHistory && initialHistory.length > 0) {
            return initialHistory.map(m => ({
                ...m,
                timestamp: new Date(m.timestamp)
            }))
        }
        return [{
            id: "1",
            role: "assistant",
            content: "Hello! I'm your Project Architect AI. I have full context of your architecture blueprints. You can ask me questions about the design, or tell me to refine specific parts of the project.",
            type: "system",
            timestamp: new Date()
        }]
    })
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isRefining, setIsRefining] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [transientDocuments, setTransientDocuments] = useState<any[]>([])
    const [cacheId, setCacheId] = useState<string | undefined>(undefined)
    const [showSystemMessages, setShowSystemMessages] = useState(false)
    const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({})
    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Reset cache if artifacts or diagramId change (prevents stale context)
    useEffect(() => {
        setCacheId(undefined)
    }, [diagramId, artifacts])

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            })
        }
    }, [messages, isLoading])

    const saveMessage = async (msg: Message) => {
        if (!diagramId) return
        try {
            await fetchDiagramApi(`/api/diagrams/${diagramId}/messages`, {
                method: "POST",
                body: JSON.stringify({ message: msg })
            })
        } catch (err) {
            console.error("Failed to save message:", err)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            // Read file content
            const reader = new FileReader()
            reader.onload = async (event) => {
                const content = event.target?.result as string

                const newDoc = {
                    name: file.name,
                    type: file.name.split('.').pop() || 'txt',
                    content: content
                }

                setTransientDocuments(prev => [...prev, newDoc])

                toast({
                    title: "Context Added",
                    description: `${file.name} added to current chat context.`,
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

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isLoading || isRefining) return

        const userMessage: Message = {
            id: uuidv4(),
            role: "user",
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        saveMessage(userMessage) // Save user message immediately
        const currentInput = input
        setInput("")
        setIsLoading(true)

        // Check if the input looks like a refinement request
        // Refinement requests typically contain action verbs or specific instructions to change the design
        const refinementVerbs = [
            "change", "add", "remove", "update", "refine", "fix", "improve",
            "modify", "adjust", "create", "delete", "implement", "set",
            "make", "rewrite", "incorporate", "expand", "reduce"
        ]

        const isRefinementRequest = refinementVerbs.some(verb =>
            currentInput.toLowerCase().includes(verb)
        )

        try {
            if (isRefinementRequest) {
                await handleRefinement(currentInput)
            } else {
                await handleQuestion(currentInput)
            }
        } catch (error: any) {
            setMessages(prev => [...prev, {
                id: uuidv4(),
                role: "assistant",
                content: `Sorry, I encountered an error: ${error.message}`,
                type: "system",
                timestamp: new Date()
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleQuestion = async (question: string) => {
        // Generate context from artifacts and documents
        // If we have a cacheId, we don't need to send the full context markdown again
        const includeSteps = getOptimizedSteps(activeTab);


        const contextMarkdown = cacheId ? "" : generateAgentContextMarkdown({
            metadata: { metasop_artifacts: artifacts },
            documents: transientDocuments
        }, { includeSteps })



        // Build conversation history (last 3 user-assistant pairs for context)
        const conversationHistory = messages
            .filter(msg => msg.type !== "system" && msg.type !== "refinement")
            .slice(-6) // Last 6 messages (3 pairs)
            .map(msg => `${msg.role === "user" ? "USER" : "ASSISTANT"}: ${msg.content}`)
            .join("\n\n")

        // Create a placeholder message for streaming
        const streamingMessageId = uuidv4();
        const streamingMessage: Message = {
            id: streamingMessageId,
            role: "assistant",
            content: "",
            type: "info",
            timestamp: new Date()
        }
        setMessages(prev => [...prev, streamingMessage])

        try {
            // Use streaming API
            const response = await fetchDiagramApi(`/api/diagrams/ask?stream=true`, {
                method: "POST",
                body: JSON.stringify({
                    diagramId: diagramId || "",
                    question,
                    contextMarkdown,
                    activeTab,
                    cacheId,
                    conversationHistory: conversationHistory || undefined
                })
            })

            if (!response.ok) {
                throw new Error(`Failed to get answer: ${response.statusText}`)
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error("No response body")

            const decoder = new TextDecoder()
            let buffer = ""
            let fullAnswer = ""
            let streamComplete = false

            try {
                while (true) {
                    const { done, value } = await reader.read()

                    if (done) {
                        // Process any remaining buffer before closing
                        if (buffer.trim()) {
                            const lines = buffer.split("\n").filter(l => l.trim())
                            for (const line of lines) {
                                try {
                                    const event = JSON.parse(line.trim())
                                    if (event.type === "chunk" && event.content) {
                                        fullAnswer += event.content
                                    }
                                } catch {
                                    // Skip invalid JSON in final buffer
                                }
                            }
                        }
                        break
                    }

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split("\n")
                    buffer = lines.pop() || "" // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (!line.trim()) continue

                        try {
                            const event = JSON.parse(line.trim())

                            if (event.type === "chunk") {
                                if (event.content) {
                                    fullAnswer += event.content
                                    // Update the streaming message immediately
                                    setMessages(prev => prev.map(msg =>
                                        msg.id === streamingMessageId
                                            ? { ...msg, content: fullAnswer }
                                            : msg
                                    ))
                                }
                            } else if (event.type === "complete") {
                                streamComplete = true
                                // Update cache ID if provided
                                if (event.cacheId) {
                                    setCacheId(event.cacheId)
                                }

                                // Save assistant response when complete
                                saveMessage({
                                    id: streamingMessageId,
                                    role: "assistant",
                                    content: fullAnswer,
                                    type: "info",
                                    timestamp: new Date()
                                })
                            } else if (event.type === "error") {
                                throw new Error(event.message || "Stream error occurred")
                            }
                        } catch (parseError: any) {
                            // Log parse errors for debugging but continue processing
                            if (parseError.message && !parseError.message.includes("JSON")) {
                                // Re-throw non-JSON parse errors
                                throw parseError
                            }
                            // Skip invalid JSON lines
                            continue
                        }
                    }
                }

                // Ensure final answer is set even if stream ended without "complete" event
                if (fullAnswer && !streamComplete) {
                    setMessages(prev => prev.map(msg =>
                        msg.id === streamingMessageId
                            ? { ...msg, content: fullAnswer }
                            : msg
                    ))
                }
            } finally {
                // Ensure reader is released
                reader.releaseLock()
            }
        } catch (error: any) {
            // Update the streaming message with error
            setMessages(prev => prev.map(msg =>
                msg.id === streamingMessageId
                    ? { ...msg, content: `Sorry, I encountered an error: ${error.message}` }
                    : msg
            ))

            toast({
                title: "Chat Error",
                description: error.message || "Failed to get answer",
                variant: "destructive"
            })
        }
    }

    const handleRefinement = async (instruction: string) => {
        setIsRefining(true)
        const refinementMessageId = uuidv4()
        const placeholderMessage: Message = {
            id: refinementMessageId,
            role: "assistant",
            content: "🔍 Analyzing your request...",
            type: "refinement",
            timestamp: new Date()
        }
        setMessages(prev => [...prev, placeholderMessage])

        try {
            // Use streaming endpoint
            const res = await fetchDiagramApi("/api/diagrams/artifacts/refine?stream=true", {
                method: "POST",
                body: JSON.stringify({
                    intent: instruction,
                    previousArtifacts: artifacts ?? {},
                    chatHistory: messages
                        .filter(m => m.type !== "system")
                        .slice(-6)
                        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
                        .join("\n\n"),
                    activeTab
                }),
                headers: { "Content-Type": "application/json" },
            })

            if (!res.ok) {
                throw new Error(res.statusText || "Refinement failed")
            }

            const reader = res.body?.getReader()
            if (!reader) throw new Error("No response body")

            const decoder = new TextDecoder()
            let buffer = ""
            let finalArtifacts: any = null
            let changelog: any[] = []

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split("\n")
                buffer = lines.pop() || ""

                for (const line of lines) {
                    if (!line.trim()) continue

                    try {
                        const event = JSON.parse(line.trim())

                        switch (event.type) {
                            case "analyzing":
                                setMessages(prev => prev.map(msg =>
                                    msg.id === refinementMessageId
                                        ? { ...msg, content: "🔍 Analyzing your request..." }
                                        : msg
                                ))
                                break

                            case "plan_ready":
                                const { edits_count, artifacts_affected, reasoning } = event.payload
                                setMessages(prev => prev.map(msg =>
                                    msg.id === refinementMessageId
                                        ? {
                                            ...msg,
                                            content: `📋 Plan ready: ${edits_count} change(s) across ${artifacts_affected.join(", ")}`,
                                            detail: reasoning
                                        }
                                        : msg
                                ))
                                break

                            case "applying":
                                setMessages(prev => prev.map(msg =>
                                    msg.id === refinementMessageId
                                        ? { ...msg, content: "⚡ Applying changes..." }
                                        : msg
                                ))
                                break

                            case "artifact_updated":
                                // Optional: could show per-artifact updates
                                break

                            case "complete":
                                finalArtifacts = event.payload.updated_artifacts
                                changelog = event.payload.changelog || []
                                const applied = event.payload.applied ?? 0

                                const changelogSummary = applied > 0
                                    ? changelog.slice(0, 3)
                                        .map((c: any) => `• **${c.artifact}**: ${c.change}`)
                                        .join("\n")
                                    : ""
                                const moreText = applied > 0 && changelog.length > 3
                                    ? `\n_...and ${changelog.length - 3} more_`
                                    : ""

                                if (applied > 0) {
                                    const fullChangelog = changelog
                                        .map((c: any) => `• ${c.artifact}: ${c.change}`)
                                        .join("\n")
                                    setMessages(prev => prev.map(msg =>
                                        msg.id === refinementMessageId
                                            ? {
                                                ...msg,
                                                content: `✅ Applied ${applied} edit(s)\n\n${changelogSummary}${moreText}`,
                                                detail: fullChangelog
                                            }
                                            : msg
                                    ))
                                } else {
                                    setMessages(prev => prev.map(msg =>
                                        msg.id === refinementMessageId
                                            ? { ...msg, content: event.payload.message || "No changes needed." }
                                            : msg
                                    ))
                                }

                                // Save refinement result message
                                const finalRefineMsg = {
                                    id: refinementMessageId,
                                    role: "assistant" as const,
                                    content: applied > 0
                                        ? `✅ Applied ${applied} edit(s)\n\n${changelogSummary}${moreText}`
                                        : (event.payload.message || "No changes needed."),
                                    detail: applied > 0
                                        ? changelog.map((c: any) => `• ${c.artifact}: ${c.change}`).join("\n")
                                        : undefined,
                                    type: "refinement" as const,
                                    timestamp: new Date()
                                }
                                saveMessage(finalRefineMsg)
                                break

                            case "error":
                                throw new Error(event.payload.message)
                        }
                    } catch (parseError: any) {
                        if (!parseError.message?.includes("JSON")) {
                            throw parseError
                        }
                    }
                }
            }

            // Update artifacts in parent if we got results
            if (finalArtifacts) {
                onRefineComplete?.({ artifacts: finalArtifacts })
                if (changelog.length > 0) {
                    toast({
                        title: "Refinement applied",
                        description: `${changelog.length} change(s) made.`,
                    })
                }
            }

        } catch (error: any) {
            setMessages(prev => prev.map(msg =>
                msg.id === refinementMessageId
                    ? { ...msg, content: `❌ ${error?.message || "Refinement failed"}` }
                    : msg
            ))
            toast({
                title: "Refinement failed",
                description: error?.message || "Something went wrong.",
                variant: "destructive",
            })
        } finally {
            setIsRefining(false)
        }
    }


    return (
        <div className="flex flex-col h-full bg-background relative z-40 w-full min-h-0">


            {/* Chat Area */}
            <div
                className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar"
                ref={scrollRef}
            >
                <div className="flex flex-col gap-4 min-h-full">
                    {messages
                        .filter((msg) => showSystemMessages || msg.type !== "system")
                        .map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex flex-col max-w-[96%]",
                                msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                        >
                            <div className={cn(
                                "flex items-center gap-1.5 mb-1",
                                msg.role === "user" ? "flex-row-reverse" : "flex-row"
                            )}>
                                {msg.role === "assistant" ? (
                                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Bot className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <User className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                                    </div>
                                )}
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                    {msg.role === "assistant" ? "Architect" : "You"}
                                </span>
                            </div>

                            <div className={cn(
                                "p-3 rounded-2xl text-xs leading-relaxed shadow-sm",
                                msg.role === "user"
                                    ? "bg-blue-600 text-white rounded-tr-none"
                                    : cn(
                                        "bg-muted/50 text-foreground border border-border/50 rounded-tl-none",
                                        msg.type === "refinement" && "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
                                        msg.type === "system" && "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400"
                                    )
                            )}>
                                {msg.content}
                                {msg.type === "refinement" && msg.detail && (
                                    <div className="mt-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[10px] text-amber-700 dark:text-amber-300"
                                            onClick={() => setExpandedDetails(prev => ({
                                                ...prev,
                                                [msg.id]: !prev[msg.id]
                                            }))}
                                        >
                                            {expandedDetails[msg.id] ? "Hide details" : "Show details"}
                                        </Button>
                                        {expandedDetails[msg.id] && (
                                            <div className="mt-2 text-[10px] text-amber-700/80 dark:text-amber-300/80 whitespace-pre-line">
                                                {msg.detail}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {msg.type === "refinement" && isRefining && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span className="text-[10px] font-medium italic">Agents are working...</span>
                                    </div>
                                )}
                            </div>
                            <span className="text-[9px] text-muted-foreground/50 mt-1 px-1">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    {isLoading && !isRefining && (
                        <div className="flex items-center gap-2 text-muted-foreground animate-pulse ml-2">
                            <Bot className="h-4 w-4" />
                            <span className="text-[10px] font-medium">Architect is thinking...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-muted/20">
                <form onSubmit={handleSendMessage} className="relative">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="pr-26 h-11 bg-background border-border/50 focus-visible:ring-blue-500/30 text-[11px] rounded-xl shadow-inner"
                        disabled={isLoading || isRefining}
                    />
                    <div className="absolute right-2 top-1.5 flex items-center gap-1.5 z-10">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-blue-500 shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || isRefining || isUploading}
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
                            onTranscription={(text) => setInput(prev => prev + (prev ? " " : "") + text)}
                            disabled={isLoading || isRefining || isUploading}
                            className="h-9 w-9 shrink-0"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isLoading || isRefining || isUploading}
                            className="h-9 w-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shrink-0"
                        >
                            {isLoading || isRefining ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </form>
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity cursor-help">
                            <Sparkles className="h-3 w-3 text-blue-500" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">AI Refine</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity cursor-help">
                            <MessageSquare className="h-3 w-3 text-emerald-500" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">RAG Context</span>
                        </div>
                        {messages.some(m => m.type === "system") && (
                            <button
                                type="button"
                                className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter opacity-60 hover:opacity-100"
                                onClick={() => setShowSystemMessages(prev => !prev)}
                            >
                                {showSystemMessages ? "Hide system" : "Show system"}
                            </button>
                        )}
                    </div>
                    <div className="text-[9px] text-muted-foreground/60 font-medium">
                        Target: <span className="text-blue-500 font-bold">{activeTab === 'all' ? 'Full Project' : activeTab}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
