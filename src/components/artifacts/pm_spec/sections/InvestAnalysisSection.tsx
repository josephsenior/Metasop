'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GanttChartSquare, Check, X, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface InvestAnalysisSectionProps {
    investAnalysis: any[]
}

function computeInvestScore(item: any): number {
    if (typeof item?.score === "number" && Number.isFinite(item.score)) return item.score
    const keys = ["independent", "negotiable", "valuable", "estimatable", "small", "testable"] as const
    const total = keys.reduce((acc, k) => acc + (item?.[k] ? 1 : 0), 0)
    return Math.round((total / keys.length) * 10)
}

export function InvestAnalysisSection({
    investAnalysis
}: InvestAnalysisSectionProps) {
    return (
        <TabsContent key="invest" value="invest" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                {investAnalysis.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-2xl border-muted">
                        <GanttChartSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-muted-foreground">No INVEST analysis available.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        {investAnalysis.map((dataItem: any, i: number) => (
                            <motion.div key={i} variants={item}>
                                {(() => {
                                    const score = computeInvestScore(dataItem)
                                    return (
                                <Card className="overflow-hidden border border-border/50 shadow-sm relative group hover:border-blue-500/30 transition-all">
                                    <div className={cn("absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-colors",
                                        score >= 9 ? "bg-emerald-500" :
                                            score >= 7 ? "bg-blue-500" :
                                                score >= 5 ? "bg-amber-500" : "bg-red-500"
                                    )} />
                                    <CardHeader className="pb-3 px-5 pt-4 flex flex-row items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono font-bold text-muted-foreground/60">{dataItem.user_story_id}</span>
                                                <div className="h-5 w-px bg-border/60 mx-1" />
                                                <CardTitle className="text-sm font-semibold">Quality Analysis</CardTitle>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn("font-mono font-bold",
                                            score >= 9 ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" :
                                                score >= 7 ? "text-blue-600 bg-blue-500/10 border-blue-500/20" :
                                                    score >= 5 ? "text-amber-600 bg-amber-500/10 border-amber-500/20" :
                                                        "text-red-600 bg-red-500/10 border-red-500/20"
                                        )}>
                                            SCORE: {score}/10
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="px-5 pb-5">
                                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4">
                                            {[
                                                { k: 'Independent', v: dataItem.independent },
                                                { k: 'Negotiable', v: dataItem.negotiable },
                                                { k: 'Valuable', v: dataItem.valuable },
                                                { k: 'Estimatable', v: dataItem.estimatable },
                                                { k: 'Small', v: dataItem.small },
                                                { k: 'Testable', v: dataItem.testable },
                                            ].map((prop, j) => (
                                                <div key={j} className="flex items-center gap-2 text-xs">
                                                    {prop.v ?
                                                        <Check className="h-3.5 w-3.5 text-emerald-500" /> :
                                                        <X className="h-3.5 w-3.5 text-muted-foreground/40" />
                                                    }
                                                    <span className={cn(prop.v ? "text-foreground" : "text-muted-foreground line-through decoration-muted-foreground/30")}>
                                                        {prop.k}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {dataItem.comments && (
                                            <div className="text-xs text-muted-foreground/80 bg-muted/30 p-2.5 rounded-lg border border-border/30 italic leading-relaxed flex gap-2">
                                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500/60 mt-0.5 shrink-0" />
                                                {dataItem.comments}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                                    )
                                })()}
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </TabsContent>
    )
}
