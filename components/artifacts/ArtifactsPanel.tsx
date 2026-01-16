"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, FileText, Shield, Server, Code, Palette, CheckCircle, User, Download, Archive, ChevronDown, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Send, Loader2, Sparkles as SparklesIcon } from "lucide-react"
import { metasopApi } from "@/lib/api/metasop"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { downloadFile } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import all artifact display components
import ProjectSummary from "@/components/artifacts/ProjectSummary"
import PMSpecArtifact from "@/components/artifacts/pm_spec"
import ArchDesignArtifact from "@/components/artifacts/arch_design"
import DevOpsArtifact from "@/components/artifacts/devops_infrastructure"
import SecurityArtifact from "@/components/artifacts/security_architecture"
import EngineerArtifact from "@/components/artifacts/engineer_impl"
import UIDesignArtifact from "@/components/artifacts/ui_design"
import QAArtifact from "@/components/artifacts/qa_verification"

interface ArtifactsPanelProps {
    diagramId?: string
    artifacts: {
        pm_spec?: any
        arch_design?: any
        devops_infrastructure?: any
        security_architecture?: any
        engineer_impl?: any
        ui_design?: any
        qa_verification?: any
    }
    steps?: any[]
    className?: string
}

const agentTabs = [
    { id: "summary", label: "Summary", icon: LayoutDashboard, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { id: "pm_spec", label: "PM", icon: User, color: "text-purple-600", bgColor: "bg-purple-500/10" },
    { id: "arch_design", label: "Architect", icon: FileText, color: "text-blue-600", bgColor: "bg-blue-500/10" },
    { id: "devops_infrastructure", label: "DevOps", icon: Server, color: "text-green-600", bgColor: "bg-green-500/10" },
    { id: "security_architecture", label: "Security", icon: Shield, color: "text-red-600", bgColor: "bg-red-500/10" },
    { id: "ui_design", label: "UI Designer", icon: Palette, color: "text-pink-600", bgColor: "bg-pink-500/10" },
    { id: "engineer_impl", label: "Engineer", icon: Code, color: "text-orange-600", bgColor: "bg-orange-500/10" },
    { id: "qa_verification", label: "QA", icon: CheckCircle, color: "text-teal-600", bgColor: "bg-teal-500/10" },
]

export function ArtifactsPanel({ diagramId, artifacts, steps, className = "" }: ArtifactsPanelProps) {
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState("summary")
    const [instruction, setInstruction] = useState("")
    const [isRefining, setIsRefining] = useState(false)
    const [refineTarget, setRefineTarget] = useState<string>("all")
    const [cascade, setCascade] = useState(true)

    const handleRefine = async () => {
        if (!instruction.trim() || !diagramId) return

        try {
            setIsRefining(true)
            toast({
                title: "Refining Project",
                description: `AI agents (${refineTarget}) are updating the system...`,
            })

            await metasopApi.refineArtifact({
                diagramId,
                stepId: refineTarget === "all" ? activeTab : refineTarget,
                instruction,
                previousArtifacts: artifacts,
                cascade
            })

            toast({
                title: "Refinement Complete",
                description: "The system has been updated.",
            })

            window.location.reload()
        } catch (error: any) {
            toast({
                title: "Refinement Failed",
                description: error.message || "Failed to refine.",
                variant: "destructive",
            })
        } finally {
            setIsRefining(false)
            setInstruction("")
        }
    }

    const availableTabs = agentTabs.filter((tab) => tab.id === "summary" || !!artifacts[tab.id as keyof typeof artifacts])
    const currentTab = agentTabs.find(t => t.id === activeTab) || agentTabs[0]
    const Icon = currentTab.icon

    const handleExportAll = () => {
        const data = JSON.stringify(artifacts, null, 2)
        downloadFile(data, `metasop-project-${diagramId?.substring(0, 8)}.json`, "application/json")
        toast({
            title: "Project Exported",
            description: "All artifacts downloaded as JSON.",
        })
    }

    const handleExportMarkdown = () => {
        let md = `# Project Specification: ${diagramId}\n\n`

        agentTabs.forEach(tab => {
            const data = artifacts[tab.id as keyof typeof artifacts]
            if (data) {
                md += `## ${tab.label}\n\n`
                md += `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n\n`
            }
        })

        downloadFile(md, `metasop-spec-${diagramId?.substring(0, 8)}.md`, "text/markdown")
        toast({
            title: "Markdown Exported",
            description: "Technical specification downloaded.",
        })
    }

    if (availableTabs.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4 mx-auto" />
                    <p className="text-sm font-medium text-foreground">Awaiting Agent Reports</p>
                    <p className="text-xs text-muted-foreground mt-2 max-w-[200px] mx-auto">
                        Artifacts will be beautifully rendered here once the orchestration completes.
                    </p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className={`flex flex-col h-full bg-background ${className}`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="border-b border-border bg-background px-3 pt-3 pb-2 sticky top-0 z-20 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${currentTab.bgColor} ${currentTab.color}`}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-semibold text-foreground truncate">
                                {currentTab.label}
                            </h3>
                        </div>
                        <div className="flex items-center gap-1">

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={handleExportAll} className="text-xs cursor-pointer">
                                        <Archive className="mr-2 h-3.5 w-3.5" />
                                        Export Project (JSON)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleExportMarkdown} className="text-xs cursor-pointer">
                                        <FileText className="mr-2 h-3.5 w-3.5" />
                                        Export Spec (Markdown)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <TabsList className="grid grid-cols-8 w-full h-auto gap-0.5 bg-muted/30 p-0.5 rounded-md">
                        {agentTabs.map((tab) => {
                            const TabIcon = tab.icon
                            const hasData = tab.id === "summary" || !!artifacts[tab.id as keyof typeof artifacts]
                            return (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    disabled={!hasData}
                                    className="flex flex-col items-center gap-0.5 py-1 px-0.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-disabled:opacity-40 rounded text-[10px]"
                                >
                                    <TabIcon className={`h-3 w-3 ${hasData && activeTab === tab.id ? tab.color : "text-muted-foreground"}`} />
                                    <span className="text-[9px] font-medium truncate w-full text-center leading-tight">{tab.label.split(' ')[0]}</span>
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden relative">
                    <ScrollArea className="h-full w-full">
                        <div className="p-3 pb-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    {(() => {
                                        const artifact = artifacts[activeTab as keyof typeof artifacts]
                                        if (activeTab === "summary") return <ProjectSummary artifacts={artifacts} />
                                        if (!artifact) return <div className="text-xs text-muted-foreground p-4">No artifact data available</div>

                                        switch (activeTab) {
                                            case "pm_spec":
                                                const PMComp = PMSpecArtifact as any
                                                return <PMComp artifact={artifact} diagramId={diagramId} allArtifacts={artifacts} />
                                            case "arch_design":
                                                const ArchComp = ArchDesignArtifact as any
                                                return <ArchComp artifact={artifact} diagramId={diagramId} allArtifacts={artifacts} />
                                            case "devops_infrastructure":
                                                const DevOpsComp = DevOpsArtifact as any
                                                return <DevOpsComp artifact={artifact} diagramId={diagramId} allArtifacts={artifacts} />
                                            case "security_architecture":
                                                const SecurityComp = SecurityArtifact as any
                                                return <SecurityComp artifact={artifact} diagramId={diagramId} allArtifacts={artifacts} />
                                            case "engineer_impl":
                                                const EngComp = EngineerArtifact as any
                                                return <EngComp artifact={artifact} diagramId={diagramId} allArtifacts={artifacts} />
                                            case "ui_design":
                                                const UIComp = UIDesignArtifact as any
                                                return <UIComp artifact={artifact} diagramId={diagramId} allArtifacts={artifacts} />
                                            case "qa_verification":
                                                const QAComp = QAArtifact as any
                                                return <QAComp artifact={artifact} diagramId={diagramId} allArtifacts={artifacts} />
                                            default:
                                                return <div className="text-xs text-muted-foreground p-4">Unknown artifact type: {activeTab}</div>
                                        }
                                    })()}
                                </motion.div>
                            </AnimatePresence>

                            {/* Thought Stream for the current artifact */}
                            {(() => {
                                const step = (steps || []).find(s => s.step_id === activeTab)
                                if (!step?.thought) return null

                                return (
                                    <div className="mt-8 border-t border-blue-500/10 pt-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1 h-4 bg-blue-500/30 rounded-full" />
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70 dark:text-blue-400/70">
                                                Agent Reasoning Process
                                            </h4>
                                        </div>
                                        <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10">
                                            <div className="font-mono text-[11px] leading-relaxed text-muted-foreground/80 italic space-y-2">
                                                {typeof step.thought === 'string'
                                                    ? step.thought.split('\n').filter(Boolean).map((t: string, i: number) => (
                                                        <p key={i} className="flex gap-2">
                                                            <span className="text-blue-500/20 shrink-0 select-none">›</span>
                                                            <span>{t}</span>
                                                        </p>
                                                    ))
                                                    : <p>{JSON.stringify(step.thought)}</p>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    </ScrollArea>
                </div>
            </Tabs>
        </div>
    )
}
