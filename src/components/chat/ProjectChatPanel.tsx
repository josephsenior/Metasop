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
    Paperclip,
    // X removed (unused)
} from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchDiagramApi } from "@/lib/api/diagram-fetch"
import { useToast } from "@/components/ui/use-toast"
import { generateAgentContextMarkdown, getOptimizedSteps } from "@/lib/metasop/utils/export-context"
import { v4 as uuidv4 } from "uuid"

import type { ChatHistoryMessage, ChatMessage } from "@/types/chat"
import type { UploadedDocument } from "@/types/diagram"
import type { MetaSOPResult } from "@/lib/metasop/types"

interface ProjectChatPanelProps {
    diagramId?: string
    artifacts: MetaSOPResult["artifacts"]
    activeTab?: string
    initialHistory?: ChatHistoryMessage[]
    onRefineComplete?: (result?: any) => void
    onClose?: () => void
}

export function ProjectChatPanel({
    diagramId,
    artifacts,
    activeTab = "all",
    initialHistory = [],
    onRefineComplete,
    onClose: _onClose
}: ProjectChatPanelProps) {
    const { toast } = useToast()
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (initialHistory && initialHistory.length > 0) {
            return initialHistory.map(m => ({
                ...m,
                timestamp: new Date(m.timestamp)
            }))
        }
        return [{
            id: "1",
            role: "assistant",
            content: "Hello! I'm Blueprinta, your AI Architect. I have full context of your blueprints. You can ask me questions about the design, or tell me to refine specific parts of the project.",
            type: "system",
            timestamp: new Date()
        }]
    })
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isRefining, setIsRefining] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [transientDocuments, setTransientDocuments] = useState<UploadedDocument[]>([])
    const [cacheId, setCacheId] = useState<string | undefined>(undefined)
    const [isInputHidden, _setIsInputHidden] = useState(false)
    const statusLabel = isLoading || isRefining ? "Working" : "Ready"
    
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

    const saveMessage = async (msg: ChatMessage) => {
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

        const userMessage: ChatMessage = {
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error"
            setMessages(prev => [...prev, {
                id: uuidv4(),
                role: "assistant",
                content: `Sorry, I encountered an error: ${message}`,
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
        const streamingMessage: ChatMessage = {
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
                    diagramId: diagramId ?? "",
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error"
            // Update the streaming message with error
            setMessages(prev => prev.map(msg =>
                msg.id === streamingMessageId
                    ? { ...msg, content: `Sorry, I encountered an error: ${message}` }
                    : msg
            ))

            toast({
                title: "Chat Error",
                description: message || "Failed to get answer",
                variant: "destructive"
            })
        }
    }

    const handleRefinement = async (instruction: string) => {
        setIsRefining(true)
        const refinementMessageId = uuidv4()
        const placeholderMessage: ChatMessage = {
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

            // If the refinement applied edits, update the parent state
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
        <div className="flex flex-col h-full bg-card/90 border border-border/60 rounded-2xl overflow-hidden shadow-lg shadow-black/10 relative z-40 w-full min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-background/70 backdrop-blur">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold tracking-[0.15em] uppercase text-foreground">Blueprinta Console</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                            <span className={cn(
                                "inline-flex items-center gap-1",
                                isLoading || isRefining ? "text-amber-500" : "text-emerald-500"
                            )}>
                                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                                {statusLabel}
                            </span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{transientDocuments.length} context file{transientDocuments.length === 1 ? "" : "s"}</span>
                        </div>
                    </div>
                </div>
                {/* Close button intentionally removed per design request */}
            </div>

            {/* Chat Area */}
            <div
                className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar relative bg-background/70"
                ref={scrollRef}
            >
                <div aria-hidden="true" className="absolute inset-0 pointer-events-none blueprint-grid" />
                {/* Subtle vignette to add depth without heavy color overlays */}
                <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-linear-to-b from-black/4 to-transparent" />
                <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                >
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-foreground/10 font-mono">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Blueprint Channel</span>
                    </div>
                </div>
                <div className="flex flex-col gap-4 min-h-full relative z-10">
                    {(() => {
                        const visibleMessages = messages.filter((msg) => msg.type !== "system")

                        if (visibleMessages.length === 0 && !isLoading && !isRefining) {
                            return (
                                <div className="mx-auto mt-10 w-full max-w-[520px] px-2">
                                    <div className="flex flex-col items-center text-center">
                                        <img
                                            src="/icon.svg"
                                            alt=""
                                            aria-hidden="true"
                                            className="h-12 w-12 opacity-60"
                                        />
                                        <div className="mt-4 text-[12px] text-muted-foreground leading-relaxed">
                                            Ask a question, request a refinement, or attach a file to add context.
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        return visibleMessages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex flex-col max-w-[94%]",
                                msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                        >
                            <div className={cn(
                                "flex items-center gap-2 mb-1",
                                msg.role === "user" ? "flex-row-reverse" : "flex-row"
                            )}>
                                {msg.role === "assistant" ? (
                                    <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                                        <Bot className="h-3.5 w-3.5 text-blue-500" />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-lg bg-foreground/5 border border-border/60 flex items-center justify-center">
                                        <User className="h-3.5 w-3.5 text-foreground/70" />
                                    </div>
                                )}
                                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground font-mono">
                                    {msg.role === "assistant" ? "Architect" : "Operator"}
                                </span>
                                {msg.type === "refinement" && (
                                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-500">Refine</span>
                                )}
                                {msg.type === "system" && (
                                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-500">System</span>
                                )}
                            </div>

                            <div className={cn(
                                "p-3 rounded-xl text-[12px] leading-relaxed shadow-sm border",
                                msg.role === "user"
                                    ? "bg-blue-600/90 text-white border-blue-400/30 rounded-tr-sm"
                                    : cn(
                                        "bg-background/80 text-foreground border-border/60 rounded-tl-sm",
                                        msg.type === "refinement" && "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
                                        msg.type === "system" && "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400"
                                    )
                            )}>
                                {msg.content}
                                {/* details removed: Show details toggle intentionally omitted */}
                                {msg.type === "refinement" && isRefining && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span className="text-[10px] font-medium italic text-muted-foreground">Agents are working...</span>
                                    </div>
                                )}
                            </div>
                            <span className="text-[9px] text-muted-foreground/60 mt-1 px-1 font-mono">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        ))
                    })()}
                    {isLoading && !isRefining && (
                        <div className="flex items-center gap-2 text-muted-foreground animate-pulse ml-2">
                            <Bot className="h-4 w-4" />
                            <span className="text-[10px] font-medium font-mono">Architect is thinking...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area (hidden after successful generation/refinement) */}
            {!isInputHidden && (
                <div className="p-3 border-t border-border/60 bg-background/80 backdrop-blur">
                    <form onSubmit={handleSendMessage} className="flex items-end">
                        <div className="relative flex-1">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question or request a refinement…"
                                className="h-10 bg-background border-border/60 focus-visible:ring-blue-500/30 text-[12px] rounded-xl shadow-inner pr-31"
                                disabled={isLoading || isRefining}
                            />
                            <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-blue-500"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading || isRefining || isUploading}
                                    aria-label="Attach file"
                                    title="Attach file"
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
                                    aria-label="Upload context documents"
                                    title="Upload context documents"
                                />
                                <VoiceInputButton
                                    onTranscription={(text) => setInput(prev => prev + (prev ? " " : "") + text)}
                                    disabled={isLoading || isRefining || isUploading}
                                    className="h-8 w-8 shrink-0"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!input.trim() || isLoading || isRefining || isUploading}
                                    className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
                                    aria-label="Send message"
                                    title="Send"
                                >
                                    {isLoading || isRefining ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
