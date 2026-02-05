"use client"

import { useState, useRef } from "react"
import {
    Sparkles,
    HelpCircle,
    Brain,
    FileText,
    Cpu,
    Zap,
    Paperclip,
    Loader2,
    X,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VoiceInputButton } from "@/components/ui/voice-input-button"

interface PromptInputProps {
    prompt: string
    onPromptChange: (val: string) => void
    onGenerate: () => void
    isGenerating: boolean
    isScoping: boolean
    guidedMode: boolean
    onToggleGuided: (val: boolean) => void
    selectedModel: string
    onSelectModel: (val: string) => void
    isReasoningEnabled: boolean
    onToggleReasoning: (val: boolean) => void
    uploadedDocuments: any[]
    onRemoveDocument: (idx: number) => void
    onFileUpload: (file: File) => void
    isUploading?: boolean
}

export function PromptInput({
    prompt,
    onPromptChange,
    onGenerate,
    isGenerating,
    isScoping,
    guidedMode,
    onToggleGuided,
    selectedModel,
    onSelectModel,
    isReasoningEnabled,
    onToggleReasoning,
    uploadedDocuments,
    onRemoveDocument,
    onFileUpload,
    isUploading = false
}: PromptInputProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onFileUpload(file)
        }
    }

    return (
        <div className="absolute bottom-0 left-0 right-0 z-40 p-4">
            <div className="max-w-3xl mx-auto">
                <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden relative">
                    {!isCollapsed && (
                        <>
                            <Textarea
                                id="prompt"
                                placeholder="Describe your application in plain English…"
                                value={prompt}
                                onChange={(e) => onPromptChange(e.target.value)}
                                className="min-h-[52px] max-h-[140px] resize-none text-sm rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 pt-3 pb-2 placeholder:text-muted-foreground/70"
                                disabled={isGenerating || isScoping}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        if (prompt.trim().length >= 20 && !isGenerating && !isScoping) {
                                            onGenerate()
                                        }
                                    }
                                }}
                            />
                        </>
                    )}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute top-2 left-2 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all z-50"
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    <div className={cn(
                        "flex items-center justify-between gap-4 px-3 py-2 border-t border-border/50 bg-muted/30",
                        isCollapsed && "border-t-0 py-1.5"
                    )}>
                        <div className="flex items-center gap-3 min-w-0">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
                                            <Switch
                                                id="guided-mode"
                                                checked={guidedMode}
                                                onCheckedChange={onToggleGuided}
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

                            <Select value={selectedModel} onValueChange={onSelectModel}>
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
                                                onCheckedChange={onToggleReasoning}
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
                                <div className="flex items-center gap-1">
                                    {uploadedDocuments.map((doc, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-[10px] py-0.5 px-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 flex items-center gap-1">
                                            <FileText className="h-2.5 w-2.5" />
                                            <span className="max-w-20 truncate">{doc.name}</span>
                                            <button onClick={() => onRemoveDocument(idx)} className="hover:text-red-500">
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
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
                                onTranscription={(text) => onPromptChange(prompt + (prompt ? " " : "") + text)}
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
                                onClick={onGenerate}
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
    )
}
