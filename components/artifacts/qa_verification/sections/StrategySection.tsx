'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, Gauge, Activity, Database, Zap, FileText, Code2, FunctionSquare, GitBranch } from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container
} from "../../shared-components"

interface StrategySectionProps {
    testStrategy: any
    performanceMetrics: any
    coverage: any
}

export function StrategySection({
    testStrategy,
    performanceMetrics,
    coverage
}: StrategySectionProps) {
    return (
        <TabsContent key="strategy" value="strategy" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className={cn("border-none shadow-sm h-full", styles.colors.bgCard)}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Target className="h-4 w-4 text-purple-500" />
                                Testing Strategy
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {testStrategy.approach || "No strategy defined."}
                            </p>
                            {Array.isArray(testStrategy.types) && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {testStrategy.types.map((type: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-[10px] bg-purple-500/5 text-purple-600 border-purple-500/20">
                                            {type}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className={cn("border-none shadow-sm h-full", styles.colors.bgCard)}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Gauge className="h-4 w-4 text-emerald-500" />
                                Performance Goals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { label: 'API Response (P95)', val: performanceMetrics.api_response_time_p95, icon: Activity },
                                    { label: 'Page Load', val: performanceMetrics.page_load_time, icon: Gauge },
                                    { label: 'DB Query', val: performanceMetrics.database_query_time, icon: Database },
                                    { label: 'FCP', val: performanceMetrics.first_contentful_paint, icon: Zap },
                                    { label: 'TTI', val: performanceMetrics.time_to_interactive, icon: Activity },
                                    { label: 'LCP', val: performanceMetrics.largest_contentful_paint, icon: Gauge },
                                ].filter(m => m.val).map((m, i) => (
                                    <div key={i} className="bg-muted/30 p-2.5 rounded-lg border border-border/40 flex items-center justify-between group hover:bg-emerald-500/5 transition-colors">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-md bg-background border border-border/50">
                                                <m.icon className="h-3 w-3 text-emerald-500" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] uppercase font-bold text-muted-foreground">{m.label}</span>
                                                <span className="text-xs font-semibold text-foreground">{m.val}</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 animate-pulse" />
                                    </div>
                                ))}
                                {Object.keys(performanceMetrics).length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-xs italic">
                                        No performance metrics defined.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {coverage && (Object.keys(coverage).length > 1 || coverage.percentage !== undefined) && (
                    <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-500" />
                                Code Coverage Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-2">
                                {[
                                    { label: 'Lines', val: coverage.lines, icon: FileText },
                                    { label: 'Statements', val: coverage.statements, icon: Code2 },
                                    { label: 'Functions', val: coverage.functions, icon: FunctionSquare },
                                    { label: 'Branches', val: coverage.branches, icon: GitBranch }
                                ].map((item) => (
                                    <div key={item.label} className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <item.icon className="h-3.5 w-3.5" />
                                                <span>{item.label}</span>
                                            </div>
                                            <span className="font-mono font-bold">{item.val !== undefined ? `${item.val}%` : '—'}</span>
                                        </div>
                                        <Progress value={item.val ?? 0} className="h-1.5" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {Array.isArray(testStrategy.tools) && testStrategy.tools.length > 0 && (
                    <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500" />
                                Toolchain
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {testStrategy.tools.map((tool: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                                        <span className="text-xs font-medium">{tool}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </TabsContent>
    )
}
