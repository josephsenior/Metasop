'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Braces, Layers, ChevronRight, Puzzle, Database } from "lucide-react"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface TechnicalSectionProps {
    envVars: any[]
    technicalDecisions: any[]
    technicalPatterns: string[]
    stateManagement?: any
}

export function TechnicalSection({
    envVars,
    technicalDecisions,
    technicalPatterns,
    stateManagement
}: TechnicalSectionProps) {
    return (
        <TabsContent key="tech" value="tech" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {envVars.length > 0 && (
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-2 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                <Braces className="h-4 w-4 text-blue-500" />
                                Environment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 px-4 pb-4">
                            {envVars.map((env: any, i: number) => (
                                <motion.div
                                    key={i}
                                    variants={item}
                                    className="group bg-muted/20 border border-border/50 p-2.5 rounded-lg hover:border-blue-500/30 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{env.name}</span>
                                        <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase bg-background">System</Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground line-clamp-2">{env.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <code className="text-[10px] bg-muted px-1 py-0.5 rounded border border-border/50 text-foreground/80 font-mono break-all">
                                            {env.value}
                                        </code>
                                        {env.example && (
                                            <span className="text-[10px] text-muted-foreground italic border-l border-border/50 pl-2">
                                                ex: {env.example}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {technicalDecisions.length > 0 && (
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-2 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-500">
                                <Layers className="h-4 w-4" />
                                Tech Decisions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 px-4 pb-4">
                            {technicalDecisions.map((decision: any, i: number) => (
                                <motion.div
                                    key={i}
                                    variants={item}
                                    className="p-2.5 rounded-lg border border-amber-500/10 bg-amber-500/5 flex gap-2"
                                >
                                    <ChevronRight className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-none" />
                                    <div>
                                        <div className="font-semibold text-xs text-foreground mb-0.5">{decision.decision}</div>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">{decision.rationale}</p>
                                        {decision.alternatives && (
                                            <div className="mt-1.5 pt-1.5 border-t border-amber-500/10">
                                                <span className="text-[9px] font-bold text-amber-600/70 uppercase tracking-wider mr-1.5">Alternatives:</span>
                                                <span className="text-[9px] text-amber-700/60 italic">{decision.alternatives}</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {(technicalPatterns.length > 0 || stateManagement) && (
                    <Card className="border-border/50 shadow-sm md:col-span-2">
                        <CardHeader className="pb-2 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <Puzzle className="h-4 w-4" />
                                Architecture
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4">
                            {stateManagement && (
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Database className="h-3 w-3" />
                                        State Management
                                    </div>
                                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-2.5">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{stateManagement.tool}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground/80">{stateManagement.strategy}</p>
                                    </div>
                                </div>
                            )}

                            {technicalPatterns.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        Patterns
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {technicalPatterns.map((pattern: string, i: number) => (
                                            <Badge key={i} variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-5 bg-indigo-500/5 text-indigo-700 hover:bg-indigo-500/10 border-indigo-200/50 dark:border-indigo-800/50">
                                                {pattern}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </TabsContent>
    )
}
