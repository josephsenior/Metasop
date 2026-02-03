'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { RefreshCcw, Zap, GitBranch } from "lucide-react"
import { TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import { containerVariants as container, itemVariants as item } from "../../shared-components"

interface PipelineSectionProps {
    tools: string[]
    pipelineStages: any[]
    triggers: any[]
}

export function PipelineSection({ tools, pipelineStages, triggers }: PipelineSectionProps) {
    return (
        <TabsContent key="cicd" value="cicd" className="m-0 outline-none space-y-4">
            <motion.div variants={container} initial="hidden" animate="show">
                <Card className={cn("border-border/60 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                    <div className="bg-muted/30 border-b border-border/40 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <RefreshCcw className="h-4 w-4 text-orange-500" />
                            <h3 className={styles.typography.h3}>Pipeline Architecture</h3>
                        </div>
                        <div className="flex gap-1">
                            {tools.map((tool: string) => (
                                <Badge key={tool} variant="outline" className="text-[10px] font-mono bg-background text-muted-foreground">
                                    {tool}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 bg-muted/10">
                        <div className="relative">
                            {/* Connecting Line */}
                            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-linear-to-b from-orange-500/20 via-blue-500/20 to-emerald-500/20 hidden md:block" />

                            <div className="space-y-4">
                                {pipelineStages.map((stage: any, i: number) => (
                                    <motion.div
                                        key={i}
                                        variants={item}
                                        className="relative md:pl-10 group"
                                    >
                                        {/* Timeline Dot */}
                                        <div className="absolute left-[13px] top-3.5 h-3.5 w-3.5 rounded-full bg-background border-2 border-orange-500 z-10 hidden md:block group-hover:scale-110 transition-transform shadow-[0_0_0_2px_rgba(249,115,22,0.1)]" />

                                        <div className={cn(
                                            "border rounded-xl p-3 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all",
                                            styles.colors.bgCard, styles.colors.borderMuted
                                        )}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                                        <span className="text-muted-foreground font-mono text-xs opacity-50">0{i + 1}</span>
                                                        {stage.name}
                                                    </h4>
                                                    {stage.status && (
                                                        <Badge variant="outline" className={cn(
                                                            "text-[8px] h-4 px-1 uppercase",
                                                            stage.status === 'active' ? "text-emerald-500 border-emerald-500/30" : "text-amber-500 border-amber-500/30"
                                                        )}>
                                                            {stage.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    {i === 0 && <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200 text-[10px] h-5">START</Badge>}
                                                    {i === pipelineStages.length - 1 && <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200 text-[10px] h-5">DEPLOY</Badge>}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-3">{stage.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {stage.steps?.map((step: string, idx: number) => (
                                                    <div key={idx} className="bg-muted/50 px-2 py-1 rounded-md text-[10px] font-mono text-muted-foreground border border-border/40 flex items-center gap-1.5">
                                                        <div className="w-1 h-1 rounded-full bg-orange-400" />
                                                        {step}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {triggers.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {triggers.map((trigger: any, i: number) => (
                            <motion.div variants={item} key={i} className="flex items-center gap-3 p-3 bg-muted/20 border border-border/50 rounded-lg">
                                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                    <Zap className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trigger</div>
                                    <div className="text-sm font-semibold">{trigger.type}</div>
                                </div>
                                {trigger.branch && (
                                    <Badge variant="outline" className="ml-auto font-mono text-xs">
                                        <GitBranch className="h-3 w-3 mr-1" />
                                        {trigger.branch}
                                    </Badge>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </TabsContent>
    );
}
