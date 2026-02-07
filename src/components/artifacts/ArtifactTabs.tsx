"use client"

import { } from "react"
import {
    FileText,
    Shield,
    Server,
    Code,
    Palette,
    CheckCircle,
    LayoutDashboard,
    TrendingUp
} from "lucide-react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export const agentTabs = [
    { id: "summary", label: "Summary", icon: LayoutDashboard, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { id: "estimates", label: "Estimates", icon: TrendingUp, color: "text-orange-600", bgColor: "bg-orange-500/10" },
    { id: "pm_spec", label: "PM Spec", icon: FileText, color: "text-blue-600", bgColor: "bg-blue-500/10" },
    { id: "arch_design", label: "Architect", icon: FileText, color: "text-blue-600", bgColor: "bg-blue-500/10" },
    { id: "devops_infrastructure", label: "DevOps", icon: Server, color: "text-green-600", bgColor: "bg-green-500/10" },
    { id: "security_architecture", label: "Security", icon: Shield, color: "text-red-600", bgColor: "bg-red-500/10" },
    { id: "ui_design", label: "UI Designer", icon: Palette, color: "text-pink-600", bgColor: "bg-pink-500/10" },
    { id: "engineer_impl", label: "Engineer", icon: Code, color: "text-orange-600", bgColor: "bg-orange-500/10" },
    { id: "qa_verification", label: "QA", icon: CheckCircle, color: "text-teal-600", bgColor: "bg-teal-500/10" },
]

function getArtifactMeta(tabId: string, artifact: any) {
    if (!artifact || tabId === "summary") return null
    if (tabId === "estimates") {
        return { 
            summary: "Project time & cost estimates", 
            tags: ["Cost", "Timeline"],
            details: "Derived effort analysis and budget projection."
        }
    }
    const content = artifact?.content ?? artifact
    const count = (value: any) => (Array.isArray(value) ? value.length : 0)
    const build = (summary: string, tags: string[], details?: string) => ({ summary, tags, details })

    switch (tabId) {
        case "pm_spec": {
            const stories = count(content?.user_stories)
            const criteria = count(content?.acceptance_criteria)
            const summary = `${stories} stories, ${criteria} criteria`
            return build(summary, [`Stories:${stories}`, `Criteria:${criteria}`], content?.summary || content?.description)
        }
        case "arch_design": {
            const apis = count(content?.apis)
            const tables = count(content?.database_schema?.tables)
            const summary = `${apis} APIs, ${tables} tables`
            return build(summary, [`APIs:${apis}`, `Tables:${tables}`], content?.summary || content?.description)
        }
        case "security_architecture": {
            const threats = count(content?.threat_model)
            const controls = count(content?.security_controls)
            const summary = `${threats} threats, ${controls} controls`
            return build(summary, [`Threats:${threats}`, `Controls:${controls}`], content?.summary || content?.description)
        }
        case "devops_infrastructure": {
            const stages = count(content?.cicd?.pipeline_stages)
            const services = count(content?.infrastructure?.services)
            const summary = `${stages} stages, ${services} services`
            return build(summary, [`Stages:${stages}`, `Services:${services}`], content?.summary || content?.description)
        }
        case "ui_design": {
            const pages = count(content?.website_layout?.pages)
            const components = count(content?.component_specs)
            const summary = `${pages} pages, ${components} components`
            return build(summary, [`Pages:${pages}`, `Components:${components}`], content?.summary || content?.description)
        }
        case "engineer_impl": {
            const deps = count(content?.dependencies)
            const hasFiles = content?.file_structure ? "Yes" : "No"
            const summary = `${deps} deps, files ${hasFiles}`
            return build(summary, [`Deps:${deps}`, `Files:${hasFiles}`], content?.summary || content?.description)
        }
        case "qa_verification": {
            const cases = count(content?.test_cases)
            const summary = `${cases} test cases`
            return build(summary, [`Tests:${cases}`], content?.summary || content?.description)
        }
        default:
            return null
    }
}

interface SidebarTabsProps {
    activeTab: string
    artifacts: any
    modifiedArtifacts?: string[]
}

export function SidebarTabs({ activeTab, artifacts, modifiedArtifacts = [] }: SidebarTabsProps) {

    return (
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
                    const hasData = tab.id === "summary" || (!!artifact && (artifact?.content !== undefined || (typeof artifact === 'object' && artifact !== null && Object.keys(artifact).length > 0)))
                    const isModified = modifiedArtifacts.includes(tab.id)
                    const meta = getArtifactMeta(tab.id, artifact)
                    const tags = meta?.tags ?? []
                    return (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            disabled={!hasData}
                            className="flex items-start gap-3 py-2.5 px-3 data-[state=active]:bg-blue-600/10 data-[state=active]:text-blue-600 data-disabled:opacity-40 rounded-lg text-xs justify-start transition-all hover:bg-muted/50 relative group"
                        >
                            <TabIcon className={cn("h-4 w-4", hasData && activeTab === tab.id ? tab.color : "text-muted-foreground")} />
                            <div className="min-w-0 flex-1">
                                <div className="font-medium truncate flex items-center gap-1.5">
                                    {tab.label}
                                    {isModified && (
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)] animate-pulse" />
                                    )}
                                </div>
                                {meta?.summary && (
                                    <div className="text-[9px] text-muted-foreground/80 truncate">
                                        {meta.summary}
                                    </div>
                                )}
                                {tags.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {tags.slice(0, 2).map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-[8px] px-1.5 py-0 bg-muted/60">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsTrigger>
                    )
                })}
            </TabsList>
        </div>
    )
}

interface TopTabsProps {
    activeTab: string
    artifacts: any
    modifiedArtifacts?: string[]
}

export function TopTabs({ activeTab, artifacts, modifiedArtifacts = [] }: TopTabsProps) {
    return (
        <TabsList className="flex items-center w-full h-auto gap-1 bg-muted/20 p-1 rounded-lg overflow-x-auto no-scrollbar scroll-smooth">
            {agentTabs.map((tab) => {
                const TabIcon = tab.icon
                const artifact = artifacts?.[tab.id as keyof typeof artifacts]
                const hasData = tab.id === "summary" || (!!artifact && (artifact?.content !== undefined || (typeof artifact === 'object' && artifact !== null && Object.keys(artifact).length > 0)))
                const meta = getArtifactMeta(tab.id, artifact)
                const isModified = modifiedArtifacts.includes(tab.id)
                return (
                    <TooltipProvider key={tab.id}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <TabsTrigger
                                    value={tab.id}
                                    disabled={!hasData}
                                    className="flex items-center gap-1.5 py-1.5 px-3 data-[state=active]:bg-background data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-disabled:opacity-40 rounded-md text-[10px] min-w-max transition-all relative"
                                >
                                    <TabIcon className={cn("h-3.5 w-3.5", hasData && activeTab === tab.id ? tab.color : "text-muted-foreground")} />
                                    <span className="font-semibold whitespace-nowrap flex items-center gap-1">
                                        {tab.label}
                                        {isModified && (
                                            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                        )}
                                    </span>
                                </TabsTrigger>
                            </TooltipTrigger>
                            {meta?.summary && (
                                <TooltipContent side="bottom" className="max-w-[220px]">
                                    <div className="text-xs space-y-1">
                                        <div className="font-semibold text-foreground flex items-center justify-between">
                                            {tab.label}
                                            {isModified && <Badge className="text-[8px] h-3 px-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Recently Modified</Badge>}
                                        </div>
                                        <div className="text-muted-foreground">{meta.summary}</div>
                                        {meta.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {meta.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 bg-muted/60">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                )
            })}
        </TabsList>
    )
}
