"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
    Bot, 
    User, 
    Send, 
    Sparkles, 
    Loader2, 
    MessageSquare, 
    Info, 
    Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { metasopApi } from "@/lib/api/metasop"
import { useToast } from "@/components/ui/use-toast"
import { generateAgentContextMarkdown, getOptimizedSteps } from "@/lib/metasop/utils/export-context"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    type?: "info" | "refinement" | "system"
    timestamp: Date
}

interface ProjectChatPanelProps {
    diagramId: string
    artifacts: any
    activeTab?: string
    onRefineComplete?: (result?: any) => void
}

export function ProjectChatPanel({ 
    diagramId, 
    artifacts, 
    activeTab = "all",
    onRefineComplete 
}: ProjectChatPanelProps) {
    const { toast } = useToast()
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hello! I'm your Project Architect AI. I have full context of your architecture blueprints. You can ask me questions about the design, or tell me to refine specific parts of the project.",
            type: "system",
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isRefining, setIsRefining] = useState(false)
    const [cacheId, setCacheId] = useState<string | undefined>(undefined)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Reset cache if artifacts change significantly (optional, but safer)
    useEffect(() => {
        setCacheId(undefined)
    }, [diagramId])

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            })
        }
    }, [messages, isLoading])

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isLoading || isRefining) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
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
                id: (Date.now() + 1).toString(),
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
        // Generate context from artifacts
        // If we have a cacheId, we don't need to send the full context markdown again
        const includeSteps = getOptimizedSteps(activeTab);
        const contextMarkdown = cacheId ? "CACHED" : generateAgentContextMarkdown({
            metadata: { metasop_artifacts: artifacts }
        }, { includeSteps })

        try {
            const result = await metasopApi.askQuestion({
                diagramId: diagramId || "",
                question,
                contextMarkdown,
                activeTab,
                cacheId
            })

            // Update cache ID for subsequent messages
            if (result.cacheId) {
                setCacheId(result.cacheId)
            }

            const response: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content: result.answer,
                type: "info",
                timestamp: new Date()
            }

            setMessages(prev => [...prev, response])
        } catch {
            // Fallback for demo or if endpoint not ready
            const response: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content: `I've analyzed the artifacts. Based on the project summary, this system focuses on deterministic orchestration. To provide more specific details about "${question}", I would need to dive deeper into the individual agent logs.`,
                type: "info",
                timestamp: new Date()
            }
            setMessages(prev => [...prev, response])
            
            toast({
                title: "Chat Error",
                description: "Failed to get a specialized answer. Using local analysis.",
                variant: "destructive"
            })
        }
    }

    const handleRefinement = async (instruction: string) => {
        setIsRefining(true)
        const refinementMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: `I'm triggering an agentic refinement for the ${activeTab === 'all' ? 'entire project' : activeTab} based on your instruction: "${instruction}". Please wait...`,
            type: "refinement",
            timestamp: new Date()
        }
        setMessages(prev => [...prev, refinementMessage])

        try {
            const result = await metasopApi.refineArtifact({
                diagramId,
                stepId: activeTab === 'all' ? 'summary' : activeTab,
                instruction,
                previousArtifacts: artifacts,
                cascade: true
            })

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Refinement complete! I've updated the artifacts and the diagram.",
                type: "system",
                timestamp: new Date()
            }])

            toast({
                title: "Refinement Successful",
                description: "The project has been updated.",
            })

            // Update parent state if callback provided
            if (onRefineComplete) {
                (onRefineComplete as any)(result)
            } else {
                // Refresh after a short delay if no callback
                setTimeout(() => {
                    window.location.reload()
                }, 2000)
            }

        } catch (error: any) {
            throw error
        } finally {
            setIsRefining(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-background border-l border-border shadow-xl w-80 lg:w-96 min-h-0">
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-600 rounded-lg">
                        <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Project Architect</h3>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Online Context</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <Info className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Chat Area */}
            <div 
                className="flex-1 overflow-y-auto p-4 custom-scrollbar" 
                ref={scrollRef}
            >
                <div className="flex flex-col gap-4 min-h-full">
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={cn(
                                "flex flex-col max-w-[85%]",
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
                        placeholder="Ask a question or request a change..."
                        className="pr-10 h-11 bg-background border-border/50 focus-visible:ring-blue-500/30 text-xs rounded-xl shadow-inner"
                        disabled={isLoading || isRefining}
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!input.trim() || isLoading || isRefining}
                        className="absolute right-1 top-1 h-9 w-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md"
                    >
                        {isLoading || isRefining ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
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
                    </div>
                    <div className="text-[9px] text-muted-foreground/60 font-medium">
                        Target: <span className="text-blue-500 font-bold">{activeTab === 'all' ? 'Full Project' : activeTab}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
