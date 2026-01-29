"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, FileText, Shield, Server, Code, Palette, CheckCircle, Download, Archive, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { downloadFile, cn } from "@/lib/utils"
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
    activeTab?: string
    onTabChange?: (tab: string) => void
    sidebarMode?: boolean
}

const agentTabs = [
    { id: "summary", label: "Summary", icon: LayoutDashboard, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { id: "pm_spec", label: "PM Spec", icon: FileText, color: "text-blue-600", bgColor: "bg-blue-500/10" },
    { id: "arch_design", label: "Architect", icon: FileText, color: "text-blue-600", bgColor: "bg-blue-500/10" },
    { id: "devops_infrastructure", label: "DevOps", icon: Server, color: "text-green-600", bgColor: "bg-green-500/10" },
    { id: "security_architecture", label: "Security", icon: Shield, color: "text-red-600", bgColor: "bg-red-500/10" },
    { id: "ui_design", label: "UI Designer", icon: Palette, color: "text-pink-600", bgColor: "bg-pink-500/10" },
    { id: "engineer_impl", label: "Engineer", icon: Code, color: "text-orange-600", bgColor: "bg-orange-500/10" },
    { id: "qa_verification", label: "QA", icon: CheckCircle, color: "text-teal-600", bgColor: "bg-teal-500/10" },
]

export function ArtifactsPanel({ 
    diagramId, 
    artifacts, 
    steps, 
    className = "",
    activeTab: externalActiveTab,
    onTabChange,
    sidebarMode = false
}: ArtifactsPanelProps) {
    const { toast } = useToast()
    const [internalActiveTab, setInternalActiveTab] = useState("summary")
    
    const activeTab = externalActiveTab || internalActiveTab
    const setActiveTab = (tab: string) => {
        setInternalActiveTab(tab)
        onTabChange?.(tab)
    }

    // Debug: Log artifacts structure
    const artifactKeys = artifacts ? Object.keys(artifacts) : []
    console.log("[ArtifactsPanel] Artifacts received:", {
      artifactKeys,
      artifactCount: artifactKeys.length,
      sampleArtifacts: artifacts ? Object.entries(artifacts).slice(0, 2).map(([k, v]: [string, any]) => ({
        key: k,
        type: typeof v,
        isNull: v === null,
        hasContent: !!v?.content,
        isObject: typeof v === 'object' && v !== null,
        keys: typeof v === 'object' && v !== null ? Object.keys(v) : [],
        contentKeys: v?.content && typeof v.content === 'object' ? Object.keys(v.content) : []
      })) : []
    })
    
    const availableTabs = agentTabs.filter((tab) => {
      if (tab.id === "summary") return true // Always show summary
      const artifact = artifacts?.[tab.id as keyof typeof artifacts]
      
      if (!artifact) {
        console.log(`[ArtifactsPanel] Tab ${tab.id}: No artifact found`)
        return false
      }
      
      // Handle MetaSOPArtifact structure (has .content) or direct content
      const hasContent = artifact?.content !== undefined
      const hasData = typeof artifact === 'object' && artifact !== null && Object.keys(artifact).length > 0
      const isValid = hasContent || hasData
      
      console.log(`[ArtifactsPanel] Tab ${tab.id}:`, {
        hasContent,
        hasData,
        isValid,
        artifactType: typeof artifact,
        artifactKeys: typeof artifact === 'object' && artifact !== null ? Object.keys(artifact) : []
      })
      
      return isValid
    })
    
    console.log("[ArtifactsPanel] Available tabs:", availableTabs.map(t => t.id), "from artifact keys:", artifactKeys)
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
        <div className={cn("flex h-full bg-background min-h-0", sidebarMode ? "flex-row" : "flex-col", className)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className={cn("flex-1 flex min-h-0 overflow-hidden", sidebarMode ? "flex-row" : "flex-col")}>
                
                {/* Sidebar Mode Tabs */}
                {sidebarMode && (
                    <div className="w-48 shrink-0 border-r border-border bg-muted/10 hidden lg:flex flex-col">
                        <div className="p-4 border-b border-border">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                                Agent Reports
                            </h3>
                        </div>
                        <TabsList className="flex flex-col items-stretch w-full h-auto gap-1 bg-transparent p-2 rounded-none overflow-y-auto custom-scrollbar">
                            {agentTabs.map((tab) => {
                                const TabIcon = tab.icon
                                const artifact = artifacts?.[tab.id as keyof typeof artifacts]
                                const hasData = tab.id === "summary" || tab.id === "documents" || (!!artifact && (artifact?.content !== undefined || (typeof artifact === 'object' && artifact !== null && Object.keys(artifact).length > 0)))
                                return (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        disabled={!hasData}
                                        className="flex items-center gap-3 py-2.5 px-3 data-[state=active]:bg-blue-600/10 data-[state=active]:text-blue-600 data-disabled:opacity-40 rounded-lg text-xs justify-start transition-all hover:bg-muted/50"
                                    >
                                        <TabIcon className={cn("h-4 w-4", hasData && activeTab === tab.id ? tab.color : "text-muted-foreground")} />
                                        <span className="font-medium truncate">{tab.label}</span>
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>
                    </div>
                )}

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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

                        {/* Top Mode Tabs (only if not sidebar) */}
                        {!sidebarMode && (
                            <TabsList className="flex items-center w-full h-auto gap-0.5 bg-muted/30 p-0.5 rounded-md overflow-x-auto custom-scrollbar">
                                {agentTabs.map((tab) => {
                                    const TabIcon = tab.icon
                                    const artifact = artifacts?.[tab.id as keyof typeof artifacts]
                                    const hasData = tab.id === "summary" || tab.id === "documents" || (!!artifact && (artifact?.content !== undefined || (typeof artifact === 'object' && artifact !== null && Object.keys(artifact).length > 0)))
                                    return (
                                        <TabsTrigger
                                            key={tab.id}
                                            value={tab.id}
                                            disabled={!hasData}
                                            className="flex flex-col items-center gap-0.5 py-1 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-disabled:opacity-40 rounded text-[10px] min-w-[70px]"
                                        >
                                            <TabIcon className={`h-3 w-3 ${hasData && activeTab === tab.id ? tab.color : "text-muted-foreground"}`} />
                                            <span className="text-[9px] font-medium truncate w-full text-center leading-tight">{tab.label.split(' ')[0]}</span>
                                        </TabsTrigger>
                                    )
                                })}
                            </TabsList>
                        )}
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden relative">
                    <div className="h-full w-full overflow-y-auto custom-scrollbar p-3 pb-6">
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
                                        if (activeTab === "summary") return <ProjectSummary artifacts={artifacts} onTabChange={setActiveTab} />
                                        if (!artifact) return <div className="text-xs text-muted-foreground p-4">No artifact data available</div>

                                        switch (activeTab) {
                                            case "pm_spec":
                                                const PMComp = PMSpecArtifact as any
                                                return <PMComp artifact={artifact} diagramId={diagramId} allArtifacts={artifacts} className="max-w-full" />
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
                    </div>
                </div>
            </Tabs>
        </div>
    )
}
