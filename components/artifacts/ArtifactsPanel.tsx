"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs } from "@/components/ui/tabs"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// Import modular tab components
import { agentTabs, SidebarTabs, TopTabs } from "./ArtifactTabs"

// Import all artifact display components
import ProjectSummary from "@/components/artifacts/ProjectSummary"
import ProjectEstimates from "@/components/artifacts/ProjectEstimates"
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

export function ArtifactsPanel({
    diagramId,
    artifacts,
    steps,
    className = "",
    activeTab: externalActiveTab,
    onTabChange,
    sidebarMode = false
}: ArtifactsPanelProps) {
    const [internalActiveTab, setInternalActiveTab] = useState("summary")

    const activeTab = externalActiveTab || internalActiveTab
    const setActiveTab = (tab: string) => {
        setInternalActiveTab(tab)
        onTabChange?.(tab)
    }

    const availableTabs = agentTabs.filter((tab) => {
        if (tab.id === "summary") return true
        if (tab.id === "estimates") {
            // Estimates are available if we have at least one real artifact
            return Object.keys(artifacts || {}).some(k => artifacts[k as keyof typeof artifacts])
        }
        const artifact = artifacts?.[tab.id as keyof typeof artifacts]
        if (!artifact) return false
        return artifact?.content !== undefined || (typeof artifact === 'object' && artifact !== null && Object.keys(artifact).length > 0)
    })

    const currentTab = agentTabs.find(t => t.id === activeTab) || agentTabs[0]
    const Icon = currentTab.icon

    if (availableTabs.length <= 1 && activeTab === "summary" && artifacts && Object.keys(artifacts).length === 0) {
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
                {sidebarMode && <SidebarTabs activeTab={activeTab} artifacts={artifacts} />}

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
                        </div>

                        {/* Top Mode Tabs (only if not sidebar) */}
                        {!sidebarMode && <TopTabs activeTab={activeTab} artifacts={artifacts} />}
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
                                        if (activeTab === "estimates") return <ProjectEstimates artifacts={artifacts} />
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
