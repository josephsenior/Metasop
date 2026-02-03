'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ListTodo, CheckCircle2 } from "lucide-react"
import {
    containerVariants as container
} from "../../shared-components"

interface RoadmapSectionProps {
    phases: any[]
    implementationPlan?: string
}

export function RoadmapSection({
    phases,
    implementationPlan
}: RoadmapSectionProps) {
    return (
        <TabsContent key="plan" value="plan" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                {phases.length > 0 ? (
                    <div className="space-y-4">
                        {phases.map((phase: any, i: number) => (
                            <Card key={i} className="border-border/50 shadow-sm overflow-hidden">
                                <div className="bg-muted/30 p-3 border-b border-border/50 flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono border border-emerald-500/20">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-foreground">{phase.name}</h3>
                                        <p className="text-[11px] text-muted-foreground">{phase.description}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-background/50 text-[10px] font-mono opacity-70">
                                        {phase.tasks.length} TASKS
                                    </Badge>
                                </div>
                                <div className="p-3 bg-card">
                                    <ul className="space-y-1.5">
                                        {phase.tasks.map((task: string, j: number) => (
                                            <li key={j} className="flex items-start gap-2.5 text-xs text-muted-foreground/90 leading-relaxed group">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/40 mt-0.5 shrink-0 group-hover:text-emerald-500 transition-colors" />
                                                <span className="group-hover:text-foreground transition-colors">{task}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : implementationPlan ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-emerald bg-card border border-border/50 p-6 rounded-xl">
                        <div className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{
                            __html: implementationPlan
                                .replace(/\\n/g, '\n')
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
                        }} />
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                        <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No roadmap defined.</p>
                    </div>
                )}
            </motion.div>
        </TabsContent>
    )
}
