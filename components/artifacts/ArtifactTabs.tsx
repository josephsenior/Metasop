"use client"

import {
    FileText,
    Shield,
    Server,
    Code,
    Palette,
    CheckCircle,
    LayoutDashboard
} from "lucide-react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export const agentTabs = [
    { id: "summary", label: "Summary", icon: LayoutDashboard, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { id: "pm_spec", label: "PM Spec", icon: FileText, color: "text-blue-600", bgColor: "bg-blue-500/10" },
    { id: "arch_design", label: "Architect", icon: FileText, color: "text-blue-600", bgColor: "bg-blue-500/10" },
    { id: "devops_infrastructure", label: "DevOps", icon: Server, color: "text-green-600", bgColor: "bg-green-500/10" },
    { id: "security_architecture", label: "Security", icon: Shield, color: "text-red-600", bgColor: "bg-red-500/10" },
    { id: "ui_design", label: "UI Designer", icon: Palette, color: "text-pink-600", bgColor: "bg-pink-500/10" },
    { id: "engineer_impl", label: "Engineer", icon: Code, color: "text-orange-600", bgColor: "bg-orange-500/10" },
    { id: "qa_verification", label: "QA", icon: CheckCircle, color: "text-teal-600", bgColor: "bg-teal-500/10" },
]

interface SidebarTabsProps {
    activeTab: string
    artifacts: any
}

export function SidebarTabs({ activeTab, artifacts }: SidebarTabsProps) {
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
    )
}

interface TopTabsProps {
    activeTab: string
    artifacts: any
}

export function TopTabs({ activeTab, artifacts }: TopTabsProps) {
    return (
        <TabsList className="flex items-center w-full h-auto gap-1 bg-muted/20 p-1 rounded-lg overflow-x-auto no-scrollbar scroll-smooth">
            {agentTabs.map((tab) => {
                const TabIcon = tab.icon
                const artifact = artifacts?.[tab.id as keyof typeof artifacts]
                const hasData = tab.id === "summary" || (!!artifact && (artifact?.content !== undefined || (typeof artifact === 'object' && artifact !== null && Object.keys(artifact).length > 0)))
                return (
                    <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        disabled={!hasData}
                        className="flex items-center gap-1.5 py-1.5 px-3 data-[state=active]:bg-background data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-disabled:opacity-40 rounded-md text-[10px] min-w-max transition-all"
                    >
                        <TabIcon className={cn("h-3.5 w-3.5", hasData && activeTab === tab.id ? tab.color : "text-muted-foreground")} />
                        <span className="font-semibold whitespace-nowrap">{tab.label}</span>
                    </TabsTrigger>
                )
            })}
        </TabsList>
    )
}
